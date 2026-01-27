

# Complete AI Learning Pipeline & Knowledge Visibility Dashboard

## What This Plan Delivers

| Feature | Description |
|---------|-------------|
| **Book Processing** | AI will actually read your uploaded PDFs/texts and extract knowledge |
| **Knowledge Browser** | See exactly what rules, patterns, and information the AI has learned |
| **Learning Feed** | Real-time feed showing what the AI learned from each training session |
| **Processing Dashboard** | Track status of all uploads with retry capability |

## Architecture Overview

```text
+------------------------+     +------------------------+
|  Books & Guides Upload |     |  Permit Packet Upload  |
+----------+-------------+     +----------+-------------+
           |                              |
           v                              v
+------------------------+     +------------------------+
| process-training-book  |     | permit-packet-analyzer |
| (NEW EDGE FUNCTION)    |     | (existing)             |
+----------+-------------+     +----------+-------------+
           |                              |
           +------------+  +--------------+
                        |  |
                        v  v
              +-------------------+
              | permit_ai_knowledge |
              | (unified knowledge  |
              |  base)              |
              +-------------------+
                        |
                        v
              +-------------------+
              | AI Knowledge      |
              | Browser (NEW UI)  |
              +-------------------+
```

## Implementation Details

### 1. New Edge Function: `process-training-book`

This function will:
- Download the uploaded PDF/text from storage
- Use Lovable AI to extract structured knowledge
- Parse chapters, key rules, code references, and requirements
- Save extracted knowledge to `permit_ai_knowledge` table
- Update book status from "pending" to "completed"

**Knowledge Extraction Categories:**
- FBC Code References (e.g., "FBC 1523.4 - Roof deck attachment")
- Permit Requirements (e.g., "Miami-Dade requires NOA for all roofing products")
- Inspection Checkpoints (e.g., "Final inspection includes tie-down verification")
- Trade-Specific Rules (e.g., "Re-roofing over 25% requires full permit")
- HVHZ Special Requirements

### 2. New UI Component: `AIKnowledgeBrowser.tsx`

A searchable, filterable view of everything the AI has learned:

**Features:**
- Browse by category (Products, Rules, Requirements, Procedures)
- Filter by county, trade type, source
- Search across all learned knowledge
- See the source of each piece of knowledge
- View confidence scores and frequency counts

**Display Format:**
```text
+----------------------------------------------------------+
|  AI Knowledge Browser                        [Search...] |
+----------------------------------------------------------+
| Filters: [County ▼] [Trade ▼] [Category ▼] [Source ▼]    |
+----------------------------------------------------------+
| Knowledge Items (847 total)                              |
|                                                          |
| ┌────────────────────────────────────────────────────┐  |
| │ 📋 REQUIREMENT                                      │  |
| │ "FBC 1523.4 requires 8d nails at 6" OC for deck"   │  |
| │ County: Miami-Dade | Trade: Roofing                │  |
| │ Source: FBC 2023 Manual | Confidence: High         │  |
| └────────────────────────────────────────────────────┘  |
+----------------------------------------------------------+
```

### 3. New UI Component: `LearningActivityFeed.tsx`

A real-time feed showing what the AI learned from each session:

**Shows:**
- Recent training activities (last 50)
- What was uploaded (packet, book, product doc)
- Specific knowledge extracted from each
- Processing status and timestamps

**Example Entry:**
```text
┌────────────────────────────────────────────────────┐
│ 📚 Training Book Processed                  2m ago │
│ "Florida Building Code 2023 - Roofing Chapter"    │
│                                                    │
│ Extracted:                                         │
│ • 23 code references                               │
│ • 8 inspection requirements                        │
│ • 5 HVHZ-specific rules                           │
│ • 12 product approval patterns                     │
│                                                    │
│ Sample Knowledge:                                  │
│ "FBC 1523.4 - Deck attachment shall use..."       │
│ "HVHZ zone requires minimum 140 mph wind rating"  │
└────────────────────────────────────────────────────┘
```

### 4. Processing Status Dashboard

Add to Books & Guides tab:
- "Process Now" button to manually trigger processing
- Status indicators with progress
- Error messages and retry capability
- Estimated processing time

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/process-training-book/index.ts` | Edge function to extract knowledge from books |
| `src/components/admin/AIKnowledgeBrowser.tsx` | Browse all learned knowledge |
| `src/components/admin/LearningActivityFeed.tsx` | Real-time learning activity |
| `src/components/admin/BookProcessingControls.tsx` | Manual processing triggers |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/PermitBooksManager.tsx` | Add process button, show extracted chapters |
| `src/components/admin/AITrainingCenter.tsx` | Add new "Knowledge Base" tab |

## Database Updates

Add columns to track book processing:

```sql
ALTER TABLE permit_training_books 
ADD COLUMN IF NOT EXISTS knowledge_items_extracted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
```

## How the AI Becomes a Better Contractor

Once implemented, the uploaded training materials directly improve the AI by:

1. **Code Knowledge** - AI learns specific FBC sections and can cite them
2. **Jurisdiction Rules** - AI knows which county requires what documents
3. **Trade Requirements** - AI understands different requirements for roofing vs windows vs plumbing
4. **Inspection Prep** - AI can advise what inspectors look for
5. **Common Rejections** - AI learns from rejection patterns to prevent them

## Technical Implementation

### Edge Function: `process-training-book`

Uses Lovable AI (google/gemini-3-flash-preview) to:
1. Download PDF from storage bucket
2. Extract text content (using document parsing)
3. Send to AI with structured extraction prompt
4. Parse response into knowledge items
5. Upsert to `permit_ai_knowledge` table
6. Update book status to "completed"

### Knowledge Extraction Prompt

The AI will be instructed to extract:
- Specific code references with section numbers
- Requirements that must be met for permits
- Inspection checkpoints and what inspectors look for
- Trade-specific rules and exceptions
- HVHZ and special zone requirements
- Common mistakes and how to avoid them

Each extracted item includes:
- Category (code_reference, requirement, procedure, etc.)
- Full text of the rule/requirement
- Applicable counties
- Applicable trade types
- Confidence level

## Expected Outcome

After implementation:
- Uploaded books will process automatically
- You'll see exactly what knowledge was extracted
- The AI will use this knowledge when helping with permits
- You can browse and search all learned information
- You'll have visibility into the AI's growing expertise

