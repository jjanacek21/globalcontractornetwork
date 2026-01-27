
# Fix PDF Viewing and Training Book Processing

## Problems Identified

| Issue | Cause | Fix |
|-------|-------|-----|
| "Bucket not found" when viewing PDFs | `permit-training-books` is a **private** bucket, but the code stores and uses public URLs | Store the file path (not full URL), generate signed URLs on-demand for viewing |
| Training materials stuck on "pending" | The `process-training-book` edge function doesn't exist yet | Create the edge function to extract knowledge from uploaded books |

## Root Cause Analysis

When uploading a training book, the current code does:

```text
1. Upload file to storage bucket
2. Call getPublicUrl() -> Returns public URL
3. Store publicUrl in database file_url column
4. When viewing: Pass publicUrl directly to PDFViewerDialog
5. Browser tries to fetch public URL -> "Bucket not found" (bucket is private)
```

The fix requires:

```text
1. Upload file to storage bucket
2. Store just the file path (filename) in database
3. When viewing: Generate signed URL with createSignedUrl()
4. Pass signed URL to PDFViewerDialog -> Works!
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/PermitBooksManager.tsx` | Store file path instead of public URL, generate signed URL when viewing |
| `src/components/ui/PDFViewerDialog.tsx` | No changes needed (already handles URLs correctly) |

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/process-training-book/index.ts` | Edge function to process uploaded PDFs and extract knowledge |

## Implementation Details

### 1. Fix PermitBooksManager.tsx Upload Logic

**Before (broken):**
```typescript
const { data: urlData } = supabase.storage
  .from("permit-training-books")
  .getPublicUrl(fileName);

// Store public URL (doesn't work for private buckets)
file_url: urlData.publicUrl
```

**After (fixed):**
```typescript
// Just store the file path, not the full URL
file_url: fileName  // e.g., "1769517958257_Florida building code.pdf"
```

### 2. Fix PermitBooksManager.tsx View Logic

**Before (broken):**
```typescript
onClick={() => setViewingBook({ url: book.file_url, title: book.title })}
```

**After (fixed):**
```typescript
onClick={async () => {
  // Generate signed URL for private bucket access
  const { data, error } = await supabase.storage
    .from('permit-training-books')
    .createSignedUrl(book.file_url, 3600); // 1-hour expiry
  
  if (data?.signedUrl) {
    setViewingBook({ url: data.signedUrl, title: book.title });
  }
}}
```

### 3. Add "Process Now" Button

Add a manual trigger button next to pending books that calls the `process-training-book` edge function to start extraction.

### 4. Create process-training-book Edge Function

This function will:
- Download the PDF from storage using signed URL
- Use Lovable AI to extract structured knowledge
- Parse chapters, code references, requirements
- Save extracted knowledge to database
- Update book status from "pending" to "completed"

**Extraction Categories:**
- FBC Code References (e.g., "FBC 1523.4 - Roof deck attachment")
- Permit Requirements (e.g., "Miami-Dade requires NOA")
- Inspection Checkpoints
- Trade-Specific Rules
- HVHZ Special Requirements

## Database Migration

Add columns to `permit_training_books` for tracking processing:

```sql
ALTER TABLE permit_training_books 
ADD COLUMN IF NOT EXISTS knowledge_items_extracted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
```

Create knowledge storage table:

```sql
CREATE TABLE permit_ai_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID REFERENCES permit_training_books(id),
  applicable_counties TEXT[] DEFAULT ARRAY[]::TEXT[],
  applicable_trades TEXT[] DEFAULT ARRAY[]::TEXT[],
  confidence_level TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Fixing Existing Records

Existing records in the database have full public URLs stored. The migration will include an update to extract just the filename:

```sql
UPDATE permit_training_books 
SET file_url = split_part(file_url, '/', -1)
WHERE file_url LIKE '%/storage/v1/object/public/%';
```

## Summary

1. **Immediate fix**: Update `PermitBooksManager.tsx` to use signed URLs for viewing
2. **Data fix**: Migration to convert existing full URLs to file paths
3. **Processing fix**: Create `process-training-book` edge function to process pending books
4. **Knowledge tracking**: Create database tables to store extracted knowledge

After implementation:
- PDF viewing will work for all uploaded training materials
- "Process Now" button will trigger knowledge extraction
- Status will update from "pending" to "completed"
- You'll see what the AI learned from each book
