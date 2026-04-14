

## Unified "Instant Quote" Tool for Property Owners

### Overview
Remove 3 service cards from the Member Dashboard and consolidate 5 trade categories into a single **"Instant Quote"** tool with an AI-powered estimating wizard, photo analysis, and DIY/Pro recommendations.

### Step 1: Update Member Dashboard (`src/pages/MemberDashboard.tsx`)

**Remove** these 3 service cards from the `services` array:
- "Roofing CRM" (line 191-198)
- "Door to Door World" (line 296-302)
- "PropertyIQ" (line 303-318)

**Replace** the individual trade cards (Roofing Services, Windows & Doors, Emergency Services, Tree Removal & Landscaping) with a single card:
- Title: "Instant Quote"
- Description: "Get instant AI-powered estimates for roofing, windows, emergency, landscaping & cleaning"
- Link: `/instant-quote`
- Icon: `Sparkles`

Also add "Roofing CRM", "Door to Door World", "PropertyIQ" to `contractorOnlyServices` so they only show for contractors (or simply delete them entirely — we'll delete them since you want them removed).

### Step 2: Create Instant Quote Flow Page (`src/pages/InstantQuote.tsx`)

A multi-step wizard page at `/instant-quote`:

**Screen 1 — Property Type** (matches your screenshot):
- Two cards: Commercial / Residential
- Clean design matching screenshot (no buttons on cards — click the whole card)
- GCN header with "Dashboard" link

**Screen 2 — Service Type Selection** (matches second screenshot):
- 5 clickable cards (no buttons, just interactive squares):
  - **Roofing** (combines coating/repair/reroof) — HardHat icon
  - **Windows & Doors** — DoorOpen icon
  - **Emergency Services** — AlertTriangle icon
  - **Tree & Landscaping** — Trees icon
  - **Property Cleaning** — Sparkles icon
- "Back to property type" link
- Shows "For your **Residential/Commercial** property" subtitle

**Screen 3 — AI Estimating Wizard** (per trade):
- Similar multi-step flow to RoofScope wizard
- Each trade has trade-specific questions to gather accurate details
- Includes address autocomplete + satellite map for roofing
- Collects measurements, scope, conditions

**Screen 4 — AI Photo Analysis** (universal):
- Upload photos of ANY building material (roof, floor, carpet, wood, stucco, paint, soffits, eaves, drywall, concrete, etc.)
- AI scans each photo and returns:
  - Material identified
  - Condition assessment
  - Specific damage/issues found
  - Recommended repairs
- Results displayed as cards below each photo

**Screen 5 — Results & Recommendations**:
- Full AI-generated report of findings
- **Two paths**:
  1. **DIY Path**: Step-by-step instructions, estimated material costs, time required, tools needed
  2. **Call a Professional**: Connect to contractor directory / request quotes

### Step 3: Create AI Edge Function (`supabase/functions/instant-quote-ai/index.ts`)

A unified edge function that handles:
- Trade-specific question generation based on service type
- Photo analysis for any building material (not just roofs)
- DIY instruction generation with materials list, cost estimates, time, and tools
- Professional scope-of-work generation with pricing

Uses `google/gemini-3-flash-preview` via Lovable AI Gateway.

### Step 4: Create Trade-Specific Wizard Steps

Create `src/components/instant-quote/` with:
- `InstantQuoteWizard.tsx` — Main wizard container managing the full flow
- `PropertyTypeStep.tsx` — Commercial/Residential selection
- `ServiceTypeStep.tsx` — Trade category selection (5 cards)
- `RoofingWizardSteps.tsx` — Roofing-specific questions (reuses logic from RoofScope: roof type, condition, measurements via satellite map)
- `WindowsWizardSteps.tsx` — Window/door questions (reuses logic from WindowQuoteCalculator)
- `EmergencyWizardSteps.tsx` — Emergency service questions (reuses logic from EstimateQuizTool)
- `LandscapingWizardSteps.tsx` — Tree/landscaping questions (reuses logic from TreeEstimateQuiz)
- `CleaningWizardSteps.tsx` — Property cleaning questions (pressure washing, carpet, interior, exterior, stain analysis)
- `PhotoAnalysisStep.tsx` — Universal AI photo upload + analysis
- `ResultsStep.tsx` — DIY instructions vs Call Professional output

### Step 5: Add Route (`src/App.tsx`)

Add `/instant-quote` route pointing to `InstantQuote.tsx`.

### Files Summary

| File | Action |
|------|--------|
| `src/pages/MemberDashboard.tsx` | Remove 3 cards, replace 4 trade cards with 1 "Instant Quote" card |
| `src/pages/InstantQuote.tsx` | New page — thin wrapper |
| `src/components/instant-quote/InstantQuoteWizard.tsx` | New — main wizard orchestrator |
| `src/components/instant-quote/PropertyTypeStep.tsx` | New — Commercial/Residential |
| `src/components/instant-quote/ServiceTypeStep.tsx` | New — 5 trade cards |
| `src/components/instant-quote/RoofingWizardSteps.tsx` | New — roofing questions |
| `src/components/instant-quote/WindowsWizardSteps.tsx` | New — window/door questions |
| `src/components/instant-quote/EmergencyWizardSteps.tsx` | New — emergency questions |
| `src/components/instant-quote/LandscapingWizardSteps.tsx` | New — tree/landscaping questions |
| `src/components/instant-quote/CleaningWizardSteps.tsx` | New — property cleaning questions |
| `src/components/instant-quote/PhotoAnalysisStep.tsx` | New — universal AI photo analysis |
| `src/components/instant-quote/ResultsStep.tsx` | New — DIY vs Professional results |
| `supabase/functions/instant-quote-ai/index.ts` | New edge function for AI analysis + DIY generation |
| `src/App.tsx` | Add `/instant-quote` route |

This is a large build. I'll implement it incrementally — starting with the flow shell (property type → service type → placeholder wizard steps), then filling in each trade's wizard questions, then the AI photo analysis, then the DIY/Pro results page.

