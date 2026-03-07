

## Problem Analysis

There are three issues to fix:

### 1. Smart Document Previews Fail (Storage Bucket Mismatch)
The crawler (`firecrawl-permit-docs-crawler`) uploads PDFs to the **`permit-documents`** bucket at paths like `firecrawl/Miami-Dade/...`. When `firecrawl-to-smart-docs` converts these to `permit_form_templates` records, it sets `file_path = doc.storage_path` -- which is a path inside `permit-documents`. But both `SmartDocumentManager` and `DiscoveredDocumentsTab` call `createSignedUrl` on the **`permit-form-templates`** bucket, so the file is never found.

**Fix:** Two changes needed:
- Add a `storage_bucket` column to track which bucket the file lives in (or standardize). The simplest fix: update `viewDocument` and `viewSmartDoc` to check if the `file_path` starts with `firecrawl/` and use the `permit-documents` bucket in that case, otherwise use `permit-form-templates`.
- Alternatively, update `firecrawl-to-smart-docs` to copy the file from `permit-documents` into `permit-form-templates` during conversion. This is cleaner long-term since all smart docs live in one bucket.

**Recommended approach:** Add bucket-aware preview logic in the frontend (fast fix), plus update `firecrawl-to-smart-docs` to copy files to the correct bucket going forward.

### 2. No Manual Upload Path for City Documents to Convert as Smart Docs
The `SmartDocumentManager` only shows documents tied to a `building_dept_id`. But from the Firecrawl Intelligence Center (where the user currently is on `/admin/dashboard`), there is no way to manually upload a PDF and have it converted into a smart document template.

**Fix:** Add a manual upload section to the `DiscoveredDocumentsTab`:
- A drop zone that accepts PDFs with department/county selector fields.
- On upload: store the PDF in `permit-form-templates` bucket, create a `permit_form_templates` record with `source = 'manual'`, and trigger AI analysis.
- This lets the admin upload city forms directly from the Firecrawl dashboard without needing to navigate to the Smart Document Manager.

### 3. No Delete Capability for Duplicates
There is no delete functionality anywhere for `permit_form_templates` records. Duplicates from crawling cannot be removed.

**Fix:** Add delete buttons to both:
- `DiscoveredDocumentsTab` -- delete the `firecrawl_discovered_documents` record and optionally its linked smart doc.
- `SmartDocumentManager` -- delete individual smart doc templates (remove from DB + storage).

Include a confirmation dialog before deletion.

## Implementation Plan

### A. Fix bucket-aware PDF preview
- In `DiscoveredDocumentsTab.viewSmartDoc()` and `SmartDocumentManager.viewDocument()`, detect the bucket from `file_path`:
  - If path starts with `firecrawl/` -> use `permit-documents` bucket
  - Otherwise -> use `permit-form-templates` bucket
- Same logic for the `SmartDocumentManager` view button.

### B. Add manual upload to DiscoveredDocumentsTab
- Add a collapsible upload section at the top with: file drop zone, department/county selector, form name input, trade type, and form type.
- Upload to `permit-form-templates` bucket, insert into `permit_form_templates` with `source = 'manual'`, trigger `permit-packet-analyzer`.

### C. Add delete functionality
- Add a Trash icon button on each document row in both `DiscoveredDocumentsTab` and `SmartDocumentManager`.
- Use an `AlertDialog` for confirmation.
- On confirm: delete the `permit_form_templates` record and the storage file.
- For `DiscoveredDocumentsTab`: also allow deleting the `firecrawl_discovered_documents` record (with option to also delete its linked smart doc).

### D. Update firecrawl-to-smart-docs edge function
- After conversion, copy the PDF from `permit-documents` to `permit-form-templates` bucket and update the `file_path` to the new location. This ensures all smart doc files live in the correct bucket going forward.

