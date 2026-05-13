## Goal

Add a "GCN Support" entry point in two places on the homepage (`src/pages/Home.tsx`), both linking out to https://gcn.support.

## 1. Nav button before "For Homeowners"

In the desktop nav (`<nav class="navlinks">`, line ~443) and the mobile sheet nav (line ~460), add a new link as the first item:

- Label: `GCN Support`
- Href: `https://gcn.support`
- Opens in a new tab (`target="_blank"`, `rel="noopener noreferrer"`)
- Styled to match the existing nav anchor styling (no extra classes needed beyond what `.navlinks a` already provides). On mobile, calls `setOpen(false)` like the other links.

## 2. New homepage section: "Working with a GCN Building Consultant?"

Insert a new `<section>` between the existing `#hire-options` section (ends ~line 657) and the `#about` section (starts ~line 660). Keeps it high enough to be visible but after the main service/hire CTAs.

Content:
- Eyebrow: `Already a Client?`
- Heading: `Working with a GCN Building Consultant?`
- One short paragraph: explains that if they are already engaged with a GCN Building Consultant directly, they can visit the help desk for project updates, document uploads, scheduling, and direct support — instead of going through the public intake flow.
- Single CTA button: `GCN Support` → https://gcn.support, opens in new tab, styled with existing `btn btn-green btn-lg` classes for visual consistency with the hero CTA.

Layout uses the existing `.container` + `.section-head reveal` pattern so it inherits the scoped CSS, padding, border-top divider, and scroll-reveal animation already in place. No new CSS needed.

## Out of scope

- No changes to `LandingHeader.tsx` / `HomeownerServices.tsx` (not mounted on `/`).
- No routing, auth, or backend changes.
- No new assets, design tokens, or dependencies.

## Verification

Reload `/`, confirm:
1. "GCN Support" appears as the first link in both desktop and mobile nav and opens gcn.support in a new tab.
2. The new section renders between the hire-options and about sections with the CTA button working.
