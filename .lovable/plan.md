## Goal
Replace the generic APR/term selector with **Service Finance + PACE/YGreen + Self-finance** options, update Good/Better/Best pricing and scope to your exact spec, and add a metal-roof option set plus an aluminum soffit/fascia wrap add-on.

## A. Financing — `src/lib/financing.ts` + `RoofPackagesStep.tsx`

Replace the current `DEFAULT_APRS` / `DEFAULT_TERMS_MONTHS` arrays with a typed catalog of real loan products:

```ts
export type FinanceProduct = {
  id: string;
  lender: "Service Finance" | "PACE / YGreen" | "Self Finance";
  label: string;          // e.g. "4.99% / 12 yr"
  apr: number;            // 0.0499
  termMonths: number;     // 144
  dealerFee: number;      // 0.08 (% added to job price)
};

export const FINANCE_PRODUCTS: FinanceProduct[] = [
  // Service Finance
  { id: "sf-499-12",  lender: "Service Finance", label: "4.99% / 12 yr", apr: 0.0499, termMonths: 144, dealerFee: 0.08 },
  { id: "sf-599-20",  lender: "Service Finance", label: "5.99% / 20 yr", apr: 0.0599, termMonths: 240, dealerFee: 0.08 },
  { id: "sf-699-15",  lender: "Service Finance", label: "6.99% / 15 yr", apr: 0.0699, termMonths: 180, dealerFee: 0.03 },
  // PACE / YGreen — 8.49% w/ 10% dealer fee, 10/15/20 yr terms
  { id: "pace-849-10", lender: "PACE / YGreen", label: "8.49% / 10 yr", apr: 0.0849, termMonths: 120, dealerFee: 0.10 },
  { id: "pace-849-15", lender: "PACE / YGreen", label: "8.49% / 15 yr", apr: 0.0849, termMonths: 180, dealerFee: 0.10 },
  { id: "pace-849-20", lender: "PACE / YGreen", label: "8.49% / 20 yr", apr: 0.0849, termMonths: 240, dealerFee: 0.10 },
  // Self-finance — no dealer fee
  { id: "self-cash",  lender: "Self Finance", label: "Cash / personal loan (no fee)", apr: 0, termMonths: 0, dealerFee: 0 },
];
```

Add a helper:
```ts
export function financedPrice(cashPrice: number, dealerFee: number) {
  return cashPrice / (1 - dealerFee);  // net-up so contractor receives cashPrice after lender fee
}
```

Then in `RoofPackagesStep.tsx`:
- Replace the two-row APR/Term picker with **one grouped lender picker** (3 sections: Service Finance, PACE/YGreen, Self Finance) showing each product as a button.
- For each package card, compute:
  - `cashPrice = mid of totalLow..totalHigh`
  - `financedPrice = financedPrice(cashPrice, selected.dealerFee)`
  - `monthly = monthlyPayment(financedPrice, selected.apr, selected.termMonths)`
- Display: **Cash price**, **Financed price (incl. X% fee)**, **Estimated monthly**. For Self Finance hide the "financed price" row and monthly.
- Keep disclaimer: "Estimate only — not a credit offer."

## B. Shingle Good/Better/Best — `roofing-package-pricing/index.ts`

Update `BASE_PRICE_PER_SQ` and the scope arrays:

```ts
good:   { low: 575,  high: 650,  name: "Essential Architectural Shingle",
          warranty: "10-yr workmanship, 25-yr material" }
better: { low: 725,  high: 900,  name: "Premium Shingle Plus",
          warranty: "20-yr workmanship, lifetime material" }
best:   { low: 1100, high: 1250, name: "Top-Tier Shingle System",
          warranty: "Lifetime workmanship & material" }
```

Scope bullets:
- **Good** (unchanged style): tear off (1 layer), synthetic underlayment, architectural shingles, new drip edge & pipe boots, permit & inspection.
- **Better**: full tear off, **full high-temp peel-and-stick underlayment**, impact-resistant architectural shingles, **solar attic fans**, **10 sheets of free wood**, **fix bad fascia**, ridge vent, permit + wind mit.
- **Best**: full tear off, **all plywood replaced**, **new fascia**, **High-temp Polyglass underlayment**, impact-resistant architectural shingles, **Attic Breeze solar attic fans**, **new gutters**, **lifetime warranty**, permit + wind mit + engineering letter.

The AI prompt baseline numbers must mirror the new ranges so AI can't drift. Adjusters (severity, stories) stay intact.

## C. New Metal-Roof package set

Add a second category returned by the same edge function: `metalPackages: Package[]` (or a `category` field on each package). Frontend renders a **Shingle vs Metal toggle** at the top of the packages step.

```ts
const METAL_BASE: Record<"good"|"better"|"best", { low:number; high:number; name:string; warranty:string; scope:string[] }> = {
  good:   { low: 800,  high: 1000, name: "5V Crimp / R-Panel Metal",
            warranty: "30-yr paint, 10-yr workmanship",
            scope: ["Tear off existing roof","High-temp synthetic underlayment",
                    "Exposed-fastener 5V or R-panel (Galvalume or painted)",
                    "New drip edge, ridge cap, closures","Permit & inspection"] },
  better: { low: 950,  high: 1200, name: "1\" Standing Seam Snaplock",
            warranty: "Lifetime paint, 20-yr workmanship",
            scope: ["Full tear off","High-temp peel-and-stick underlayment",
                    "1\" snaplock standing seam (24-ga)","Concealed fastener system",
                    "Custom flashing & valleys","Permit + wind mit"] },
  best:   { low: 1150, high: 1500, name: "1.5\" 24-ga Standing Seam OR Stone-Coated Steel",
            warranty: "Lifetime workmanship & material",
            scope: ["Full tear off (shingle baseline pricing)",
                    "High-temp Polyglass underlayment","1.5\" mechanical-lock standing seam OR stone-coated steel",
                    "All new flashing, ridge, hip & gable trim",
                    "Attic Breeze solar attic fans","New gutters",
                    "Permit, wind mit, engineering letter"] },
};
```

**Tile-to-metal surcharge**: when `condition.material` indicates tile, the **best** metal tier shifts to **$1200–$1700/sq** (additional tear-off labor). Edge function returns both numbers so frontend can show the right one based on detected/stored material.

## D. Add-on options

Add a small "Optional add-ons" section under the packages with toggleable line items that bump the cash price (and re-run financing math):
- **Full aluminum wrap of soffit & fascia** — flat-rate range based on linear feet (estimate $7–$12 per linear ft × computed eave length, or flat $1,800–$3,500 for typical home if no eave length available).
- (Future-ready slot for: gutter guards, skylight replacement, etc.)

## E. UI / wiring summary
- `RoofPackagesStep.tsx` gets:
  1. Shingle/Metal category toggle
  2. New financing picker grouped by lender
  3. Add-ons checklist that adjusts displayed totals
  4. Cash vs Financed price rows on each card
- `roofing-package-pricing/index.ts` returns `{ shingle: Package[], metal: Package[], addOns: AddOn[] }` and accepts existing material so it can pick shingle-vs-tile baseline for the best metal tier.

## Out of scope
- Persisting the chosen finance option to a lead/contact record (can be a follow-up).
- Real-time credit pre-qual (still just an estimate).
- Coating Kings / contractor CRM measurement tools.

## Files to touch
- `src/lib/financing.ts` — replace defaults with `FINANCE_PRODUCTS` + `financedPrice()` helper
- `src/components/instant-quote/roofing/RoofPackagesStep.tsx` — new finance UI, category toggle, add-ons, cash/financed rows
- `supabase/functions/roofing-package-pricing/index.ts` — new shingle base ranges + scope, new metal package set, tile surcharge, add-ons response

After this you'll see Service Finance / PACE / Self-finance buttons grouped by lender, each package card showing both the cash price and the financed price with the dealer fee baked in, the new shingle scope/pricing you specified, and a separate Metal tab with the 5V → 1″ snaplock → 1.5″/stone-coated steel ladder.