

# Fix Custom Source Website Crawler for Dynamic Sites

## Problem Identified

The custom source website crawler is failing because:

| Issue | Cause |
|-------|-------|
| Edge function wasn't deployed | Now fixed - function is deployed |
| Miami-Dade site returns 0 documents | The site is dynamic ASP.NET - Firecrawl's "map" can't discover PDFs from search results |
| Different approach needed | Dynamic sites need "scrape" or "search" rather than "map" |

## Root Cause

The Miami-Dade NOA search page is not a static sitemap that can be mapped. It requires:
1. Form submission to generate search results
2. JavaScript rendering to display results
3. Pagination to access all results

The current `crawl-source-websites` function uses `Firecrawl Map` which only discovers static links - it cannot interact with forms or dynamic content.

## Solution

Modify the `crawl-source-websites` edge function to:

1. **Detect site type** - Check if the URL is a known dynamic site (Miami-Dade, Florida Building Code)
2. **Use Scrape instead of Map** - For dynamic sites, use Firecrawl's `scrape` with JavaScript rendering
3. **Add AI extraction** - Use Lovable AI to extract PDF links from the rendered page content
4. **Handle pagination** - For search results, detect and follow pagination links

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/crawl-source-websites/index.ts` | Add scrape-based approach for dynamic sites, AI extraction, better error handling |

## Implementation Details

### 1. Site Type Detection

```text
Known dynamic sites that need scraping:
- miamidade.gov/building/* -> Use scrape + AI extraction
- floridabuilding.org/pr/* -> Use scrape + AI extraction
- bcap.floridabuilding.org/* -> Use scrape + AI extraction

Static sites with PDF directories:
- Manufacturer websites -> Use map (works fine)
```

### 2. Enhanced Crawl Flow

```text
+------------------+
|  Source URL      |
+--------+---------+
         |
         v
+------------------+
|  Detect site type|
+--------+---------+
         |
    +----+----+
    |         |
    v         v
Dynamic    Static
    |         |
    v         v
Scrape      Map
(with JS)   (current)
    |         |
    v         v
AI Extract  Filter PDFs
PDF links   by extension
    |         |
    +----+----+
         |
         v
+------------------+
|  Download PDFs   |
+------------------+
```

### 3. Scrape with AI Extraction

For dynamic sites like Miami-Dade:
- Scrape the page with `formats: ['html', 'links', 'markdown']`
- Wait for JavaScript rendering with `waitFor: 3000`
- Send content to Lovable AI to extract NOA numbers and PDF links
- AI returns structured data with document URLs

### 4. Error Handling Improvements

- Clear error messages for each failure type
- Retry logic for transient failures
- Better logging for debugging
- Graceful degradation (try scrape if map fails)

## Expected Results

After this fix:
- Miami-Dade NOA searches will find PDF links from search results
- Florida Building Code searches will work correctly
- Static manufacturer sites continue working as before
- Clear error messages when sites can't be crawled
- Documents found count will increase significantly

## Technical Considerations

- Firecrawl scrape with JavaScript rendering costs more credits than map
- Rate limiting is important to avoid blocking
- Some government sites may have anti-bot measures
- PDF download validation to avoid storing error pages

