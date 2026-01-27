
# Custom Source Website Manager for PDF Sourcing

## Overview

This feature will allow you to add custom websites/URLs (like the Miami-Dade NOA database) that the AI should search and crawl to find product approval documents. The system will use Firecrawl to scrape these sites and extract NOA/FL approval PDFs.

## Architecture

```text
+---------------------------+
|  Custom Source Manager    |
|  (New UI Component)       |
+------------+--------------+
             |
             v
+---------------------------+
|  custom_source_websites   |
|  (New Database Table)     |
+------------+--------------+
             |
             v
+---------------------------+
|  crawl-source-websites    |
|  (New Edge Function)      |
+------------+--------------+
             |
     +-------+-------+
     |               |
     v               v
+----------+  +-------------+
| Firecrawl|  | Lovable AI  |
| Map/Crawl|  | Extraction  |
+----------+  +-------------+
             |
             v
+---------------------------+
|  product_approvals table  |
|  (Updated with new data)  |
+---------------------------+
```

## What You'll Be Able To Do

| Action | Description |
|--------|-------------|
| Add Source URL | Enter any URL (like the Miami-Dade NOA search page) |
| Set Category | Specify which product category this source covers |
| Set Document Type | NOA, FL Approval, UL Listing, etc. |
| Run Crawl | AI will map the site, find all PDFs, and download them |
| Track Progress | See how many documents were found per source |
| Schedule Scans | Set sources to re-scan periodically for new approvals |

## Implementation Details

### 1. New Database Table: `custom_source_websites`

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| name | text | Friendly name (e.g., "Miami-Dade NOA Roofing") |
| url | text | Base URL to crawl |
| url_pattern | text | Optional pattern for pagination/filtering |
| target_category | text | Product category (Shingle, Underlayment, etc.) |
| document_types | text[] | What docs to look for (noa, fl_approval, etc.) |
| crawl_depth | integer | How deep to crawl (1-3) |
| is_active | boolean | Enable/disable source |
| last_crawl_at | timestamp | Last time this source was crawled |
| documents_found | integer | Total docs found from this source |
| crawl_status | text | pending, crawling, completed, error |

### 2. New UI Component: `CustomSourceManager.tsx`

Located within the PDF Sourcing tab, this adds:

- Form to add new source websites:
  - URL input with validation
  - Category dropdown
  - Document type checkboxes
  - Crawl depth selector
- Table of existing sources showing:
  - Source name and URL
  - Last crawl date
  - Documents found count
  - Status badge
  - Actions: Crawl Now, Edit, Delete

### 3. New Edge Function: `crawl-source-websites`

This function will:

1. Use Firecrawl's **Map** feature to discover all URLs on the source site
2. Filter URLs that look like PDF links or product detail pages
3. Use Firecrawl's **Scrape** to extract content from each page
4. Use Lovable AI to identify:
   - Product name and manufacturer
   - NOA number or FL approval number
   - Direct PDF download links
5. Download PDFs to `product-approvals` storage bucket
6. Match to existing products OR create new product_approval records

### 4. Updated `BatchProductSourcing.tsx`

Add a new section below the current controls:

```text
+----------------------------------------+
|  Batch Product PDF Sourcing            |
|  [Current category/batch controls]     |
+----------------------------------------+
|  Custom Source Websites                |
|  +----------------------------------+  |
|  | Miami-Dade NOA Database  [Crawl] |  |
|  | FL Building Code Search  [Crawl] |  |
|  | + Add New Source                 |  |
|  +----------------------------------+  |
+----------------------------------------+
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxx.sql` | Create | Add `custom_source_websites` table |
| `src/components/permit-queens/CustomSourceManager.tsx` | Create | UI for managing source websites |
| `supabase/functions/crawl-source-websites/index.ts` | Create | Edge function to crawl sources |
| `src/components/permit-queens/BatchProductSourcing.tsx` | Modify | Integrate CustomSourceManager |

## Example Workflow

1. You paste the Miami-Dade URL into the "Add Source" form
2. Select category "Roofing Materials" and document type "NOA"
3. Click "Add Source" - it's saved to the database
4. Click "Crawl Now" on the new source
5. The edge function:
   - Maps all pages on miamidade.gov/building/pc-result_app.asp
   - Finds ~500 NOA PDF links
   - Downloads each PDF to local storage
   - Extracts manufacturer/product info using AI
   - Creates or updates product_approval records
6. You see results: "Found 487 NOA documents from Miami-Dade"

## Pre-configured Sources

The system will include these sources by default:

| Source | URL | Category |
|--------|-----|----------|
| Miami-Dade NOA Database | miamidade.gov/building/pc-result_app.asp | All roofing |
| Florida Building Code | floridabuilding.org/pr/pr_app_srch.aspx | All categories |
| FL Product Approval Search | bcap.floridabuilding.org | All categories |

## Technical Considerations

- **Rate limiting**: Crawl requests are throttled (1 per second) to avoid overloading source sites
- **Pagination handling**: For search results pages, follow "Next" links automatically
- **PDF validation**: Verify downloaded files are actual PDFs (not error pages)
- **Duplicate detection**: Check NOA numbers before creating new records
- **Storage optimization**: Store PDFs in organized folders by source and category
