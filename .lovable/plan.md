## Restore originals + build custom wizards for all 20 new trades

### Goals
- Bring back the original Roofing, Windows, Emergency, Landscaping, Cleaning wizards exactly as they were (3D, colorful, animated).
- Add a hand-tailored wizard for each of the 20 new trades — not a single generic engine.
- Keep the look-and-feel consistent (colorful icon badges, gradient cards, fade/scale animations, good/better/best style results).

### Step 1 — Restore the original entry flow
- Revert `src/pages/InstantQuote.tsx` to render `<InstantQuoteWizard />` so the working Property Type → Service Type → Roofing/Windows/etc. → Photos → Results experience returns immediately.
- No changes to `RoofingWizardSteps.tsx`, the `roofing/` subfolder, `WindowsWizardSteps.tsx`, `EmergencyWizardSteps.tsx`, `LandscapingWizardSteps.tsx`, `CleaningWizardSteps.tsx`, `PhotoAnalysisStep.tsx`, or `ResultsStep.tsx`.

### Step 2 — Expand the Service Type screen to all 25 trades
- Update `ServiceTypeStep.tsx` to display all 25 services, grouped by category with distinct color accents per category:
  - Exterior (slate/blue): Roofing, Gutters, Soffit & Fascia, Siding, Stucco, EIFS Bands, Exterior Paint, Pavers, Pressure Washing, Windows, Doors
  - Interior (amber/emerald): Interior Renovation, Cabinets, Flooring, Drywall, Interior Paint, Texture, Crown Molding
  - Kitchen & Bath (rose/violet): Kitchens, Bathrooms
  - MEP (indigo): Electrical, Plumbing
  - Specialty (teal/green): Tree & Landscaping, Window Cleaning
  - Emergency (red): Emergency Services
- Each card keeps the same 3D hover + colored icon badge style as today, with `animate-fade-in` / `hover-scale`.

### Step 3 — Shared "wizard kit" for the 20 new trades
Create reusable building blocks at `src/components/instant-quote/kit/` (NOT a generic engine — each wizard composes them with its own copy, questions, math, and visuals):
- `WizardShell.tsx` — colored gradient header, animated step indicator, back/next, fade-in transitions
- `OptionGrid.tsx` — large 3D selectable cards with icon + title + price modifier
- `PhotoUploadStep.tsx` — drag-drop with thumbnail grid, calls `iq-analyze-photos`
- `MeasurementStep.tsx` — variants for sqft / linear ft / count / room count / satellite preview
- `PackagesResultsStep.tsx` — Standard / Premium / Luxury tier cards with gradient accents and animated price reveal, mirrors the roofing packages style
- `useTradeConfig(slug)` — loads questions/pricing/AI prompts from `iq_trades`/`iq_trade_questions`/`iq_trade_pricing_options` for that trade

### Step 4 — Custom wizard per trade
One file per trade in `src/components/instant-quote/trades/`. Each is a small bespoke component composing the kit pieces with its own logic and accents. Phase delivery in 4 batches so we can verify the look between each:

**Batch A (Exterior add-ons):** Gutters, Soffit & Fascia, Siding, Stucco, Exterior Paint, EIFS Bands, Pavers
**Batch B (Interior renovations):** Interior Renovation, Cabinets, Flooring, Drywall, Interior Paint, Texture, Crown Molding
**Batch C (Kitchen/Bath + MEP):** Kitchens, Bathrooms, Electrical, Plumbing
**Batch D (Specialty):** Doors, Window Cleaning (Tree & Landscaping and Pressure Washing already exist)

Each wizard step includes:
- Trade-specific intro screen with a colored hero icon
- 3–6 trade-specific questions (material choice, scope, finishes, urgency, etc.) sourced from already-seeded `iq_trade_questions`
- Measurement step appropriate for that trade (sqft, lf, count, rooms, or satellite preview)
- Optional photos → AI condition analysis using the per-trade prompt already seeded in `iq_trade_ai_prompts`
- Results screen with 3 tier cards (Standard / Premium / Luxury) using the trade's seeded pricing, plus optional add-on chips

### Step 5 — Routing
- `/instant-quote` → original `<InstantQuoteWizard />`
- `/instant-quote/:tradeSlug` → loads the matching custom wizard from `src/components/instant-quote/trades/` registry. The new generic `TradeWizard.tsx` is removed once Batch D ships.

### Out of Scope
- DB schema/migrations (already in place from Phase 1).
- Edge functions (already deployed).
- Booking/payment flow after quote — CTA still writes to `iq_quote_requests`.

### Note on scope
20 hand-tailored wizards is substantial. To keep iteration tight, I'll ship Batch A first so you can confirm the look, then continue Batches B–D. Each batch is a single message that adds 4–7 wizards. Reply between batches with any styling tweaks you want propagated.
