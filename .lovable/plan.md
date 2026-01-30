

# Fix Custom Source Website Crawl Error

## Problem Summary

When clicking the "Play" button to crawl the custom source website, the error "Edge Function returned a non-2xx status code" appears. Investigation revealed two issues:

1. **Stale Error Display**: The previous crawl attempt failed because the URL had an accidental prefix (`"Enter this URL:     "`). The database URL was corrected, but the error status from that failed attempt is still displaying in the UI.

2. **Zero Results from Parse**: Even when the crawl succeeds, the Miami-Dade table parser returns 0 documents. The current search URL may not be returning actual product data.

## Root Cause Analysis

| Issue | Cause | Status |
|-------|-------|--------|
| Edge function 500 error | URL had prefix text | **Fixed** - URL is now clean |
| Error still showing | UI showing stale `crawl_status: 'error'` | Need to re-crawl |
| 0 documents found | Search URL incomplete or no matching products | Needs valid search URL |

## Solution

### Fix 1: Add Better Error Recovery in Frontend

Update `CustomSourceManager.tsx` to show more helpful error messages and clear stale errors before starting a new crawl.

**Changes:**
- Add a loading state that clears error message when starting a new crawl
- Show more descriptive error messages based on the response
- Add a tooltip showing the full error message

### Fix 2: Improve Miami-Dade URL Validation

Update the edge function to validate and warn about incomplete Miami-Dade search URLs.

**Changes:**
- Check if the Miami-Dade URL is a search results page with actual search criteria
- Log a warning if the URL appears to be a form page rather than a results page
- Return a helpful message guiding users to use a complete search URL

### Fix 3: Better Table Parsing Feedback

Add logging and feedback about what the parser found in the HTML.

**Changes:**
- Log sample HTML content for debugging
- Count tables found vs tables with data
- Return diagnostic info in the response

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/permit-queens/CustomSourceManager.tsx` | Improve error handling, add retry logic, clear stale errors |
| `supabase/functions/crawl-source-websites/index.ts` | Add Miami-Dade URL validation, improve logging, return diagnostic info |

## Technical Details

### Frontend Changes (CustomSourceManager.tsx)

```typescript
// Before calling the edge function, clear the previous error
await supabase
  .from('custom_source_websites')
  .update({ 
    crawl_status: 'crawling', 
    error_message: null,  // Clear previous error
    documents_found: 0    // Reset count
  })
  .eq('id', source.id);

// After response, show more helpful messages
if (data?.success) {
  if (data.totalDiscovered === 0) {
    toast.warning(`Crawl complete but no documents found. The search may have returned no results.`);
  } else {
    toast.success(`Found ${data.documentsFound} documents`);
  }
}
```

### Edge Function Changes

```typescript
// Add validation for Miami-Dade search URLs
function validateMiamiDadeSearchUrl(url: string): { valid: boolean; message?: string } {
  // Check if URL has actual search parameters
  const hasSearchCriteria = url.includes('AdvancedSearch=Go') && 
    (url.includes('fldNOA=') || url.includes('Classification='));
    
  if (!hasSearchCriteria) {
    return {
      valid: false,
      message: 'This appears to be the search form, not search results. Please perform a search on the Miami-Dade site and copy the URL after results appear.'
    };
  }
  
  return { valid: true };
}
```

## Immediate Workaround

The user can try these steps right now:

1. **Click the Play button again** - The edge function should now work since the URL is clean
2. **Use a valid search URL** - Go to the Miami-Dade NOA search, perform an actual search (e.g., search for "roofing" products), and copy that results URL
3. **Update the source URL** - Delete the current source and add a new one with the complete search results URL

## Expected Outcome

After implementation:
- Error messages will be cleared when starting a new crawl
- Users will see helpful guidance if the search returns no results
- Better logging will help diagnose table parsing issues
- Miami-Dade URLs will be validated for completeness

