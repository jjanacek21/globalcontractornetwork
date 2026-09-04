# GCN Public Marketing Rebrand

## Scope
- Add the supplied GCN token stylesheet verbatim and import it before Tailwind.
- Re-map the shared shadcn light/dark color, typography, radius, gradient, and shadow tokens to the GCN palette; remove the retired gold/cream aliases from the shared Tailwind theme.
- Add a persisted light/dark control to the public homepage header, defaulting to light, with a pre-paint document theme script.
- Re-style the public homepage and its For Homeowners, For Contractors, About, How It Works, FAQ, testimonials, references, CTA, and footer surfaces with the blueprint ground, dimensional panels, green/teal accents, accessible text, and the existing gold logo unchanged.
- Add safe scroll-in staggering, button sheen, card lift, and pointer-driven hero-card tilt, all disabled or reduced when motion/touch preferences require it.

## Technical details
- Keep all existing copy, destinations, data, auth, and backend calls unchanged.
- The homepage’s scoped stylesheet will consume the new global `--gcn-*` tokens rather than maintain a competing embedded palette.
- Theme state will be applied as `data-theme` on `<html>` and stored under `gcn.theme`; the existing theme provider will use the same attribute and storage key.
- Validate build output and inspect desktop and mobile renders in both themes for contrast, overflow, and interaction states.
