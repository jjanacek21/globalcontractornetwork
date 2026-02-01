
# Fix PDF Preview Chrome Blocking Issues

## Problem Summary

PDF previews are being blocked in Chrome due to multiple technical issues:

1. **CORS Blocking Direct Downloads**: The download button uses `fetch()` which fails for external government URLs
2. **404 Detection Missing**: When Miami-Dade returns a 404 error page (HTML), Google Docs viewer shows "No preview available" 
3. **No Content-Type Validation**: The viewer doesn't check if the URL returns HTML vs PDF before attempting to render
4. **Iframe Sandbox Restrictions**: The current sandbox settings may restrict some PDF viewer functionality

---

## Solution Plan

### Step 1: Implement Content-Type Validation (Recommended Fix)

Add a pre-flight check to verify the URL returns a PDF, not HTML:

```typescript
async function validatePdfUrl(url: string): Promise<{valid: boolean; error?: string}> {
  try {
    // Use HEAD request to check content-type without downloading full file
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    // If we can get headers, check content-type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/pdf')) {
      return { valid: false, error: 'URL returns HTML, not PDF' };
    }
    return { valid: true };
  } catch {
    // CORS blocked - assume valid and let Google viewer handle it
    return { valid: true };
  }
}
```

### Step 2: Fix Download for External URLs

Replace the fetch-based download with a direct link approach that works for external URLs:

```typescript
const handleDownload = async () => {
  if (isExternalGov(url)) {
    // For external government sites, open in new tab (bypass CORS)
    window.open(url, '_blank');
    toast.info('Opening PDF in new tab for download');
    return;
  }
  // Keep existing fetch-based download for internal files
  // ... existing code
};
```

### Step 3: Add Proactive Error Detection

Update the iframe to detect when Google Docs viewer fails:

```typescript
// Add onLoad handler that checks for Google Docs error messages
const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
  setLoading(false);
  // Google Docs viewer displays specific text when PDF is unavailable
  // We can't read iframe content due to cross-origin, but we can show a hint
};
```

### Step 4: Add Direct "Open in New Tab" Button

Add a prominent "Open in Browser" button that bypasses all viewer restrictions:

```typescript
<Button variant="secondary" onClick={() => window.open(url, '_blank')}>
  <ExternalLink className="h-4 w-4 mr-2" />
  Open in Browser
</Button>
```

### Step 5: Remove Restrictive Sandbox Attribute

For PDF viewers, the sandbox attribute can cause issues. Update to allow more PDF functionality:

```typescript
// Change from:
sandbox="allow-scripts allow-same-origin"

// To:
sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/PDFViewerDialog.tsx` | Add content validation, fix download for external URLs, add "Open in Browser" button, update sandbox settings |

---

## Technical Details

### Why Chrome Blocks These PDFs

1. **CORS Policy**: External government sites don't include `Access-Control-Allow-Origin` headers
2. **Mixed Content**: Some Miami-Dade URLs may be HTTP (not HTTPS)
3. **X-Frame-Options**: Some government sites set `X-Frame-Options: DENY` which prevents embedding
4. **Content-Type Mismatch**: 404 pages return HTML with `text/html` content-type

### Google Docs Viewer Limitations

The Google Docs viewer (`https://docs.google.com/viewer?url=...`) has these known issues:
- Cannot render PDFs larger than 25MB
- Cannot access password-protected PDFs
- Shows "No preview available" for any error condition
- Has rate limits that can trigger temporary blocks

### Recommended Fallback Strategy

```
1. Try direct object/iframe embed
   ↓ (fails due to CORS)
2. Try Google Docs viewer
   ↓ (fails due to 404 or rate limit)
3. Show "Open in Browser" button
   ↓ (user clicks)
4. PDF opens in new tab where browser can render it natively
```

---

## Expected Outcome

After implementing these fixes:

1. **Download button works** for external government PDFs (opens in new tab)
2. **Better error messaging** when PDFs are unavailable
3. **"Open in Browser" button** always available as reliable fallback
4. **Fewer sandbox restrictions** for better PDF rendering
5. **Clearer user experience** with actionable next steps when preview fails
