
# AI Homeowner Assistant with Instant Measurements & Photo Analysis

## Overview

Build an intelligent AI chatbot for the homeowner dashboard that can:
1. **Answer cost questions** by asking for the address, performing instant satellite roof measurements, and returning price ranges
2. **Analyze uploaded photos** to assess project conditions, provide detailed scope of work, cost estimates, and contractor recommendations

## Architecture

```text
+------------------+     +----------------------+     +------------------+
|   HomeownerChat  |---->| homeowner-assistant  |---->| roof-vision-ai   |
|   Component      |     | Edge Function        |     | (satellite sqft) |
+------------------+     +----------------------+     +------------------+
        |                         |
        v                         v
+------------------+     +----------------------+
|  Photo Upload    |     | analyze-roof-photo   |
|  (existing hook) |     | + project-advisor-ai |
+------------------+     | (new edge function)  |
                         +----------------------+
```

## Key Features

### 1. Conversational Cost Estimation Flow
- User asks: "How much would a metal roof cost?"
- AI asks: "What's the address for this project?"
- User provides address
- AI calls `roof-vision-ai` to get instant satellite measurement
- AI uses `packagePricing.ts` price ranges to calculate estimates
- AI responds with: "Based on your 28-square roof, a metal roof would cost $24,000-$36,000 depending on the package"

### 2. Photo-Based Project Assessment
- User uploads photos of their property/project
- AI analyzes photos using vision model to detect:
  - Roof condition (damage indicators, age estimation)
  - Material type and color
  - Issues requiring attention
- AI provides:
  - Detailed scope of work
  - Cost guesstimate based on detected issues
  - Contractor selection recommendations
  - Florida Building Code considerations

### 3. Knowledge-Enhanced Responses
- Leverages existing training data and permit knowledge
- Can search web for current pricing trends and code requirements
- References Florida-specific requirements (HVHZ, NOAs, etc.)

## Technical Implementation

### New/Modified Components

| Component | Type | Purpose |
|-----------|------|---------|
| `src/components/homeowner/HomeownerAIChat.tsx` | New | Dedicated AI chat component for homeowner dashboard |
| `supabase/functions/homeowner-assistant/index.ts` | New | Main AI orchestrator with tool calling |
| `supabase/functions/project-advisor-ai/index.ts` | New | Photo analysis + scope/cost generation |

### Edge Function: `homeowner-assistant`

Core capabilities via tool calling:

```typescript
const tools = [
  {
    name: "get_roof_measurement",
    description: "Get instant roof measurement from satellite imagery",
    parameters: { address: string }
  },
  {
    name: "calculate_roof_estimate",
    description: "Calculate price ranges based on roof squares",
    parameters: { squares: number, roofType: "shingle" | "metal" | "tile" }
  },
  {
    name: "analyze_project_photos",
    description: "Analyze uploaded photos for project assessment",
    parameters: { photoUrls: string[], projectType: string }
  },
  {
    name: "search_knowledge_base",
    description: "Search contractor knowledge base for recommendations",
    parameters: { query: string }
  }
];
```

### Edge Function: `project-advisor-ai`

Multi-photo analysis that provides:
- Condition assessment (roof, siding, windows, etc.)
- Detected issues with severity ratings
- Recommended scope of work
- Cost estimates based on typical Florida pricing
- Contractor selection tips based on project complexity
- Code compliance notes

### HomeownerAIChat Component Features

- Floating chat bubble on homeowner dashboard
- Photo upload capability (uses existing `useHomeownerPhotos` hook)
- Address autocomplete integration
- Real-time streaming responses
- Price range display with package breakdowns
- "Get Quote" action buttons for next steps

## Conversation Flow Examples

### Example 1: Cost Question
```
User: "How much would a metal roof cost?"
AI: "I'd be happy to give you a price estimate! What's the property address?"
User: "123 Palm Beach Blvd, Fort Lauderdale FL"
AI: [Measuring via satellite...]
AI: "Based on your 32-square roof at 123 Palm Beach Blvd:
     
     🏠 Roof Size: 3,200 sq ft (32 squares)
     
     Metal Roof Options:
     • Blue Collar (5V Crimp): $27,520
     • Blue Collar+ (Kynar): $29,760
     • Platinum (Standing Seam): $35,200 - $41,600
     
     Would you like to schedule a free inspection or see package details?"
```

### Example 2: Photo Assessment
```
User: [Uploads 3 photos of roof]
AI: "I've analyzed your photos. Here's what I found:
     
     📋 Assessment:
     • Material: Architectural asphalt shingles
     • Condition: Fair (visible granule loss, minor curling)
     • Estimated Age: 12-15 years
     
     ⚠️ Issues Detected:
     • Granule loss in multiple areas
     • 2-3 shingles showing curling at edges
     • Minor moss growth near gutters
     
     📝 Recommended Scope:
     1. Full roof replacement (recommended within 2-3 years)
     2. Gutter cleaning and inspection
     
     💰 Estimated Cost: $18,000 - $25,000 for shingle replacement
     
     🔍 Contractor Tips:
     • Get 3 quotes from licensed Florida roofers
     • Verify their insurance and local references
     • Ask about warranties on workmanship
     
     Would you like me to find verified contractors in your area?"
```

## Data Flow

1. **Authentication**: Uses existing Supabase auth - only logged-in homeowners can access
2. **Photo Storage**: Uses existing `homeowner_photos` table and storage bucket
3. **Conversation History**: Stored in memory during session (can extend to persist if needed)
4. **Measurements**: Cached in `roof_analysis_cache` for repeat lookups

## UI Integration

The chat will be added to `HomeownerDashboard.tsx` as a new tool card in the "Homeowner Tools" section:

```
+----------------------------------+
| 🤖 AI Project Advisor            |
| Get instant estimates & advice   |
+----------------------------------+
```

Additionally, a floating chat bubble (similar to `GlobalAIChat`) will be available throughout the homeowner dashboard pages.

## Security Considerations

- All AI processing happens server-side via edge functions
- Photo URLs are validated before processing
- User ID is verified from auth token
- Rate limiting applied to prevent abuse
- Price ranges are clearly marked as estimates

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/homeowner/HomeownerAIChat.tsx` | Create | Main chat component with photo upload |
| `src/components/homeowner/PhotoUploadButton.tsx` | Create | Inline photo upload for chat |
| `src/hooks/useHomeownerAIChat.ts` | Create | Chat state + tool handling |
| `supabase/functions/homeowner-assistant/index.ts` | Create | Main orchestration function |
| `supabase/functions/project-advisor-ai/index.ts` | Create | Photo analysis function |
| `src/pages/HomeownerDashboard.tsx` | Modify | Add AI chat tool card |
| `supabase/config.toml` | Modify | Register new edge functions |

## Dependencies

Uses existing infrastructure:
- `roof-vision-ai` for satellite measurements
- `analyze-roof-photo` for individual photo analysis
- `packagePricing.ts` for pricing data
- `useHomeownerPhotos` for photo uploads
- Mapbox for address autocomplete

## Estimated Effort

- Frontend components: ~400 lines
- Edge functions: ~600 lines
- Integration & testing: Minor modifications to existing files

This creates a powerful AI assistant that transforms the homeowner experience from "fill out a form and wait" to "get instant answers and estimates through natural conversation."
