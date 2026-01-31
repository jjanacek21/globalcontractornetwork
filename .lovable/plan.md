
# Fix ManufacturerNOASearch - Edge Function Not Extracting Data

## Problem Identified
The logs reveal that Firecrawl is successfully returning results (70 total across 3 searches), but the edge function is extracting **0 NOA products**. Two issues exist:

1. **Regex pattern too strict**: The NOA number extraction regex only matches a very specific format (`\d{2}-\d{4}\.\d{2}`) and misses variations
2. **PDF URL logic too restrictive**: Only captures URLs ending in `.pdf`, but search results return landing pages with PDF links embedded

## Solution

### Fix 1: Improve NOA Number Extraction Regex
Update the regex to capture more NOA formats:
- `21-0123.01` (current format)
- `21-1234.02` 
- `NOA No. 21-1234.01`
- `NOA# 21-1234.01`

Also add extraction for product names and better data parsing from Firecrawl results.

### Fix 2: Better PDF URL Handling
Instead of only capturing URLs with `.pdf` extension:
- Extract any URL from the result as a reference
- The PDFViewerDialog will work with landing pages too (using Google Docs viewer fallback)
- Store the page URL so users can navigate to find the PDF

### Fix 3: Add Fallback Data Extraction
Parse additional data patterns from the content:
- Product names from page titles
- Expiration dates if mentioned
- Category information

## Implementation Changes

### File: `supabase/functions/search-manufacturer-noas/index.ts`

**1. Update NOA regex pattern (multiple locations)**:
```typescript
// Old: /NOA\s*(?:No\.?\s*)?(\d{2}-\d{4}\.\d{2})/gi
// New: Handle more formats
const noaPatterns = [
  /NOA\s*(?:No\.?\s*)?#?\s*(\d{2}-\d{4}\.\d{2})/gi,  // Standard format
  /(\d{2}-\d{4}\.\d{2})/gi,                           // Just the number
];
```

**2. Improve PDF URL extraction**:
```typescript
// Store any URL from results, not just .pdf URLs
pdf_url: result.url || null,  // Instead of checking for .pdf
```

**3. Add better product name parsing**:
```typescript
// Extract meaningful product names from titles
const productName = result.title?.split(' - ')[0] || 
                   result.title?.split('|')[0]?.trim() ||
                   `${manufacturer} Product`;
```

**4. Add logging to debug why extraction fails**:
```typescript
console.log(`Processing result: ${result.title}, URL: ${result.url}`);
console.log(`Content preview: ${result.content?.substring(0, 200)}`);
```

## Files to Modify
| File | Change |
|------|--------|
| `supabase/functions/search-manufacturer-noas/index.ts` | Fix regex patterns, improve URL extraction, add debugging |

## Expected Outcome
After this fix:
- The search will extract NOA products from Firecrawl results
- Results will include page URLs that users can view
- PDFViewerDialog will show the landing pages (which often contain embedded PDFs or links to them)
- Users can find the actual PDF documents from these pages
