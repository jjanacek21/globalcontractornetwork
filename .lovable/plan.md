

# Fix PDF Viewer in ManufacturerNOASearch Component

## Problem
The "View PDF" button in the Manufacturer NOA Search results is using a direct link (`<a href={result.pdf_url} target="_blank">`) which:
1. Tries to redirect to external URLs that may be blocked by CORS policies
2. Doesn't match the project's established pattern of using inline PDF preview
3. Breaks for Miami-Dade and Florida Building government sites that require the Google Docs viewer fallback

## Solution
Replace the direct link with the `PDFViewerDialog` component used throughout the rest of the application. This component:
- Shows PDFs inline in a modal dialog
- Automatically falls back to Google Docs viewer for government domains (miamidade.gov, floridabuilding.org)
- Provides download functionality
- Handles CORS issues gracefully

## Implementation Steps

### Step 1: Add State for PDF Viewing
Add a new state variable to track which PDF is being viewed:
```tsx
const [viewingPdf, setViewingPdf] = useState<{
  url: string;
  title: string;
} | null>(null);
```

### Step 2: Update the View Button
Replace the direct link with a button that opens the dialog:
```tsx
{result.pdf_url && (
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={() => setViewingPdf({
      url: result.pdf_url!,
      title: `${result.manufacturer} - ${result.noa_number}`
    })}
  >
    <ExternalLink className="h-4 w-4" />
  </Button>
)}
```

### Step 3: Add PDFViewerDialog Component
Add the dialog component at the bottom of the return statement:
```tsx
<PDFViewerDialog
  open={!!viewingPdf}
  onOpenChange={(open) => !open && setViewingPdf(null)}
  url={viewingPdf?.url || ''}
  title={viewingPdf?.title || 'NOA Document'}
  filename={`${viewingPdf?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'noa'}.pdf`}
/>
```

### Step 4: Add Import
Add the PDFViewerDialog import at the top of the file:
```tsx
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';
```

## Files to Modify
| File | Change |
|------|--------|
| `src/components/permit-queens/admin/ManufacturerNOASearch.tsx` | Add PDFViewerDialog import, state, and component |

## Result
After this fix:
- Clicking "View PDF" will open an inline preview modal
- Government domain PDFs will automatically use the Google Docs viewer fallback
- Users can download the PDF directly from the viewer
- The experience matches all other PDF viewing in the application

