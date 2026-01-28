
# Fix Smart Document Analyzer & PDF Preview

## Issues Identified

### Issue 1: Smart Documents Stuck on "Analyzing"

**Root Cause:** The `DocumentUploadZone.tsx` calls `permit-packet-analyzer` for template analysis, but this function:
1. Doesn't accept `templateId` in its interface (`AnalyzeRequest`)
2. Only updates `permit_packet_training` table, not `permit_form_templates`
3. Never sets `analysis_status` to `complete` or `error`

**Evidence:**
- Document stuck for 650+ minutes in "analyzing" status
- Edge function logs show it matched a department but didn't update templates

**Solution:** Update `permit-packet-analyzer` to:
1. Accept `templateId` parameter
2. Update `permit_form_templates.analysis_status` to `complete` or `error`
3. Store extracted field count in the template record

### Issue 2: PDF Preview Shows Blank

**Root Cause:** The signed URL is valid, but PDF rendering in iframes can fail for several reasons:
1. Missing PDF viewer parameters (`#toolbar=1&view=FitH`)
2. Some browsers need explicit height/width on the iframe container
3. The iframe loads but PDF plugin doesn't render

**Evidence:** Screenshot shows the dialog opens with title and buttons, but content area is blank

**Solution:** Enhance `PDFViewerDialog` to:
1. Add PDF viewer parameters to the URL (`#toolbar=1&view=FitH`)
2. Use Google Docs viewer as fallback for cross-origin PDFs
3. Add explicit dimensions to the iframe
4. Improve loading state detection

---

## Implementation Plan

### Part 1: Fix Template Analysis in permit-packet-analyzer

**File:** `supabase/functions/permit-packet-analyzer/index.ts`

**Changes:**
1. Add `templateId` and `filePath` to the `AnalyzeRequest` interface:
```typescript
interface AnalyzeRequest {
  mode?: "analyze_only" | "detect_and_analyze";
  trainingId?: string;
  templateId?: string;  // NEW: For smart document analysis
  filePath?: string;    // NEW: For fetching from storage
  fileUrl?: string;
  fileContent?: string;
  fileName?: string;
  batchId?: string;
}
```

2. Extract `templateId` and `filePath` from request:
```typescript
const { 
  mode = "analyze_only", 
  trainingId, 
  templateId,  // NEW
  filePath,    // NEW
  fileUrl, 
  fileContent, 
  fileName, 
  batchId 
} = requestData;
```

3. Add template update logic after detection in `detect_and_analyze` mode:
```typescript
// If this is a template analysis, update the template record
if (templateId) {
  await supabase
    .from("permit_form_templates")
    .update({
      analysis_status: "complete",
      field_count: detectedFieldCount || 0,
      is_fillable: detectedFieldCount > 0,
      last_analyzed_at: new Date().toISOString(),
    })
    .eq("id", templateId);
  
  console.log(`[permit-packet-analyzer] Updated template ${templateId} status to complete`);
}
```

4. Add error handling to update template on failure:
```typescript
// In catch block
if (templateId) {
  await supabase
    .from("permit_form_templates")
    .update({
      analysis_status: "error",
      last_analyzed_at: new Date().toISOString(),
    })
    .eq("id", templateId);
}
```

### Part 2: Fix PDF Preview in PDFViewerDialog

**File:** `src/components/ui/PDFViewerDialog.tsx`

**Changes:**

1. Add PDF viewer parameters to the URL:
```typescript
const getPdfUrl = (url: string) => {
  // Add PDF viewer parameters for better rendering
  const separator = url.includes('#') ? '&' : '#';
  return `${url}${separator}toolbar=1&view=FitH`;
};
```

2. Use object tag with fallback for better PDF rendering:
```tsx
<object
  data={getPdfUrl(url)}
  type="application/pdf"
  className="w-full h-full"
  onLoad={handleIframeLoad}
>
  {/* Fallback to iframe */}
  <iframe
    src={getPdfUrl(url)}
    className="w-full h-full border-0"
    onLoad={handleIframeLoad}
    onError={handleIframeError}
    title={title}
  />
</object>
```

3. Add explicit height to container:
```tsx
<div className="flex-1 min-h-0 relative h-[calc(100%-120px)]">
```

4. Add Google Docs viewer fallback option:
```typescript
const [useGoogleViewer, setUseGoogleViewer] = useState(false);

// If native rendering fails, try Google Docs viewer
const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
```

### Part 3: Database Migration - Add last_analyzed_at Column

**File:** New migration

**SQL:**
```sql
-- Add last_analyzed_at column if not exists
ALTER TABLE permit_form_templates 
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ;

-- Reset stuck documents so they can be re-analyzed
UPDATE permit_form_templates 
SET analysis_status = 'pending'
WHERE analysis_status = 'analyzing'
AND created_at < NOW() - INTERVAL '10 minutes';
```

### Part 4: Update DocumentUploadZone (Minor Fix)

**File:** `src/components/permit-queens/admin/DocumentUploadZone.tsx`

**Changes:**
- Ensure the function call includes all required parameters
- The current implementation is correct - just needs the analyzer to accept `templateId`

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/permit-packet-analyzer/index.ts` | Add templateId handling, update template status |
| `src/components/ui/PDFViewerDialog.tsx` | Fix PDF rendering with object tag and parameters |
| New migration | Add last_analyzed_at column, reset stuck docs |

---

## Expected Outcomes

| Issue | Before | After |
|-------|--------|-------|
| Smart Docs stuck on "Analyzing" | Permanent "Analyzing" status | Completes or shows error |
| PDF preview blank | Blank dialog | PDF displays in viewer |
| Stuck documents | 1 document stuck 650+ mins | Auto-reset to pending |

---

## Technical Notes

### PDF Rendering in iframes
Different browsers handle PDF rendering differently:
- Chrome: Uses PDFium, usually works with direct URLs
- Safari: May need object tag
- Firefox: Uses pdf.js, usually works

Using both `object` and `iframe` tags provides maximum compatibility.

### Google Docs Viewer Fallback
For PDFs that can't be rendered natively, Google Docs viewer provides a reliable fallback:
```
https://docs.google.com/viewer?url={encoded_pdf_url}&embedded=true
```
This works for publicly accessible URLs but may not work with signed URLs that expire.

### Alternative: PDF.js Library
For complete control, we could integrate PDF.js, but this adds significant complexity and bundle size.
