

## Problem: Smart Document Previews Not Working

The "View Smart Doc" links in the Discovered Documents tab point to `/permit-queens/admin/ai-intelligence?template=${smart_doc_id}`, but:

1. **That page never reads the `template` query param** — `PermitQueensAIIntelligence.tsx` doesn't parse URL params or auto-open any preview dialog.
2. **Auth context mismatch** — The user is on `/admin/dashboard` (master admin portal). The link opens a new tab to `/permit-queens/admin/ai-intelligence` which requires separate permit-queens admin auth, likely redirecting to a login page.
3. **No direct preview capability** — The `DiscoveredDocumentsTab` itself has no `PDFViewerDialog` and no logic to fetch signed URLs from the `permit-form-templates` storage bucket.

## Plan

### 1. Add PDFViewerDialog to DiscoveredDocumentsTab

- Import `PDFViewerDialog` and add viewing state (`viewingDocument: { url, name } | null`).
- Add a `viewSmartDoc` function that:
  - Queries `permit_form_templates` by `id = smart_doc_id` to get `file_path` and `form_name`.
  - Generates a signed URL from the `permit-form-templates` storage bucket.
  - Sets the viewing state to open the dialog.
- Replace the external `<a href>` "View Smart Doc" link with an `onClick` button that calls `viewSmartDoc(doc.smart_doc_id)`.
- Render `<PDFViewerDialog>` at the bottom of the component.

### 2. Add "Preview Source" button for all docs

- Add a second action button (Eye icon) that opens the original `source_url` in the PDFViewerDialog (for external gov PDFs, the proxy will handle CORS automatically).

This keeps everything in-context within the master admin portal — no new-tab navigation, no auth issues, and uses the existing PDFViewerDialog with its proxy support.

