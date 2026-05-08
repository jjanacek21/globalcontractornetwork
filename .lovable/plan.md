# Config-Driven Instant Quote Wizard Engine

Refactor the existing hard-coded Instant Quote flow into a single generic wizard that reads every trade, question, pricing tier, and AI prompt from the database. Adding a new trade becomes a row insert — no code changes.

## 1. Database (single migration)

New tables in `public`:

- **trades** — slug, name, category, icon_name, description, measurement_method, property_types[], licensed_entity_name, licensed_entity_number, requires_followup_call, active, sort_order, timestamps.
- **trade_questions** — trade_id (cascade), step_number, question_text, question_type, options jsonb, required, help_text, conditional_logic jsonb.
- **trade_pricing_options** — trade_id (cascade), tier_name, tier_order, base_price_per_unit, unit, inclusions text[], description.
- **trade_ai_prompts** — trade_id (cascade), prompt_type, system_prompt, output_schema jsonb.
- **quote_requests** — user_id (auth.users), trade_id, address, lat/lng, property_type, answers jsonb, uploaded_photos text[], ai_analysis jsonb, measurements jsonb, estimate_low/mid/high, selected_tier, selected_upgrades jsonb, status, timestamps.

RLS:
- Public read on `trades`, `trade_questions`, `trade_pricing_options`, `trade_ai_prompts`. Write restricted to super admins (use existing `is_super_admin()`).
- `quote_requests`: owner read/write via `auth.uid() = user_id`.

Storage:
- Create `quote-photos` bucket, public read, authenticated upload, path `{userId}/{quoteId}/{filename}`.

Standard `updated_at` trigger applied to all new tables.

## 2. Seed Data (all 25 trades)

Single seed migration inserts the 25 trades from the spec (roofing, gutters, soffit/fascia, siding, stucco, EIFS bands, exterior paint, pavers, pressure washing, window cleaning, windows, doors, interior renovation, kitchens, bathrooms, cabinets, flooring, drywall, interior paint, texture, crown molding, electrical, plumbing, emergency services, tree & landscaping). For each trade:

- 3–6 `trade_questions` per the spec
- 3 `trade_pricing_options` (Standard / Premium / Luxury) with the listed base prices, units, and inclusions
- 1 `trade_ai_prompts` row (`condition_analysis`) using the Florida-specific template, customized with 2–3 trade-specific inspection criteria
- `licensed_entity_name = 'TBD - Licensed Subcontractor'`, `licensed_entity_number = 'TBD'`

## 3. Edge Functions

All three use `Deno.serve` (no stdlib http import), route AI through Lovable AI Gateway with `google/gemini-3-flash-preview` (default project standard) instead of Claude direct, validate input with zod-style guards, return `{ success, data, error }`.

1. **analyze-property-satellite** — geocode address via Mapbox, fetch satellite static image URL, call Google Solar API (where method = satellite) for roof/footprint area; falls back to Mapbox-only payload if Solar fails.
2. **analyze-photos-ai** — loads `trade_ai_prompts` row by `trade_id` + `prompt_type`, sends photos as vision blocks via AI Gateway, returns JSON conforming to `output_schema` using tool-calling for structured output.
3. **calculate-estimate** — loads `trade_pricing_options` for the trade, applies `price_modifier_pct` from selected answer options, computes mid then ±15% low/high, returns line items.

## 4. Frontend Components

- **`<ServicesGrid />`** — replaces hard-coded service cards on the Instant Quote landing page. Queries `trades` filtered by `active = true` and selected property type, grouped by category, ordered by `sort_order`. Resolves the lucide icon dynamically from `icon_name`.
- **`<TradeWizard tradeSlug={slug} />`** — single generic component that drives every trade:
  1. Address (Mapbox autocomplete, reuses existing `AddressAutocomplete` with the value-sync pattern)
  2. Measurement step branched on `trade.measurement_method`:
     - `satellite` → map preview + `analyze-property-satellite`
     - `photo_ai` → upload + `analyze-photos-ai` (measurement_extraction)
     - `manual_input` → numeric inputs (sqft / linear_ft)
     - `count_based` → quantity inputs
     - `room_based` → multi-room selector with per-room dimensions
  3. Dynamic question loop ordered by `step_number`, honoring `conditional_logic`
  4. Optional photo upload step calling `analyze-photos-ai` (condition_analysis) when applicable
  5. Results via `calculate-estimate`
- **`<QuoteResults />`** — three pricing-tier cards, upgrade toggles, low/mid/high range, persistent disclaimer:
  > "Estimate provided by [licensed_entity_name], FL License #[licensed_entity_number]. The Global Contractor Network, LLC operates as a contractor referral and marketing service."
  CTA writes a `quote_requests` row with status `submitted` and triggers a follow-up call request when `trade.requires_followup_call`.
- **`<AdminTradesPanel />`** at `/admin/trades` — super-admin-gated CRUD over trades, questions, pricing tiers, and AI prompts (tabbed editor per trade).

## 5. Wiring & Cleanup

- `/instant-quote` route uses the new engine. Existing `RoofingWizardSteps`, `WindowsWizardSteps`, `EmergencyWizardSteps`, `LandscapingWizardSteps`, `CleaningWizardSteps` are removed; their roofing-specific satellite/condition/packages logic is preserved by mapping into the generic `satellite` + `photo_ai` measurement modes.
- Keep the existing breadcrumb pattern (Property Type → Service → Details → Photo Analysis → Results).
- Match GCN navy/gold palette via existing semantic tokens; mobile-responsive (current viewport rules).
- `Return to Dashboard` button preserved per project memory.

## Technical Notes

- AI calls go only through edge functions + Lovable AI Gateway (no client-side Anthropic SDK), per project memory.
- Edge functions use `Deno.serve` and `npm:` specifiers, no `deno.land/std/http`.
- All address autocompletes follow the prop→state sync pattern.
- Lazy-loaded routes wrapped in `<Suspense>`.
- Roof measurement math (pitch multipliers, waste tables) is preserved by reusing `src/lib/roofMeasurements.ts` inside the satellite measurement branch.

## Out of Scope (will flag at end)

- Real `licensed_entity_name` / `licensed_entity_number` values — seeded as TBD; user must supply before launch (especially for Electrical / Plumbing / Emergency).
- Real Google Solar API key wiring if not already present (will check `GOOGLE_MAPS_API_KEY` and prompt only if missing for Solar-specific endpoint).
