

# Create "search-and-store-documents" Edge Function

## Overview

Build a new edge function that combines the AI-powered document search capability (from `permit-document-search`) with the web crawling and storage functionality (from `crawl-source-websites` and `source-product-pdf`). This function will:

1. Search for permit documents using AI (Anthropic Claude)
2. Crawl discovered URLs to find PDFs using Firecrawl
3. Download and store PDFs in Supabase Storage
4. Save document metadata to the database

## Architecture

```text
+---------------------------+
|   search-and-store-docs   |
+---------------------------+
              |
     +--------+--------+
     |                 |
     v                 v
+----------+    +-------------+
| Anthropic|    | Firecrawl   |
| Claude   |    | Web Crawl   |
| (Search) |    | (PDFs)      |
+----------+    +-------------+
                      |
              +-------+-------+
              |               |
              v               v
     +---------------+  +-----------+
     | product-      |  | permit-   |
     | approvals     |  | document- |
     | Storage       |  | library   |
     +---------------+  +-----------+
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documentType` | string | Yes | Type: "NOA", "Engineering Report", "County Requirements", "Product Approval" |
| `searchQuery` | string | No | General search terms |
| `manufacturer` | string | No | Product manufacturer name |
| `productName` | string | No | Product name |
| `county` | string | No | Florida county |
| `autoStore` | boolean | No | Whether to auto-download and store PDFs (default: true) |
| `targetTable` | string | No | "product_approvals" or "permit_document_library" |

## Output Response

```json
{
  "success": true,
  "searchResults": {
    "results": [...],
    "summary": "...",
    "searchTips": [...]
  },
  "storedDocuments": [
    {
      "id": "uuid",
      "documentType": "NOA",
      "approvalNumber": "24-0312.05",
      "fileUrl": "https://...",
      "storagePath": "noa-pdfs/...",
      "source": "miamidade.gov"
    }
  ],
  "failedDownloads": [
    {
      "url": "https://...",
      "error": "404 Not Found"
    }
  ]
}
```

## Implementation Details

### Step 1: AI-Powered Search
- Use `ANTHROPIC_API_KEY` with Claude to find relevant document URLs
- Parse AI response for document information and URLs
- Return structured results with URLs to crawl

### Step 2: URL Discovery & PDF Extraction
- Use `FIRECRAWL_API_KEY` to crawl discovered pages
- Extract PDF links from search results pages
- Validate URLs and filter for relevant PDFs

### Step 3: PDF Download & Storage
- Download valid PDFs with size validation
- Store in `product-approvals` storage bucket
- Generate public URLs for stored files

### Step 4: Database Record Creation
- Insert into `product_approvals` or `permit_document_library`
- Extract metadata from AI analysis (NOA numbers, expiration dates, etc.)
- Update existing records if document already exists

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/search-and-store-documents/index.ts` | Create | Main edge function combining search + crawl + store |
| `supabase/config.toml` | Modify | Register new function with `verify_jwt = false` |

## Key Code Patterns (from existing functions)

The function will follow established patterns:

```typescript
// CORS headers (standard)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type...',
};

// Supabase client setup
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// PDF storage pattern (from source-product-pdf)
const storagePath = `noa-pdfs/${manufacturer}/${fileName}`;
await supabase.storage.from('product-approvals').upload(storagePath, pdfBytes);

// Database insert pattern
await supabase.from('product_approvals').upsert({
  noa_number,
  file_url,
  manufacturer,
  ...
});
```

## Security & Error Handling

- Validate all inputs before processing
- Rate limit Firecrawl API calls (500ms delay between requests)
- Size validation for downloaded PDFs (>1KB, <50MB)
- Comprehensive logging for debugging
- Graceful error handling with partial success support

## Dependencies

Uses existing secrets (no new secrets required):
- `ANTHROPIC_API_KEY` - AI search
- `FIRECRAWL_API_KEY` - Web crawling
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` - Database & storage

