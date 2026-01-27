

# Fix PDF/Document Viewing - In-App PDF Viewer

## Problem

When clicking "Download PDF", "View Document", or viewing smart documents:
- Chrome blocks the redirect to Supabase storage URLs (ERR_BLOCKED_BY_CLIENT)
- Opening external URLs in new tabs is unreliable
- Users want to view documents within the app, not be redirected

## Solution

Create a centralized **PDFViewerDialog** component that displays PDFs inside a modal dialog using an iframe. This pattern already works in `FormPreviewDialog.tsx` and avoids browser blocking issues.

## Technical Approach

| Current Behavior | New Behavior |
|------------------|--------------|
| `window.open(signedUrl, '_blank')` | Open `PDFViewerDialog` with iframe |
| External redirect to supabase.co | Inline PDF preview within the app |
| Chrome blocks popup | Modal dialog renders normally |

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/ui/PDFViewerDialog.tsx` | Reusable dialog component that displays PDFs in an iframe |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/permit-queens/PacketViewer.tsx` | Replace `window.open()` with `PDFViewerDialog` for viewing documents and downloading packets |
| `src/components/permit-queens/admin/SmartDocumentManager.tsx` | Fix `viewDocument()` to use signed URLs and show in dialog |
| `src/components/admin/PermitBooksManager.tsx` | Replace direct `window.open()` with `PDFViewerDialog` |
| `src/components/permit-queens/SmartDocumentUploader.tsx` | Replace `window.open()` with `PDFViewerDialog` |
| `src/components/admin/PermitDetailDialog.tsx` | Replace `window.open()` with `PDFViewerDialog` |

## Implementation Details

### 1. New PDFViewerDialog Component

This reusable component will:
- Accept a storage path or full URL
- Generate signed URLs for private bucket files
- Display the PDF in an iframe within a dialog
- Provide download button that uses fetch + blob download (avoids browser blocking)
- Handle loading states and errors gracefully

Key features:
- Full-screen modal option for better viewing
- Zoom controls (optional enhancement)
- Download button using programmatic download (not window.open)
- Support for both storage paths and external URLs

### 2. PacketViewer.tsx Changes

```text
BEFORE:
window.open(data.signedUrl, '_blank')

AFTER:
setViewingDocument({ url: signedUrl, name: docName })
<PDFViewerDialog url={viewingDocument.url} name={viewingDocument.name} />
```

### 3. SmartDocumentManager.tsx Changes

Fix the broken `getPublicUrl` call:
```text
BEFORE:
const { data } = supabase.storage.from('permit-form-templates').getPublicUrl(doc.file_path)
window.open(data.publicUrl, '_blank')

AFTER:
const { data } = await supabase.storage.from('permit-form-templates').createSignedUrl(doc.file_path, 3600)
setViewingDocument({ url: data.signedUrl, name: doc.form_name })
```

### 4. Programmatic Download (No Popup Blocking)

For the "Download" button, instead of `window.open()`, use:
```typescript
const downloadFile = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
};
```

This approach:
- Fetches the file programmatically
- Creates a blob URL
- Triggers download via hidden anchor click
- Works without popup blockers

## Component Structure

```text
PDFViewerDialog
├── Dialog (full-screen option)
│   ├── DialogHeader
│   │   ├── Document Name
│   │   └── Close Button
│   ├── DialogContent
│   │   ├── Loading State (spinner)
│   │   ├── Error State (retry option)
│   │   └── iframe (PDF display)
│   └── DialogFooter
│       ├── Download Button (programmatic)
│       └── Close Button
```

## Affected User Journeys

| Location | Fix |
|----------|-----|
| Permit Request > Generated Packet > Download PDF | View in dialog instead of redirect |
| Permit Request > Document Index > View icon | View in dialog instead of redirect |
| Master Admin > Smart Documents > View | View in dialog with signed URL |
| Master Admin > Permit Books > Download | View in dialog instead of redirect |
| Admin Portal > Permit Details > Documents | View in dialog instead of redirect |

## Result

After implementation:
- PDFs open instantly within the app in a large modal
- No more browser blocking or broken redirects  
- Users can preview then download if needed
- Consistent experience across all document viewing locations

