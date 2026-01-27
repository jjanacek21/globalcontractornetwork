
# AI Training Center & NOA Intelligence Engine - Complete Fixes

## Issues Identified

### Critical Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Wrong API endpoint | `process-training-book` | 404 error, books fail to process |
| Missing config entry | `supabase/config.toml` | `process-training-book` may not deploy properly |
| Stuck training records | `permit_packet_training` table | 2 records stuck in "processing" |
| Stuck training books | `permit_training_books` table | 1 book stuck in "processing", 1 failed |

### Database State

**Product Approvals:**
- 748 pending (93.7%)
- 15 with PDFs (1.9%)
- 0 AI-extracted metadata

**Training Books:**
- 1 stuck in "processing"
- 1 failed (AI analysis failed: 404)

**Training Samples:**
- 2 stuck in "processing"
- 4 completed

---

## Fix Plan

### Part 1: Fix `process-training-book` Edge Function

**Problem:** The function calls `https://api.lovable.dev/api/v1/chat` which returns 404.

**Solution:** Update to use the correct Lovable AI Gateway URL:

```typescript
// WRONG (current):
const aiResponse = await fetch("https://api.lovable.dev/api/v1/chat", {

// CORRECT (fix):
const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
```

Also need to update the request body structure to match the OpenAI-compatible format the gateway expects.

**File:** `supabase/functions/process-training-book/index.ts`

---

### Part 2: Add Missing Config Entry

**Problem:** `process-training-book` is not in `supabase/config.toml`

**Solution:** Add the function configuration:

```toml
[functions.process-training-book]
verify_jwt = false
```

**File:** `supabase/config.toml`

---

### Part 3: Fix NOA Metadata Extractor for PDF Processing

**Problem:** The current implementation tries to pass a PDF as an `image_url` which Gemini may not process correctly.

**Solution:** Use the correct content format for PDF files with the Lovable AI Gateway:

```typescript
// For PDFs, use tool calling to extract structured data instead of vision
// Or convert PDF to images first before sending to vision model
```

The extractor should:
1. Try vision with the PDF URL directly (Gemini 2.5 Flash supports PDF vision)
2. If that fails, use text-based extraction from the PDF content

**File:** `supabase/functions/noa-metadata-extractor/index.ts`

---

### Part 4: Clean Up Stuck Records

**Problem:** 2 training samples and 1 training book stuck in "processing"

**Solution:** 
1. Add a database migration or RPC call to reset stuck records
2. Ensure the TrainingSamplesTable already has cleanup logic (it does via `cleanup_stuck_training_records` RPC)
3. Add similar cleanup logic for training books

---

### Part 5: Enhance NOA Bulk Downloader

**Current State:** The downloader tries multiple URL patterns but Miami-Dade PDFs are not directly accessible.

**Enhancements:**
1. Add more manufacturer-specific URL patterns (GAF, CertainTeed, Owens Corning)
2. Add Florida Building Code product approval database patterns
3. Improve logging for debugging failed downloads

---

### Part 6: Add Learning Progress Dashboard to NOA Intelligence Tab

Create a visual dashboard showing:
- Total products in database
- Products with PDFs vs without
- Products with AI-extracted metadata
- Recent extraction activity

**File:** `src/components/permit-queens/admin/NOABulkManager.tsx` (enhance existing stats section)

---

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/process-training-book/index.ts` | Modify | Fix API endpoint URL |
| `supabase/config.toml` | Modify | Add process-training-book config |
| `supabase/functions/noa-metadata-extractor/index.ts` | Modify | Fix PDF processing format |
| `src/components/permit-queens/admin/NOABulkManager.tsx` | Modify | Add AI extraction stats |
| `src/components/permit-queens/admin/NOAUploadQueue.tsx` | Modify | Improve error handling and display |

---

## Implementation Details

### Fix 1: `process-training-book` API Endpoint

```typescript
// Line 130 - Change from:
const aiResponse = await fetch("https://api.lovable.dev/api/v1/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${lovableApiKey}`,
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [/* ... */],
    max_tokens: 8000,
    temperature: 0.3,
  }),
});

// To:
const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${lovableApiKey}`,
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: extractionPrompt },
        { 
          type: "image_url", 
          image_url: { url: `data:${mimeType};base64,${base64Content}` }
        }
      ]
    }],
    max_tokens: 8000,
  }),
});
```

### Fix 2: Config.toml Addition

```toml
[functions.process-training-book]
verify_jwt = false
```

### Fix 3: Enhanced NOA Stats

Add to `NOABulkManager.tsx`:
- Count of products with `ai_extracted_at` populated
- Average extraction confidence score
- Last extraction timestamp

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Training book processing | 404 errors | Successful extraction |
| Books stuck in processing | 2 | 0 |
| NOA metadata extraction | Not working | AI-powered extraction |
| Edge function deployment | Missing config | Properly configured |

---

## Testing Steps

1. **Test book processing:**
   - Go to AI Training Center > Books & Guides
   - Click "Process Now" on a pending book
   - Verify it progresses to "completed" status

2. **Test NOA upload extraction:**
   - Go to AI Training Center > NOA Intelligence
   - Upload a NOA PDF
   - Click "Process Files"
   - Verify metadata is extracted and displayed

3. **Test bulk download:**
   - Click "Download Missing NOAs"
   - Check console/network logs for attempts
   - Verify any successful downloads appear in database
