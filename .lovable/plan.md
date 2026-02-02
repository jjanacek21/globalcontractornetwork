
# Fix PDF Preview Chrome Blocking Issues

## Problem Analysis

The current `PDFViewerDialog` component faces Chrome blocking issues when viewing NOA documents from:
- **Miami-Dade County** (`miamidade.gov`)  
- **Florida Building Code** (`floridabuilding.org`)
- **Other government sites** (`.gov/`)

### Why Documents Are Blocked

1. **CORS (Cross-Origin Resource Sharing)**: Government servers don't send `Access-Control-Allow-Origin` headers
2. **X-Frame-Options**: Many government sites set `DENY` or `SAMEORIGIN` headers preventing iframe embedding
3. **Content-Security-Policy**: Restricts embedding in foreign origins
4. **Google Docs Viewer Limitations**: Only works for publicly accessible URLs without restrictions, often times out

### Current Fallback Chain (Often Fails)

```text
Direct iframe → Google Docs viewer → Plain URL → Error state
```

---

## Solution: Server-Side PDF Proxy Edge Function

Create a new edge function that proxies PDF requests through your server, bypassing browser restrictions entirely.

### How It Works

```text
Frontend → Edge Function (pdf-proxy) → Government Server → Returns PDF bytes → Frontend displays
```

The edge function runs server-side where CORS doesn't apply, fetches the PDF, and streams it back with proper headers.

---

## Implementation Details

### 1. New Edge Function: `pdf-proxy`

**File**: `supabase/functions/pdf-proxy/index.ts`

| Feature | Description |
|---------|-------------|
| **Input** | PDF URL to proxy |
| **Security** | Validate URL is from allowed domains only |
| **Headers** | Uses appropriate `User-Agent` to avoid bot blocks |
| **Output** | Returns PDF bytes with `application/pdf` content type |
| **Caching** | Optional: Cache frequently accessed PDFs |

**Allowed Domains (Whitelist)**:
- `miamidade.gov`
- `floridabuilding.org`  
- `*.gov`
- Supabase storage URLs

### 2. Updated `PDFViewerDialog` Component

**Changes**:
1. Detect external government URLs that need proxying
2. Call the `pdf-proxy` edge function instead of direct loading
3. Use the proxied URL in the iframe
4. Maintain existing fallbacks (Google Viewer, Open in New Tab)

**New Fallback Chain**:
```text
Proxy via edge function → Google Docs viewer → Open in new tab
```

### 3. New Hook: `usePdfProxy`

Small utility hook to:
- Generate proxied URLs for external documents
- Cache proxy results
- Handle loading states

---

## Technical Specification

### Edge Function Implementation

```typescript
// Pseudocode for pdf-proxy/index.ts

1. Validate URL is from allowed domains
2. Fetch PDF from source with custom User-Agent headers
3. Validate response is actual PDF (check magic bytes)
4. Return PDF bytes with CORS headers
5. Handle errors gracefully
```

### Component Changes

```typescript
// PDFViewerDialog changes

1. Add getProxiedUrl() function
2. For external gov URLs: call pdf-proxy edge function
3. Use Blob URL from response for iframe src
4. Add progress indicator during proxy fetch
5. Better error messages when proxy fails
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/pdf-proxy/index.ts` | Edge function to proxy external PDFs |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/PDFViewerDialog.tsx` | Add proxy logic, better fallbacks, cleaner UX |

---

## Security Considerations

1. **URL Whitelist**: Only allow proxying from known government domains
2. **Rate Limiting**: Prevent abuse of the proxy
3. **Size Limits**: Cap maximum file size (e.g., 25MB)
4. **No User Input in URLs**: Validate URLs server-side

---

## User Experience Improvements

| Issue | Solution |
|-------|----------|
| Loading takes too long | Add progress indicator with time estimate |
| Can't tell if loading or stuck | Show "Fetching from [domain]..." message |
| Google Viewer fails silently | Show clear error with "Open in New Tab" button |
| Download doesn't work | Use proxy for downloads too |

---

## Expected Result

After implementation:
- NOA documents from Miami-Dade and Florida Building will load reliably in the viewer
- No more Chrome blocking errors
- Seamless inline viewing experience
- Fallback to "Open in New Tab" always available
