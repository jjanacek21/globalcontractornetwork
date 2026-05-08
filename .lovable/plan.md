# Animated, Visual Trade Wizards with AI Photo Quoting

Transform the generic measurement step in `TradeWizard.tsx` into rich, animated, **variant-picker** experiences for every trade — and let users either answer guided questions or upload photos that an AI analyzes to draft the quote.

## What changes for the user

1. **Combined Windows + Doors wizard** (restored). Single flow handles both at once, like before.
2. Every trade gets a **visual variant picker** instead of a plain number box:
   - Animated SVG/3D illustration of each option
   - Tap a card to select type → quantity stepper for each variant
   - Optional size buttons where it matters (e.g. 36"x80" door, 6'x4' window)
3. **"Skip the questions — use photos" toggle** on every wizard. Upload 1–6 pictures, AI analyzes condition/quantity/material and drafts the estimate plus a written scope summary.
4. Address step stays first. Satellite mapping stays roofing-only.

## Visual design

- New shared component `VariantPicker` (cards with `Card3D` tilt, hover glow, `framer-motion` scale-in, animated selection ring).
- New `QuantityStepper` with +/– buttons, large readout, bounce animation.
- New `SizeChips` row for size variants (small / standard / large or actual dims).
- All trade cards use the existing emerald/forest palette + gold accents.

## Per-trade variant catalog (examples — full list lives in `tradeVariants.ts`)

| Trade | Variants user picks (with icon/illustration) | Extra |
|---|---|---|
| Windows + Doors (combined) | Single Hung, Double Hung, Sliding, Casement, Picture, Impact-Rated · Entry Door, Sliding Glass, French, Garage, Storm | Size chips per item; impact y/n |
| Doors only | Entry, Sliding Glass, French, Bifold, Garage, Storm, Interior | Size chip |
| Siding | Vinyl, Hardie/Fiber Cement, Wood, Stucco-over | Wall sqft + stories |
| Stucco | New, Re-stucco, Patch/Crack repair, Decorative | Wall sqft + stories |
| Gutters | 5" K-style, 6" K-style, Half-round, Box, +Guards | LF + stories |
| Soffit & Fascia | Aluminum, Vinyl, Wood, Combo | LF + stories |
| Roofing | (untouched — keeps current roofing wizard) | — |
| Pavers | Driveway, Patio, Pool deck, Walkway · Brick, Travertine, Concrete | Sqft |
| Pressure Washing | Driveway, Roof soft-wash, House wash, Pool deck, Fence | Sqft |
| Exterior Paint | Body+trim, Body only, Trim only, Doors+shutters | Sqft + stories |
| EIFS Bands / Crown Molding | Profile size chips (4"/6"/8") | LF |
| Drywall / Texture | Patch, Full wall, Ceiling, Knockdown / Orange peel / Smooth | Sqft |
| Flooring | Tile, LVP, Hardwood, Carpet, Polished Concrete | Sqft |
| Interior Paint | Walls, Ceiling, Trim, Cabinets | Rooms |
| Cabinets | Refinish, Reface, New install, Custom | LF |
| Plumbing | Faucet, Toilet, Water heater, Repipe, Drain | Count per fixture |
| Electrical | Outlet, Switch, Fixture, Panel upgrade, EV charger | Count |
| Bathrooms | Powder, Full, Master, Wet-room | Count + finish tier |
| Kitchens | Refresh, Mid, Full gut | Count + finish tier |
| Interior Renovation | Living, Bedroom, Office, Whole-home | Rooms + sqft |
| Tree & Landscaping | Tree removal, Trimming, Sod, Mulch, Hedges | Count + lot sqft |
| Window Cleaning | Interior+Exterior, Exterior only, Screens | Count + stories |
| Emergency Services | Water mitigation, Mold, Tarp, Board-up, Fire | Affected sqft |

## AI Photo Quoting (new path)

A new "Quote from photos" toggle on the measurement step. When picked:

1. User uploads up to 6 photos (existing `iq-photos` bucket).
2. Frontend calls **new edge function `iq-photo-quote`** with `trade_slug` + photo URLs.
3. Edge function calls **Lovable AI Gateway** (`google/gemini-3-flash-preview` for vision) with a trade-specific system prompt to extract: detected materials, visible damage/condition, recommended scope items, estimated quantities, and a confidence score.
4. Result feeds straight into the existing `iq-calculate-estimate` flow (so we still produce Good/Better/Best tiers) plus shows an AI scope card on the results screen.

> Per project memory we use the **Lovable AI Gateway**, not direct Anthropic/OpenAI keys. No new secrets needed — `LOVABLE_API_KEY` is already provisioned. If you specifically want raw Anthropic/OpenAI keys instead, say the word and we'll wire them via `add_secret`.

## Technical scope

**New files**
- `src/components/instant-quote/shared/VariantPicker.tsx` — animated card grid (Card3D + framer-motion).
- `src/components/instant-quote/shared/QuantityStepper.tsx`
- `src/components/instant-quote/shared/SizeChips.tsx`
- `src/components/instant-quote/shared/PhotoQuotePanel.tsx` — upload + "analyze with AI" button.
- `src/components/instant-quote/tradeVariants.ts` — single source of truth for per-trade variants/sizes/icons.
- `supabase/functions/iq-photo-quote/index.ts` — vision call via Lovable AI Gateway, returns structured JSON via tool-calling.

**Edited files**
- `src/components/instant-quote/TradeWizard.tsx` — replace generic measurement card with `VariantPicker` + `QuantityStepper`; add "Quote from photos" toggle that swaps in `PhotoQuotePanel`. Combine windows+doors when slug is `windows` or `doors` (route both to the same combined view).
- `src/components/instant-quote/InstantQuoteWizard.tsx` (legacy 5-trade path) — keep current `WindowsWizardSteps` import as the combined entry; remove separate doors entry if any.
- `src/pages/InstantQuote.tsx` — when slug is `doors`, redirect/route to the combined windows+doors wizard.
- `supabase/functions/iq-calculate-estimate/index.ts` — accept new `selected_variants` array `[{type, qty, size?}]` and sum quantity by tier unit (already unit-aware from last change).

**Out of scope**
- Roofing wizard (keeps satellite + current flow).
- Lead-capture/Telegram piece (already done).
- DB schema changes (variants stored inside existing `answers` JSONB on `iq_quote_requests`).

## Open questions before building

1. For the AI photo path — confirm we use **Lovable AI Gateway** (free, already wired) vs. supplying your own Anthropic/OpenAI keys?
2. Should the "Quote from photos" path **skip the variant picker entirely**, or still ask 2-3 short follow-up questions after AI analysis to lock in the quote?
