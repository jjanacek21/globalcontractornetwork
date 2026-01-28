

# Complete the AI Training Center Learning Pipeline

## What's Missing

After reviewing the implementation, there are critical gaps preventing the AI from actually learning:

1. **Training books are failing to process** - 1 pending, 1 failed with timeout
2. **Knowledge table is empty** - 0 records in `permit_ai_knowledge`
3. **Packet assembler doesn't use AI knowledge** - It queries `fastener_patterns` and `building_department_rules` but NOT `permit_ai_knowledge`
4. **NOA metadata extraction returning no results** - 0 products have AI-extracted data
5. **PDF preview needs Google fallback** - Current implementation may fail on some PDFs

---

## Implementation Plan

### Part 1: Fix PDF Preview with Google Docs Fallback

The current `PDFViewerDialog` has a timeout-based fallback but it needs to actually show the Google Docs viewer when native rendering fails.

**Changes:**
- Add a "Try Google Viewer" button that appears after 3 seconds
- Use Google Docs viewer URL: `https://docs.google.com/viewer?url={url}&embedded=true`
- Add error state detection for iframe loading failures

### Part 2: Add `permit_ai_knowledge` Query to Packet Assembler

The permit-packet-assembler currently queries `fastener_patterns` and `building_department_rules` but completely ignores the `permit_ai_knowledge` table. This is why training data doesn't improve packet generation.

**Changes to permit-packet-assembler:**
```typescript
// Add after line 365 (after jurisdiction rules query)
const { data: aiKnowledge } = await supabase
  .from('permit_ai_knowledge')
  .select('*')
  .or(`jurisdiction_county.ilike.%${county}%,jurisdiction_county.is.null`)
  .or(`trade_type.eq.${tradeType},trade_type.eq.general`)
  .eq('is_verified', true)
  .order('confidence', { ascending: false })
  .limit(50);

if (aiKnowledge && aiKnowledge.length > 0) {
  console.log(`Found ${aiKnowledge.length} AI knowledge items`);
}
```

Then use this knowledge when generating cover sheets and compliance statements.

### Part 3: Fix process-training-book to Actually Extract Knowledge

The function is hitting an issue where it either times out or fails to parse the AI response. We need:

1. **Add retry logic** for AI calls that fail
2. **Improve JSON parsing** with multiple fallback strategies
3. **Add more logging** to diagnose where it's failing
4. **Reduce prompt complexity** for large documents

**Key changes:**
- Split large documents into smaller chunks
- Use simpler extraction prompt for initial pass
- Add structured logging at each step
- Implement exponential backoff for retries

### Part 4: Create Cleanup RPC for Stuck Training Books

Add a database function to reset stuck training books:

```sql
CREATE OR REPLACE FUNCTION cleanup_stuck_training_books()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE permit_training_books 
  SET 
    processing_status = 'pending',
    processing_error = 'Auto-cleanup: Processing timed out. Click Process Now to retry.'
  WHERE processing_status IN ('processing', 'failed')
  AND (updated_at < NOW() - INTERVAL '10 minutes' OR processing_error IS NOT NULL);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Part 5: Improve NOA Metadata Extraction

The extractor is running but not saving data. We need to:

1. Verify the extraction is actually being called
2. Add better error handling for edge cases
3. Ensure the database update is succeeding

**Changes:**
- Add validation before database update
- Log the metadata being extracted
- Handle cases where NOA number can't be determined

### Part 6: Add Learning Progress Dashboard

Create a new component that shows:
- Total knowledge items in database
- Items by category (fbc_code, permit_requirement, etc.)
- Items by source (training_book, permit_packet, rejection_feedback)
- Verification status (verified vs unverified)
- Recent learning activity

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/PDFViewerDialog.tsx` | Add Google Docs viewer fallback button |
| `supabase/functions/permit-packet-assembler/index.ts` | Add permit_ai_knowledge query |
| `supabase/functions/process-training-book/index.ts` | Add retry logic, improve JSON parsing |
| New migration | Add cleanup_stuck_training_books function |
| `src/components/permit-queens/admin/NOABulkManager.tsx` | Add knowledge items stats section |

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Training books completed | 0 | 2 |
| Knowledge items | 0 | 20-60 |
| AI knowledge used in packets | No | Yes |
| PDF preview reliability | ~70% | 95%+ |
| Stuck book cleanup | Manual | Automatic |

---

## Technical Details

### PDF Viewer Google Fallback

```typescript
// Add state for fallback
const [showGoogleFallback, setShowGoogleFallback] = useState(false);

// After 5 seconds, show fallback option
useEffect(() => {
  const timer = setTimeout(() => {
    if (!isLoaded) setShowGoogleFallback(true);
  }, 5000);
  return () => clearTimeout(timer);
}, [isLoaded]);

// Google viewer URL
const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
```

### Packet Assembler Knowledge Integration

The assembler will use knowledge items to:
1. Add jurisdiction-specific warnings to cover sheet
2. Include required documents based on learned patterns
3. Apply correct fastener patterns from training
4. Flag potential rejection reasons based on past data

### Knowledge Categories to Extract

- `fbc_code` - Florida Building Code references
- `permit_requirement` - What documents are needed
- `inspection_checkpoint` - Inspection sequence and requirements
- `trade_rule` - Trade-specific rules
- `hvhz_requirement` - High Velocity Hurricane Zone specifics
- `noa_product` - Product approval patterns
- `form_instruction` - How to fill specific forms

