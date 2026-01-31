

# Fix PDF Preview in ManufacturerNOASearch

## Problem Identified
The PDF preview no longer works because the edge function is now returning **landing page URLs** (HTML pages) instead of **direct PDF file URLs**. 

**Example of what's being returned:**
- `https://www.miamidade.gov/apps/dpmbuilding/search/results.aspx?...` (HTML page)

**What the PDFViewerDialog expects:**
- `https://www.miamidade.gov/building/noa-documents/21-1234.01.pdf` (Direct PDF)

The Google Docs viewer fallback only works with actual PDF file URLs, not HTML landing pages.

## Solution Options

### Option A: Construct Direct PDF URLs (Recommended)
Miami-Dade uses a predictable URL pattern for NOA PDFs:
```
https://www.miamidade.gov/building/noa-documents/{NOA_NUMBER}.pdf
```

Update the edge function to construct the correct PDF URL based on the NOA number instead of using the search result URL.

### Option B: Add "Open in New Tab" Fallback
For URLs that aren't direct PDFs, provide a button to open the landing page in a new browser tab so users can navigate to the PDF manually.

## Implementation Plan

### Step 1: Update Edge Function PDF URL Logic
Modify `supabase/functions/search-manufacturer-noas/index.ts`:

```typescript
// Helper function to construct Miami-Dade NOA PDF URL
function getMiamiDadePdfUrl(noaNumber: string): string {
  // Miami-Dade stores NOA PDFs at a predictable location
  return `https://www.miamidade.gov/building/noa-documents/${noaNumber}.pdf`;
}
```

Then use this function when adding Miami-Dade results:
```typescript
pdf_url: getMiamiDadePdfUrl(noaNumber), // Direct PDF URL
```

### Step 2: Add Fallback "Open Page" Button for Non-PDF URLs
Update `ManufacturerNOASearch.tsx` to detect non-PDF URLs and show an alternative "Open Page" button that opens in a new tab.

### Step 3: Improve PDFViewerDialog URL Detection
Update the viewer to better detect when a URL is not a direct PDF and show appropriate messaging.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/search-manufacturer-noas/index.ts` | Add helper to construct direct Miami-Dade PDF URLs, use for pdf_url field |
| `src/components/permit-queens/admin/ManufacturerNOASearch.tsx` | Add fallback "Open in New Tab" button for non-PDF URLs |

## Technical Details

### Miami-Dade NOA PDF URL Pattern
Based on the official Miami-Dade NOA database, PDFs are stored at:
```
https://www.miamidade.gov/building/noa-documents/{NOA-NUMBER}.pdf
```

Example:
- NOA Number: `21-0123.01`
- PDF URL: `https://www.miamidade.gov/building/noa-documents/21-0123.01.pdf`

### Florida Building Approvals
Florida Building uses a different system - we may need to store the landing page URL and provide an "Open in Browser" option for these.

## Expected Outcome
- Clicking "View PDF" for Miami-Dade NOAs will open the actual PDF document
- For other sources (Florida Building, manufacturer sites), a fallback option to open in new tab will be available
- The PDF preview will work reliably again

