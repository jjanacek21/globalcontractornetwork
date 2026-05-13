## Changes to `src/pages/MemberDashboard.tsx` — `contractorApps` grid

### 1. Remove the GCN Business Suite tile
Delete the existing entry:
```
{ icon: Rocket, title: "GCN Business Suite", description: "...", comingSoon: true }
```

### 2. PropertyIQ → "Coming Soon" with a demo path
Currently PropertyIQ links straight to `/property-iq`. Change it to:
- Show the "Coming Soon" badge (visually gated like other coming-soon tiles).
- Expose a secondary "Try the Demo" action on the tile that routes to the existing PropertyIQ demo data (`/ni/dashboard` — the demo properties seeded under the `a0000001-…` UUID pattern documented in project memory are already loaded there).

Implementation note: `ServiceTile` today hides its CTA when `comingSoon` is true. I'll extend the `ServiceCard` type with an optional `demoLink?: string`, and when present render a small "Try the Demo →" link inside the card body even while the main tile stays in the Coming Soon state. No other tiles are affected.

### 3. Add the new GCN App tile
Append to `contractorApps`:
```
{
  icon: Rocket,
  title: "GCN App",
  description: "Rep card, Measure, Estimate, Analyze, Pre-Cap, Proposals, Contract, Invoice",
  link: "https://globalcontractor.app",
  badge: "Premium",
}
```

Because this is an external URL, `ServiceTile`'s onClick (which uses `navigate`) needs to handle absolute URLs by doing `window.open(link, "_blank", "noopener,noreferrer")` instead. I'll add that branch in the tile click handler — purely presentational change, no other tiles affected.

### Out of scope (called out for follow-up)
The user mentioned "super admins can give access to the app if they pay for that tier in the network." That requires a real entitlement model (subscription tier table + admin grant UI + per-user gating on the GCN App tile). It is **not** included in this plan — this change only adds the tile and the external link. I'll flag it after implementation so you can scope the entitlement work as its own task.

### Files touched
- `src/pages/MemberDashboard.tsx` (only)

No DB, routing, or backend changes.
