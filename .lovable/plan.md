
# Fix: Training Data Extraction and Display Issues

## Problem Summary
After uploading and processing training packets, the Training Details dialog shows:
- Quality Score: "Not Analyzed"
- Extracted Data: "No extracted document data available"
- Key Features: "No key features extracted yet"
- Analytics: 0 products extracted, 0 field mappings

## Root Causes Identified

### 1. AI JSON Parsing Failures
The edge function logs show the AI is returning malformed JSON or non-JSON responses:
```
SyntaxError: Expected ',' or ']' after array element in JSON at position 10776
Error: No JSON found in response
```

### 2. Database Column Mismatch
The edge function tries to save `key_features` but this column doesn't exist in the `permit_packet_training` table. The existing columns are:
- `packet_structure` (JSONB) - stores nested data
- `extracted_documents` (JSONB) - stores document list
- No standalone `key_features` column exists

### 3. Silent Update Failures
When the database update fails (due to non-existent column), the entire update silently fails, leaving `quality_score`, `extracted_documents`, and `packet_structure` empty.

### 4. Required Fields Missing
The `product_approvals` insert may fail due to missing required `product_name` when AI parsing fails.

---

## Implementation Plan

### Step 1: Fix the Edge Function JSON Parsing

**File:** `supabase/functions/permit-packet-analyzer/index.ts`

Add more robust JSON extraction with multiple fallback strategies:

```typescript
// Enhanced JSON parsing with multiple strategies
function extractJSON(content: string): any {
  // Strategy 1: Find JSON between code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }
  
  // Strategy 2: Find outermost JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }
  
  // Strategy 3: Try to fix common JSON issues
  let cleaned = content
    .replace(/,\s*\}/g, '}')    // Remove trailing commas
    .replace(/,\s*\]/g, ']')    // Remove trailing commas in arrays
    .replace(/'/g, '"');         // Replace single quotes
    
  const cleanedMatch = cleaned.match(/\{[\s\S]*\}/);
  if (cleanedMatch) {
    try {
      return JSON.parse(cleanedMatch[0]);
    } catch {}
  }
  
  return null;
}
```

### Step 2: Remove Non-Existent Column from Update

**File:** `supabase/functions/permit-packet-analyzer/index.ts`

Remove the `key_features` field from the update query since it doesn't exist:

```typescript
const updateData: Record<string, any> = {
  processing_status: "completed",
  processed_at: new Date().toISOString(),
  quality_score: analysisResult.qualityScore,
  example_description: analysisResult.exampleDescription || trainingRecord.example_description,
  extracted_documents: analysisResult.packetStructure,
  // key_features: analysisResult.keyFeatures,  // REMOVE - column doesn't exist
  packet_structure: {
    documents: analysisResult.packetStructure,
    keyFeatures: analysisResult.keyFeatures,  // Store here instead
    // ... rest of packet_structure
  },
  // ...
};
```

### Step 3: Add Fallback Quality Score on Parse Failure

Ensure that even on parsing failure, we save something useful:

```typescript
} catch (parseError) {
  console.error("[permit-packet-analyzer] Failed to parse AI response:", parseError);
  
  // Save the raw AI response for debugging
  analysisResult = {
    productApprovals: [],
    formFieldMappings: [],
    jurisdictionRules: [],
    tradeSpecificData: { /* defaults */ },
    packetStructure: [],
    extractedFields: {},
    jurisdictionPatterns: [],
    qualityScore: 0.3,  // Lower score indicates parsing failed
    keyFeatures: ["Parsing failed - manual review needed"],
    exampleDescription: "AI response could not be parsed. Raw: " + aiContent.substring(0, 300),
    commonDocuments: [],
    processingNotes: [
      "AI response parsing failed",
      `Error: ${parseError.message || 'Unknown'}`,
      "Consider re-running analysis"
    ],
  };
}
```

### Step 4: Guard Against Missing Required Fields in Inserts

Add null checks before inserting into `product_approvals`:

```typescript
if (!existingCheck && 
    (approval.noaNumber || approval.flApprovalNumber) &&
    approval.manufacturer &&
    approval.productName) {  // Ensure required fields exist
  const { error: insertError } = await supabase.from("product_approvals").insert({
    manufacturer: approval.manufacturer,
    product_name: approval.productName || "Unknown Product",  // Fallback
    // ...
  });
}
```

### Step 5: Improve AI Prompt for Cleaner JSON

Add explicit instructions to the AI to return clean JSON:

```typescript
const systemPrompt = `...existing prompt...

CRITICAL JSON FORMATTING RULES:
1. Return ONLY the JSON object - no markdown, no code blocks, no explanations
2. Do NOT include trailing commas
3. Use double quotes for all strings
4. Ensure all arrays and objects are properly closed
5. If a value is unknown, use null (not empty string or undefined)`;
```

### Step 6: Update TrainingDetailDialog to Show Fallback Info

**File:** `src/components/admin/TrainingDetailDialog.tsx`

Improve data reading with better fallbacks:

```typescript
// Extract key_features from packet_structure if available
const packetData = sample.packet_structure || {};
const keyFeatures: string[] = Array.isArray(packetData.keyFeatures)
  ? packetData.keyFeatures
  : packetData.processingNotes || [];  // Fallback to processingNotes

// Show raw AI response if parsing failed
const showDebugInfo = packetData.processingNotes?.includes("AI response parsing failed");
```

### Step 7: Add Debug Panel in TrainingDetailDialog

Add a hidden "Debug" tab for admins to see raw packet_structure data when troubleshooting:

```tsx
<TabsTrigger value="debug" className="text-xs">Debug</TabsTrigger>

<TabsContent value="debug">
  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">
    {JSON.stringify(sample.packet_structure, null, 2)}
  </pre>
</TabsContent>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/permit-packet-analyzer/index.ts` | Fix JSON parsing, remove non-existent column, add guards, improve prompt |
| `src/components/admin/TrainingDetailDialog.tsx` | Better fallbacks, optional debug panel |

---

## Testing Plan

After implementation:
1. Re-run analysis on a failed sample (click Retry)
2. Verify the Processing status changes properly
3. Open Training Details dialog and confirm:
   - Quality Score shows a percentage (even if low)
   - Extracted Data or processingNotes are visible
   - Key Features shows data or fallback message
4. Check Analytics tab for updated counts

---

## Technical Summary

The core issue is that the AI sometimes returns malformed JSON that fails to parse, and additionally the edge function was trying to write to a non-existent `key_features` column which caused the entire database update to fail. The fix involves:

1. More robust JSON parsing with multiple fallback strategies
2. Removing the invalid `key_features` column reference
3. Storing key features inside the `packet_structure` JSONB field instead
4. Better error handling to always save meaningful data even on failures
5. UI improvements to display fallback/debug information
