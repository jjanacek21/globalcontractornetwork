

# Fix: Training Data Extraction and Display Issues

## Problem Summary

Based on investigating the database and edge function, I found these issues:

1. **JSON parsing is failing despite valid JSON** - The AI IS returning correct product approvals, NOA numbers, etc. inside markdown code blocks, but the parser can't extract it
2. **503 errors** - The Vision API sometimes returns service unavailable errors, especially for large scanned PDFs
3. **No retry logic** - When the API fails, there's no automatic retry
4. **Handwritten documents** - These are harder to OCR but Gemini can handle them with the right approach
5. **Raw code showing in UI** - When parsing fails, the fallback stores truncated raw JSON which looks like "computer code" to users

---

## Root Cause: JSON Parsing

Looking at the database, the AI response shows valid JSON like:
```
```json
{
  "productApprovals": [
    {
      "manufacturer": "Birdview Skylights, LLC",
      "productName": "CMDADE Curb Mounted & 6SF Self Flashing Skylights",
      "noaNumber": "NOA-24-0401.06",
      ...
```

The current `extractJSON()` function has a regex issue - it's not properly extracting the content between the code blocks when the JSON is very large or contains special characters.

---

## Implementation Plan

### 1. Improve JSON Extraction in Edge Function

**File:** `supabase/functions/permit-packet-analyzer/index.ts`

Add a more robust JSON extractor that:
- Handles markdown code blocks with various formats
- Extracts JSON even when truncated
- Attempts to repair common JSON issues
- Logs detailed debugging info

```typescript
function extractJSON(content: string): any {
  console.log("[permit-packet-analyzer] Attempting JSON extraction, content length:", content.length);
  
  // Strategy 1: Remove markdown code blocks wrapper first
  let cleanContent = content.trim();
  
  // Check if wrapped in ```json ... ```
  const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/m;
  const codeBlockMatch = cleanContent.match(codeBlockRegex);
  if (codeBlockMatch) {
    cleanContent = codeBlockMatch[1].trim();
    console.log("[permit-packet-analyzer] Extracted from code block, length:", cleanContent.length);
  }
  
  // Strategy 2: Find content between first { and last }
  const firstBrace = cleanContent.indexOf('{');
  const lastBrace = cleanContent.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
  }
  
  // Strategy 3: Try direct parse
  try {
    return JSON.parse(cleanContent);
  } catch (e) {
    console.log("[permit-packet-analyzer] Direct parse failed, trying repairs...");
  }
  
  // Strategy 4: Fix common JSON issues
  let repaired = cleanContent
    .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
    .replace(/\n/g, ' ')            // Remove newlines
    .replace(/\r/g, '')             // Remove carriage returns
    .replace(/\t/g, ' ')            // Replace tabs with spaces
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\\'/g, "'");           // Fix escaped single quotes
  
  try {
    return JSON.parse(repaired);
  } catch (e) {
    console.log("[permit-packet-analyzer] Repaired parse failed");
  }
  
  return null;
}
```

### 2. Add Retry Logic for 503 Errors

Add automatic retry with exponential backoff for transient API failures:

```typescript
async function callVisionAPIWithRetry(
  url: string,
  body: object,
  headers: Record<string, string>,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    
    // Success or client error (no retry)
    if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
      return response;
    }
    
    // Retry on 503 (Service Unavailable) or 429 (Rate Limit)
    if (response.status === 503 || response.status === 429) {
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`[permit-packet-analyzer] Retry ${attempt}/${maxRetries} after ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      lastError = new Error(`API returned ${response.status}`);
      continue;
    }
    
    // Other errors - don't retry
    return response;
  }
  
  throw lastError || new Error("Max retries exceeded");
}
```

### 3. Better AI Prompt for Handwritten Documents

Add OCR-specific instructions to handle scanned/handwritten content:

```typescript
const systemPrompt = `...existing prompt...

IMPORTANT OCR/SCANNING NOTES:
- Some documents may be handwritten or poorly scanned
- Do your best to read handwritten text - common handwritten fields include signatures, dates, and addresses
- If text is illegible, use null for that field
- For handwritten numeric values (permit numbers, square footage), extract what you can read
- Focus on typed/printed text first, then attempt handwritten sections
- NEVER guess at illegible text - leave as null

CRITICAL JSON FORMATTING:
1. Return ONLY the JSON object - no markdown code blocks, no explanations before or after
2. Start your response with { and end with }
3. Do NOT wrap in \`\`\`json code blocks
4. Use null (not "null" string) for missing values
5. Ensure all arrays and objects are properly closed`;
```

### 4. Improve UI Display for Partial Extraction

**File:** `src/components/admin/TrainingDetailDialog.tsx`

Add better display of partial data and product approvals from the raw response:

- Try to parse product approvals from the raw `example_description` if it contains valid data
- Show extracted products in a user-friendly format instead of raw JSON
- Add a "Re-analyze" button to retry failed extractions
- Improve the "Extracted Data" tab to show product approval cards

### 5. Add Product Approvals Tab to Training Details

When parsing fails but the raw JSON contains valid product data, extract and display it:

```typescript
// Try to recover product approvals from raw example_description
function extractProductApprovalsFromRaw(raw: string): any[] {
  if (!raw || !raw.includes('productApprovals')) return [];
  
  try {
    // Find the productApprovals array
    const match = raw.match(/"productApprovals"\s*:\s*\[([\s\S]*?)\]/);
    if (match) {
      // Try to parse individual products
      const arrayContent = '[' + match[1] + ']';
      return JSON.parse(arrayContent);
    }
  } catch (e) {
    // Silent fail - return empty array
  }
  return [];
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/permit-packet-analyzer/index.ts` | Improve JSON extraction, add retry logic, update AI prompt |
| `src/components/admin/TrainingDetailDialog.tsx` | Better display of partial data, product approval cards, re-analyze button |

---

## Summary

The core fix is improving the JSON extraction to handle the AI's response format better. The AI is returning good data - we just need to parse it correctly. Additionally:

1. **Better JSON parsing** with multiple fallback strategies
2. **Retry logic** for transient 503/429 errors
3. **Updated AI prompt** to not use code blocks and handle handwritten text
4. **UI improvements** to show extracted products even when full parsing fails
5. **Re-analyze button** so admins can retry failed extractions easily

