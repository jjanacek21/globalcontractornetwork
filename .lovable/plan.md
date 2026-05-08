## Remaining Work — Phase 2 of Trade Wizard Engine

Phase 1 (migration, seed data, schema) is already approved and applied. This plan covers the remaining build needed to make all 25 trades functional end-to-end.

### 1. Edge Functions (3)

All use `Deno.serve`, CORS headers, and route AI through Lovable AI Gateway with `google/gemini-3-flash-preview`. No client-side AI calls.

- **`analyze-property-satellite`** — Input: `{ address }`. Mapbox geocode → lat/lng → static satellite image URL. If trade is roofing, also call Google Solar API (if key present) for roof footprint sqft + pitch. Returns `{ lat, lng, satellite_url, roof_sqft?, pitch?, footprint_sqft? }`.
- **`analyze-photos-ai`** — Input: `{ trade_slug, photo_urls[] }`. Loads `trade_ai_prompts` row where `prompt_type = 'condition_analysis'`. Sends multimodal request with the trade-specific system prompt + uploaded photo URLs as image content blocks. Uses tool-calling with the row's `output_schema` for structured JSON. Returns `{ condition, severity, observations[], recommended_actions[], confidence }`.
- **`calculate-estimate`** — Input: `{ trade_slug, measurements, answers, selected_tier_id?, selected_upgrades[] }`. Loads `trade_pricing_options` for the trade. Computes base cost from `base_price_per_unit × measured_quantity`, applies any `price_modifier_pct` from answers, returns `{ low, mid, high, breakdown[] }` with mid ± 15%.

### 2. Frontend Components

- **`<ServicesGrid />`** — replaces the hardcoded 4-card grid on `/instant-quote`. Queries `trades` where `active = true`, groups by `category` (Exterior, Interior, Specialty, Cleaning), renders icon + name + description cards. Click → `/instant-quote/:tradeSlug`.
- **`<TradeWizard tradeSlug />`** — single generic component. Steps:
  1. Address (Mapbox autocomplete, existing `AddressAutocomplete`)
  2. Measurement — branches on `trade.measurement_method`:
     - `satellite` → calls `analyze-property-satellite`, shows satellite image
     - `photo_ai` → photo upload to `quote-photos` bucket, calls `analyze-photos-ai`
     - `manual_input` → numeric input fields from `trade_questions` of type `number`
     - `none` → skip
  3. Dynamic question loop — renders `trade_questions` in `step_number` order, supports `select`, `multiselect`, `number`, `text`, `boolean`, `photo_upload`, with `conditional_logic` evaluation
  4. Optional condition photos (if not already collected) → `analyze-photos-ai`
  5. Results via `calculate-estimate`
- **`<QuoteResults />`** — pricing tier cards from `trade_pricing_options` (Standard / Premium / Luxury), upgrade toggles, low/mid/high range, AI condition summary, persistent legal disclaimer naming the licensed entity (`TBD - Licensed Subcontractor / TBD` until populated). CTA writes to `quote_requests` and navigates to confirmation.
- **`<AdminTradesPanel />`** at `/admin/trades` — super-admin gated (uses `is_super_admin()`). CRUD for `trades`, `trade_questions`, `trade_pricing_options`, `trade_ai_prompts`. Tabbed UI: Trades list → drill into questions/pricing/prompts editors.

### 3. Wiring & Cleanup

- `/instant-quote` route swapped to render `<ServicesGrid />`.
- New route `/instant-quote/:tradeSlug` → `<TradeWizard />`.
- Old hardcoded wizards (`RoofingWizardSteps`, `WindowsWizardSteps`, `TreeWizardSteps`, `RemediationWizardSteps`, etc.) deleted. Their behavior is preserved by mapping to `satellite` (roofing) or `photo_ai` (everything else) measurement modes plus seeded questions.
- `/admin/trades` route added behind super-admin guard.
- Breadcrumb / "Return to Dashboard" pattern preserved per project navigation rule.

### 4. Out of Scope

- Real `licensed_entity_name` / `licensed_entity_number` values — left as `TBD` until you provide them.
- Google Solar API key wiring (only used if already present; falls back to Mapbox satellite + manual confirmation otherwise).
- Payment / booking flow after quote — quote results CTA only saves the request and notifies admin.

### Technical Notes

- All AI calls go through edge functions → Lovable AI Gateway. No `@anthropic-ai/sdk` on client (per project memory).
- `quote-photos` bucket is private; UI uses 1-hour signed URLs to display thumbnails.
- `quote_requests` RLS: owner read/write only; super-admins read all.
- Edge functions use native `Deno.serve` only (no stdlib `http/server.ts`) per project memory.
