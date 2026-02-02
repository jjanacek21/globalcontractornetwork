
# Fix Chrome PDF Preview Blocking - Implementation Plan

## Problem Analysis

Chrome is blocking PDF previews for two reasons:

### Issue 1: Sandboxed Iframe Restrictions
The `PDFViewerDialog` component uses an iframe with a `sandbox` attribute:
```tsx
sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
```

**Why this breaks PDFs**: Chrome's built-in PDF viewer (PDFium) is a browser plugin that requires elevated permissions. Even with `allow-scripts` and `allow-same-origin`, sandboxed iframes block plugins by default. This causes PDFs to show as blocked/grey screens.

### Issue 2: Supabase Response Parsing
The `pdf-proxy` edge function returns binary PDF data, but the Supabase client's `invoke` function doesn't automatically handle binary responses. The current check:
```tsx
if (data instanceof ArrayBuffer || data instanceof Blob)
```
fails because Supabase returns a parsed JSON-like object wrapper, not raw binary data.

---

## Solution

### Fix 1: Remove Sandbox Attribute from PDF Iframe
Remove the `sandbox` attribute entirely when displaying PDFs. The security is already handled by:
- Server-side URL validation in the proxy
- Blob URLs for external documents (which are same-origin)
- Content-Type validation (magic bytes check for PDFs)

### Fix 2: Use responseType Option for Binary Data
The Supabase `functions.invoke` method supports a `responseType` option. Setting it to `'arraybuffer'` ensures binary data is returned correctly.

### Fix 3: Add `<object>` Fallback with PDF Viewer Parameters
As an additional fallback, use `<object>` tag with PDF viewer parameters that work better in Chrome:
```tsx
<object data={`${displayUrl}#toolbar=1&view=FitH`} type="application/pdf">
  <iframe src={displayUrl} ... />
</object>
```

### Fix 4: Also Fix FormPreviewDialog
The `FormPreviewDialog` component has a similar iframe without any PDF-specific handling.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/PDFViewerDialog.tsx` | Remove sandbox, fix response parsing, add object fallback |
| `src/components/permit-queens/FormPreviewDialog.tsx` | Remove sandbox from iframe |

---

## Technical Implementation

### PDFViewerDialog.tsx Changes

**Line 91-93**: Fix Supabase invoke to request binary response
```tsx
const { data, error } = await supabase.functions.invoke('pdf-proxy', {
  body: { url: targetUrl },
  // Tell Supabase to return raw binary data
});

// Handle the response properly
const response = await fetch(`${SUPABASE_URL}/functions/v1/pdf-proxy`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({ url: targetUrl }),
});
const pdfBlob = await response.blob();
return URL.createObjectURL(pdfBlob);
```

**Line 372-380**: Replace sandboxed iframe with object/embed fallback chain
```tsx
{!error && (
  <object
    data={`${displayUrl}#toolbar=1&view=FitH&navpanes=0`}
    type="application/pdf"
    className="w-full h-full"
    onLoad={handleIframeLoad}
  >
    {/* Fallback to iframe without sandbox */}
    <iframe
      src={displayUrl}
      className="w-full h-full border-0"
      onLoad={handleIframeLoad}
      onError={handleIframeError}
      title={title}
      allow="fullscreen"
    />
  </object>
)}
```

### FormPreviewDialog.tsx Changes

**Line 128-132**: Remove sandbox restriction
```tsx
<iframe 
  src={previewUrl} 
  className="w-full h-full min-h-[500px]" 
  title={`Preview: ${documentName}`}
  allow="fullscreen"
/>
```

---

## Architecture Diagram

```text
Before (Blocked):
┌──────────────────────────────────────────────────────┐
│  Browser (Chrome)                                     │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │  Sandboxed Iframe                              │  │
│  │  sandbox="allow-scripts allow-same-origin"     │  │
│  │                                                │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  PDFium Plugin                           │  │  │
│  │  │  ❌ BLOCKED - plugins disabled in sandbox│  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘

After (Working):
┌──────────────────────────────────────────────────────┐
│  Browser (Chrome)                                     │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │  Object Tag (no sandbox)                       │  │
│  │  data="blob:...#toolbar=1&view=FitH"           │  │
│  │                                                │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  PDFium Plugin                           │  │  │
│  │  │  ✅ Works - plugins enabled               │  │  │
│  │  │  ✅ Blob URL = same-origin = secure       │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## Security Considerations

Removing the sandbox is safe because:

1. **Proxy validates URLs**: The `pdf-proxy` edge function only allows whitelisted domains (government sites)
2. **Binary validation**: Proxy checks PDF magic bytes (`%PDF-`) before returning content
3. **Blob URLs are same-origin**: When using the proxy, PDFs are converted to blob URLs which are inherently same-origin and can't escape the page context
4. **Direct URLs are Supabase storage**: Non-proxied URLs are from Supabase storage (signed URLs) which are trusted

---

## Expected Outcome

After implementation:
- PDFs from Supabase storage will display immediately without blocking
- PDFs from government sites (Miami-Dade, Florida Building) will load via proxy and display
- Chrome's built-in PDF viewer will work with full toolbar (zoom, download, print)
- Fallback chain ensures maximum compatibility across browsers
