
# NOA Intelligence Engine - Implementation Plan

## Executive Summary

Your Python-based NOA scraper design is excellent, but Lovable uses TypeScript/Deno Edge Functions. I'll translate your architecture into our platform while adding enhancements to solve the Miami-Dade crawling issues.

## Current State Analysis

### Database Status
| Metric | Value |
|--------|-------|
| Total Products | 798 |
| With PDF URLs | 15 (1.9%) |
| Pending Status | 748 (93.7%) |
| Found Status | 15 |

### Why Current Crawling Fails
The Miami-Dade product search is an **ASP.NET session-based form**:
1. It requires POST submission with form data
2. Results are only rendered after form submission with session cookies
3. Direct URL patterns like `pc-result_app.asp?categorylist=13` return "Error Processing your request"
4. The Firecrawl "scrape" mode isn't executing the form submission

---

## Solution Architecture (Translated to TypeScript)

Your Python design:
```
[ NOA Scraper ] → [ PDF Storage ] → [ Metadata Extraction ] → [ NOA Database ] → [ Vector Store ] → [ Permit AI ]
```

Lovable implementation:
```
[ Edge Function Scraper ] → [ Supabase Storage ] → [ AI Metadata Extraction ] → [ product_approvals Table ] → [ Embedded Search ] → [ permit-packet-assembler ]
```

---

## Implementation Plan

### Part 1: Fix Miami-Dade Scraping (Critical)

The core issue is that Firecrawl can't handle ASP.NET form submissions. We need a different approach:

**Option A: Headless Browser Simulation**
- Use Firecrawl's "action" mode to actually fill and submit the form
- This requires Firecrawl Pro which may have the capability

**Option B: Known Product List + Direct PDF Lookup**
- Instead of crawling search results, use a pre-built list of NOA numbers
- The PDF URL pattern is: `https://www.miamidade.gov/building/library/noa/{NOA_WITH_DASHES}.pdf`
- We can verify each PDF exists via HEAD request

**Option C: Manual PDF Upload with AI Extraction**
- Create an admin interface to bulk upload PDFs
- AI extracts metadata from each uploaded PDF
- Store in product_approvals with full metadata

**Recommended: Hybrid Approach (B + C)**
- Build a known-NOA list from existing database entries
- Attempt to download PDFs for each NOA
- Allow manual bulk upload as fallback
- AI extracts/validates metadata from all PDFs

### Part 2: Enhanced Edge Function - `noa-bulk-downloader`

New edge function that:
1. Accepts a list of NOA numbers (or reads from product_approvals)
2. Attempts to download each PDF from known URL patterns
3. Stores PDFs in `product-approvals` bucket
4. Updates product_approvals with file URLs

**Key Logic (TypeScript equivalent of your Python):**
```typescript
// URL patterns to try for each NOA
const patterns = [
  (noa: string) => `https://www.miamidade.gov/building/library/noa/${noa.replace('.', '')}.pdf`,
  (noa: string) => `https://www.miamidade.gov/building/library/noa/${noa}.pdf`,
];

for (const product of products) {
  if (!product.noa_number) continue;
  
  for (const pattern of patterns) {
    const url = pattern(product.noa_number);
    const response = await fetch(url, { method: 'HEAD' });
    
    if (response.ok) {
      // Download and store
      const pdf = await fetch(url);
      const buffer = await pdf.arrayBuffer();
      
      await supabase.storage
        .from('product-approvals')
        .upload(`noa-pdfs/${product.noa_number}.pdf`, buffer);
      
      // Update database
      await supabase.from('product_approvals')
        .update({ file_url: publicUrl, source_status: 'found' })
        .eq('id', product.id);
      break;
    }
  }
}
```

### Part 3: AI Metadata Extraction (Your pdfplumber equivalent)

Use Lovable AI with vision capability to extract metadata from PDFs:

```typescript
// Extract metadata from PDF using AI vision
const extractNOAMetadata = async (pdfUrl: string) => {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Extract NOA metadata from this PDF...' },
          { type: 'image_url', image_url: { url: pdfUrl } }
        ]
      }],
    }),
  });
  
  return parseAIResponse(response);
};
```

### Part 4: Admin Interface - Bulk NOA Manager

New admin panel features:
1. **NOA Number Input** - Paste a list of NOA numbers to attempt download
2. **Bulk PDF Upload** - Drag-drop multiple PDFs for AI extraction
3. **Progress Dashboard** - Real-time download/extraction progress
4. **Validation Queue** - Review AI-extracted metadata before saving

### Part 5: Integration with Permit Packets

When a user selects a product in the wizard:
1. Check if product has PDF URL
2. If not, attempt real-time sourcing
3. Include sourced PDF in packet assembly
4. Display NOA details on cover sheet

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/noa-bulk-downloader/index.ts` | Create | Batch download NOAs from known patterns |
| `supabase/functions/noa-metadata-extractor/index.ts` | Create | AI-powered PDF metadata extraction |
| `src/components/permit-queens/admin/NOABulkManager.tsx` | Create | Admin UI for bulk NOA operations |
| `src/components/permit-queens/admin/NOAUploadQueue.tsx` | Create | Bulk PDF upload with progress |
| `supabase/functions/crawl-source-websites/index.ts` | Modify | Add fallback patterns for Miami-Dade |
| `supabase/config.toml` | Modify | Add new edge function configs |

---

## Database Enhancements

Add new columns to track sourcing:
- `source_attempts` - Count of download attempts
- `last_verified_at` - When PDF was last verified accessible
- `ai_extracted_at` - When AI extracted metadata
- `extraction_confidence` - AI confidence score

---

## NOA URL Pattern Research

Based on testing, the Miami-Dade PDF URL pattern requires:
1. NOA number WITHOUT the decimal point
2. Example: `17-0620.02` → `17-062002.pdf`

But direct access returns 404. The PDFs are likely:
1. Behind authentication
2. Generated on-demand
3. Accessed only via the pc-view_app.asp page with session state

**Alternative Sources:**
- Manufacturer websites (GAF, CertainTeed, etc. often host their NOA PDFs)
- Florida Building Code Product Approval database
- Direct from testing labs (TAS, AAMA, etc.)

---

## Immediate Action Items

1. **Create `noa-bulk-downloader` edge function** - Try multiple URL patterns
2. **Add bulk upload UI** - Allow admin to upload PDFs manually
3. **Create AI extraction pipeline** - Process uploaded PDFs for metadata
4. **Build validation queue** - Review and approve extracted data
5. **Update product selector** - Show PDF status clearly
6. **Connect to packet assembler** - Use learned data in generation

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Products with PDFs | 15 (1.9%) | 200+ (25%+) |
| Successful packet generation | ~7% | 40-60% |
| Manual PDF sourcing | Required | Automated |
| AI learning from NOAs | Not happening | Active extraction |

---

## Technical Notes

### Why Not Python?
Lovable Edge Functions run on Deno (TypeScript). While your Python architecture is solid, we implement it with:
- `fetch()` instead of `requests`
- TypeScript types instead of Python dicts
- Supabase client instead of psycopg2
- Lovable AI instead of direct OpenAI calls

### Rate Limiting Considerations
- Miami-Dade may block rapid requests
- Add 1-2 second delays between downloads
- Implement exponential backoff on failures
- Store failures to retry later

### Storage Organization
```
product-approvals/
├── noa-pdfs/
│   ├── 17-062002.pdf
│   ├── 21-031202.pdf
│   └── ...
├── fl-approvals/
│   └── ...
└── manufacturer-specs/
    └── ...
```

---

## Summary

Your NOA Intelligence Engine concept is exactly what this system needs. The implementation translates your Python architecture to TypeScript/Deno while addressing the Miami-Dade form submission challenge through:
1. Alternative URL patterns and HEAD request verification
2. Bulk PDF upload capability as fallback
3. AI-powered metadata extraction from uploaded PDFs
4. Integration with the permit packet generator to use learned NOA data
