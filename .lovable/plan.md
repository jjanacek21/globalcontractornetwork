
# Fix Permit Packet Download - Only Cover Sheet Downloading

## Problem Summary

When downloading a permit packet, only the cover sheet is included because the frontend isn't correctly retrieving the merged PDF URL. The edge function successfully merges documents and uploads the packet, but the frontend can't access it.

## Root Cause Analysis

### Issue 1: Wrong Column Name in PacketDownloader

**File**: `src/components/permit-queens/PacketDownloader.tsx` (line 117-127)

```typescript
// Current code - WRONG column name
const { data: packet } = await supabase
  .from('permit_packets')
  .select('*')
  .eq('id', packetData.packetId)
  .single();

const packetRecord = packet as { packet_pdf_url?: string } | null;
if (packetRecord?.packet_pdf_url) {  // ❌ This column doesn't exist!
  setPacketUrl(packetRecord.packet_pdf_url);
```

**The database column is `file_path`, NOT `packet_pdf_url`**

### Issue 2: Ignoring Edge Function Response

The edge function already returns the packet URL in `packetData.packetPdfUrl` (line 1010 of edge function), but the frontend ignores it and queries the database instead.

### Database Evidence

The packet exists with the correct URL in `file_path`:
- `file_path`: `https://ujalvgknnbsxqpujxvwk.supabase.co/storage/v1/object/sign/permit-documents/packets/...`
- `document_count`: 6
- `total_pages`: 9

## Solution

### Fix 1: Use Edge Function Response Directly (Preferred)

Instead of querying the database, use the URL returned directly from the edge function:

```typescript
// Use the URL from edge function response
if (packetData?.packetPdfUrl) {
  setPacketUrl(packetData.packetPdfUrl);
  onPacketReady?.(packetData.packetPdfUrl);
}
```

### Fix 2: Correct the Column Name (Fallback)

If database query is still needed, use the correct column:

```typescript
const packetRecord = packet as { file_path?: string } | null;
if (packetRecord?.file_path) {
  setPacketUrl(packetRecord.file_path);
```

## Implementation Details

### File to Modify

**`src/components/permit-queens/PacketDownloader.tsx`**

| Line Range | Change |
|------------|--------|
| 115-128 | Replace database query with direct use of edge function response |

### Updated Code Flow

```text
1. Call permit-packet-assembler edge function
2. Edge function merges PDFs and returns { packetPdfUrl: "signed-url" }
3. Frontend uses packetPdfUrl directly (no DB query needed)
4. User clicks Download → fetches from packetPdfUrl
```

## Technical Details

### Edge Function Response Structure (already correct)

The edge function at lines 996-1011 returns:
```typescript
{
  success: true,
  data: {
    packetId: packet?.id,
    documentIndex: [...],
    packetPdfUrl: signedUrl, // ✅ Already includes the merged PDF URL
    // ...
  }
}
```

### Changes Required

1. Remove the unnecessary database query (lines 117-121)
2. Use `packetData.packetPdfUrl` directly from the edge function response
3. Keep the `packetData.packetId` storage for reference if needed

## Expected Result

After the fix:
- Packet downloads will include ALL merged documents (cover sheet + uploaded PDFs + NOAs)
- No additional database query needed
- Faster packet retrieval (one less round trip)
