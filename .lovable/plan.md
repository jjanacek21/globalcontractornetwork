
# Comprehensive Fix Plan for Permit Packet System

## Overview

This plan addresses 5 interconnected issues that are preventing the permit packet workflow from functioning correctly:

1. **Uploaded documents not persisting** between wizard steps
2. **93.9% of product NOAs missing PDFs** in the database
3. **AI training processor getting stuck/failing**
4. **Document preview not working** for uploaded files
5. **Bulk NOA download from Miami-Dade** needed

---

## Part 1: Fix Uploaded Documents Persistence

### Problem Analysis

When documents are uploaded in Step 2 (Materials & Docs), they:
- Are correctly uploaded to `permit-documents` storage bucket
- Are saved to `permit_project_documents` table (verified in database)
- But the local React state (`uploadedDocuments`) is lost when navigating or refreshing

The `permit-packet-assembler` Edge Function DOES check the database for uploaded documents (`dbDocuments` query on line ~335), but there's a timing issue: the permit project may not exist yet when documents are uploaded.

### Solution

**1A. Create Permit Project Earlier**

Instead of creating the permit project only at Step 3, create a draft record at the START of Step 2 when user begins adding materials/documents. This ensures all uploads are linked to a real project ID.

**1B. Fix Document Fetching in Wizard**

Add a useEffect to reload uploaded documents from the database when entering Step 3, not just relying on local state.

**Files to Modify:**
| File | Change |
|------|--------|
| `src/pages/PermitQueensNewRequest.tsx` | Create draft permit at Step 2 start; fetch uploaded docs from DB on Step 3 entry |
| `src/components/permit-queens/SmartDocumentUploader.tsx` | Require valid permitProjectId prop |

---

## Part 2: Bulk Download NOAs from Miami-Dade

### Your Exact Request

You want to provide a Miami-Dade URL where all roofing NOAs are visible, and have the system automatically download and save each PDF.

### How It Will Work

The `crawl-source-websites` Edge Function already supports this! It:
1. Crawls Miami-Dade search result pages
2. Parses the HTML table to extract NOA numbers, manufacturers, product details
3. Constructs PDF URLs from NOA numbers
4. Can be enhanced to **download** and store PDFs (not just save URLs)

### Solution

**2A. Fix the Crawl Function to Actually Download PDFs**

The current function extracts URLs but doesn't download the files. Modify it to:
1. Parse Miami-Dade search results (already works)
2. For each NOA found, download the PDF using `fetch()`
3. Store PDF in `product-approvals` storage bucket
4. Update `product_approvals` table with local storage URL

**2B. Create Simple Admin UI for Bulk Download**

Add a field in the admin panel where you can paste the Miami-Dade search URL and trigger bulk download:
- Input: "https://www.miamidade.gov/building/pc-result_app.asp?category=ROOFING"
- Button: "Download All NOAs"
- Progress: Shows X of Y downloaded

**Files to Modify:**
| File | Change |
|------|--------|
| `supabase/functions/crawl-source-websites/index.ts` | Add PDF download+storage step after parsing |
| `src/components/permit-queens/CustomSourceManager.tsx` | Add bulk download trigger with progress |

---

## Part 3: Fix AI Training Processor

### Problem Analysis

Training samples are getting stuck in `processing` or `queued` status. Looking at the data:
- `Boca_Raton_Building_department_permit-Part_1-42.pdf` has been in `processing` status
- `Pembroke_Pines_Tile_Roofing_Permit.pdf` is stuck in `queued` with notes "[Needs retry] [Re-queued for retry]"

The `permit-packet-analyzer` function may be:
1. Timing out (Edge functions have 60s limit by default)
2. Failing to read large PDFs from storage
3. AI response being truncated

### Solution

**3A. Add Timeout Handling & Chunking**

Break large PDFs into chunks (first 20 pages) for processing to avoid timeouts.

**3B. Add Proper Error Recovery**

When processing fails:
1. Mark status as `failed` (not stuck in `processing`)
2. Store the specific error message
3. Allow manual retry from admin UI

**3C. Add Processing Logs**

Store processing progress so admin can see what stage failed.

**Files to Modify:**
| File | Change |
|------|--------|
| `supabase/functions/permit-packet-analyzer/index.ts` | Add chunking, better timeout handling, progress logging |
| Admin UI | Show detailed error messages for failed samples |

---

## Part 4: Fix Document Preview

### Problem Analysis

The `SmartDocumentUploader` already has preview code that generates signed URLs and uses `PDFViewerDialog`. If preview isn't working, it's likely:
1. Signed URL generation failing due to bucket permissions
2. Path format issue between stored path and bucket name

### Solution

**4A. Verify Preview Flow**

Check that the path stored in `doc.url` matches what's needed for signed URL generation.

The current code stores `filePath` like: `{userId}/permits/{projectId}/{fileName}`

But when calling `createSignedUrl(doc.url, 3600)`, the bucket name (`permit-documents`) is already specified, so the path should work.

**4B. Add Error Logging to Preview**

Add console logging to identify exactly where the preview fails.

**Files to Modify:**
| File | Change |
|------|--------|
| `src/components/permit-queens/SmartDocumentUploader.tsx` | Add better error handling for preview |

---

## Part 5: Improve Learning Feedback Loop

### Your Core Question: "Is the AI even learning?"

Yes, the AI IS learning, but the data isn't being used effectively yet. Here's what's being stored:

| Data Type | Table | Status |
|-----------|-------|--------|
| Product Approvals | `product_approvals` | 796 products extracted |
| Fastener Patterns | `fastener_patterns` | Saved from training samples |
| Jurisdiction Rules | `building_department_rules` | Gotchas and requirements |
| AI Knowledge | `permit_ai_knowledge` | Patterns from analyzed packets |
| Inspection Schedules | `permit_inspections` | Saved per training sample |

The **problem** is:
1. The packet generator doesn't query this learned data when generating new packets
2. No feedback loop from rejections back to training

### Solution

**5A. Use Learned Data in Packet Assembly**

Modify `permit-packet-assembler` to:
1. Query `fastener_patterns` for the jurisdiction and include in generated docs
2. Query `building_department_rules` for gotchas and add to cover sheet
3. Query `permit_ai_knowledge` for jurisdiction-specific requirements

**5B. Add Learning Progress Dashboard**

Create an admin view showing:
- Total products with PDFs: X / 796
- Jurisdictions with learned rules: Y
- Fastener patterns saved: Z
- This shows the AI is actually learning and what gaps remain

---

## Implementation Priority Order

| Priority | Task | Impact |
|----------|------|--------|
| 1 | Fix PDF download in crawl function | Solves 93.9% missing PDFs |
| 2 | Add bulk download UI for Miami-Dade | You can immediately populate the database |
| 3 | Fix document persistence in wizard | Uploaded docs will appear in packets |
| 4 | Fix preview for uploaded documents | Better user experience |
| 5 | Improve AI training error handling | Samples won't get stuck |
| 6 | Connect learned data to packet generator | AI knowledge feeds into output |

---

## Technical Implementation Details

### Miami-Dade Bulk Download Enhancement

The key change to `crawl-source-websites/index.ts`:

```typescript
// After parsing table and extracting documents[]
for (const doc of documents) {
  if (doc.pdfUrl) {
    try {
      // Download the PDF
      const response = await fetch(doc.pdfUrl);
      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer();
        
        // Store in Supabase Storage
        const storagePath = `noa-pdfs/${doc.noaNumber.replace('.', '-')}.pdf`;
        await supabase.storage
          .from('product-approvals')
          .upload(storagePath, pdfBuffer, { 
            contentType: 'application/pdf',
            upsert: true 
          });
        
        // Get public URL
        const { data } = supabase.storage
          .from('product-approvals')
          .getPublicUrl(storagePath);
        
        // Upsert product approval with local URL
        await supabase.from('product_approvals').upsert({
          noa_number: doc.noaNumber,
          manufacturer: doc.manufacturer,
          product_name: doc.productName,
          file_url: data.publicUrl,
          noa_pdf_url: data.publicUrl,
          source_status: 'found',
          // ... other fields from parsed table
        }, { 
          onConflict: 'noa_number' 
        });
      }
    } catch (e) {
      console.log(`Failed to download ${doc.noaNumber}: ${e}`);
    }
  }
}
```

### Document Persistence Fix

```typescript
// In PermitQueensNewRequest.tsx - Step 3 entry
useEffect(() => {
  if (currentStep === 3 && tempPermitId) {
    // Reload uploaded documents from database
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('permit_project_documents')
        .select('*')
        .eq('project_id', tempPermitId);
      
      if (data) {
        // Merge with local state
        setUploadedDocuments(prev => {
          // Deduplicate and merge
          const merged = [...prev];
          data.forEach(dbDoc => {
            if (!merged.some(d => d.url === dbDoc.file_path)) {
              merged.push({
                id: dbDoc.id,
                name: dbDoc.file_name,
                type: dbDoc.document_type,
                url: dbDoc.file_path,
                status: 'uploaded',
              });
            }
          });
          return merged;
        });
      }
    };
    fetchDocs();
  }
}, [currentStep, tempPermitId]);
```

---

## Expected Outcomes

| Before | After |
|--------|-------|
| 93.9% products missing PDFs | Can bulk download from Miami-Dade to fill database |
| Uploaded docs lost between steps | Docs persist via database |
| Preview doesn't work | Signed URL preview working |
| Training stuck in pending | Proper error handling, shows failure reasons |
| AI not using learned data | Packet includes jurisdiction-specific rules |
| 7% packet completion | 60%+ for permits with available NOAs |

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/crawl-source-websites/index.ts` | Modify | Add PDF download & storage after parsing |
| `src/components/permit-queens/CustomSourceManager.tsx` | Modify | Add bulk download UI with Miami-Dade URL input |
| `src/pages/PermitQueensNewRequest.tsx` | Modify | Create draft permit earlier, fetch docs from DB on Step 3 |
| `src/components/permit-queens/SmartDocumentUploader.tsx` | Modify | Better error handling for preview |
| `supabase/functions/permit-packet-assembler/index.ts` | Modify | Query learned data (fastener patterns, rules) |
| `supabase/functions/permit-packet-analyzer/index.ts` | Modify | Better timeout handling, chunking |
