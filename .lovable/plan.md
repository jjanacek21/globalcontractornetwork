
# Fix PDF Preview Issues in Product Approvals

## Problem Summary

Based on my investigation, there are **multiple root causes** for why some NOA previews work and others show "No preview available":

### Issue 1: Miami-Dade PDF URLs Return 404 for Some Products

Some products have correctly formatted URLs that point to **non-existent files** on Miami-Dade's server. The PDFViewerDialog correctly uses the Google Docs viewer fallback for government sites, but if the underlying PDF doesn't exist, Google Docs displays "No preview available."

**Evidence:**
- "GAF - Timberline AS II" has URL `https://www.miamidade.gov/building/library/productcontrol/noa/21031202.pdf` - works
- "CertainTeed - Grand Manor" has URL `https://www.miamidade.gov/building/library/productcontrol/noa/20045605.pdf` - shows "No preview available" (likely 404)

### Issue 2: Malformed Miami-Dade URLs

3 products have incorrectly formatted URLs with extra prefixes that will never resolve:
- `https://www.miamidade.gov/building/library/productcontrol/noa/No: 25012112.pdf` (contains spaces and colon)
- `https://www.miamidade.gov/building/library/productcontrol/noa/NOA22070609.pdf` (contains "NOA" prefix)

### Issue 3: 627 Products Have No PDF URL

These products have `file_url = NULL` and show no preview option at all.

---

## Solution Plan

### Step 1: Fix Malformed URLs (Database Cleanup)

Create a migration to correct the 3 malformed Miami-Dade URLs by extracting just the NOA number digits:

```sql
-- Fix URLs with "No: " prefix
UPDATE product_approvals 
SET file_url = REGEXP_REPLACE(file_url, 'No: ', '')
WHERE file_url LIKE '%miamidade.gov%/noa/No: %';

-- Fix URLs with "NOA" prefix in the filename
UPDATE product_approvals 
SET file_url = REGEXP_REPLACE(
  file_url, 
  '/noa/NOA([0-9]+)\.pdf', 
  '/noa/\1.pdf'
)
WHERE file_url LIKE '%miamidade.gov%/noa/NOA%';
```

### Step 2: Improve PDFViewerDialog Error Handling

Update the `PDFViewerDialog` component to:
1. **Detect 404 errors** when the Google Docs viewer fails (currently shows generic "No preview")
2. **Show clearer messaging** like "Document not found at Miami-Dade" with the option to search for it
3. **Add "Search Miami-Dade NOA" button** that links directly to the search page

### Step 3: Add URL Validation in ProductApprovalsManagement

Update the admin table to show a **warning badge** when a product has:
- A Miami-Dade URL that hasn't been verified
- A malformed URL pattern

### Step 4: Add Bulk PDF Verification Tool (Optional)

Create a new admin tool that:
1. Checks all Miami-Dade URLs to see if they return 200 or 404
2. Flags products with broken URLs
3. Attempts to construct correct URLs using the NOA number

---

## Files to Modify

| File | Change |
|------|--------|
| Database Migration | Fix 3 malformed URLs |
| `src/components/ui/PDFViewerDialog.tsx` | Improve error detection and messaging for 404s |
| `src/components/admin/ProductApprovalsManagement.tsx` | Add warning badge for unverified URLs |

---

## Technical Details

### Miami-Dade PDF URL Pattern

The correct pattern is:
```
https://www.miamidade.gov/building/library/productcontrol/noa/{NOA_NUMBER_WITHOUT_DASHES_OR_DOTS}.pdf
```

For NOA number `21-0312.02`, the file is `21031202.pdf`.

### Google Docs Viewer Behavior

When Google Docs viewer encounters a 404 or inaccessible PDF, it displays "No preview available" rather than an error. The PDFViewerDialog currently cannot distinguish between:
- A loading PDF
- A 404 PDF
- A CORS-blocked PDF

### Current Statistics

| Status | Count |
|--------|-------|
| Total Products | 2,481 |
| With PDF URL | 1,854 |
| Internal Storage (verified) | 1,127 |
| Miami-Dade URLs (may be 404) | 726 |
| Malformed URLs | 3 |
| Missing URL entirely | 627 |

---

## Expected Outcome

After implementing these fixes:
1. The 3 malformed URLs will be corrected and may display properly
2. Users will see clearer error messages when PDFs are unavailable
3. Admins can identify which products need their PDFs re-sourced
4. Long-term: A verification tool can flag broken external URLs for replacement
