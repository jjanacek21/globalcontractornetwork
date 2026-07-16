## Goal
Make **The GCN Store** reachable at its own public URL and indexable by Google, without requiring anyone to join the network.

## What's true today
- Store lives at `/equipment` (and `/store` alias) on `globalcontractor.network`.
- It's already public (no auth guard) — anyone with the link can browse and check out.
- Two blockers for real discoverability:
  1. No dedicated domain / clean URL branding.
  2. No store-specific SEO (title, description, canonical, OG tags, JSON-LD, sitemap entry) — it inherits the network's `index.html` head.

## Plan

### 1. Give it a clean URL
Two options — pick one (I'll ask below):
- **A. Subdomain on the network domain** — e.g. `store.globalcontractor.network` routed to the same app, with the root of that host rendering `/equipment`. Cheapest, no new domain.
- **B. Dedicated domain** — e.g. `gcnstore.com` / `thegcnstore.com`, purchased and connected in Project Settings → Domains, root of that host renders `/equipment`.

In code this is one small change: detect the store host (like the existing `isCoatingKingsDomain` helper in `src/lib/utils.ts`) and, when on that host, redirect `/` → the store view. Everything else in the app stays untouched.

Also add a short marketing slug `/store` (already exists) and keep `/equipment` as an alias so no existing links break.

### 2. SEO so Google can find it
Add per-route head tags via `react-helmet-async` on the store page only:
- `<title>` — "The GCN Store — Commercial Spray Rigs & Coating Equipment"
- Meta description — one-liner about Graco-class rigs, Honda GX, financing, US parts stock.
- Canonical + `og:url` pointing to the chosen public URL.
- `og:title`, `og:description`, `og:type=website`, `twitter:card=summary_large_image`.
- JSON-LD: `Store` + `Product` entries generated from the `equipment_products` rows so rigs show up as rich results.
- Add store URLs to `public/sitemap.xml` and confirm `public/robots.txt` allows `/equipment` and `/store`.

### 3. Verify + submit
- After deploy, verify the domain in Google Search Console (meta-tag method — the app already has the helper wired).
- Submit the sitemap.
- Run a Lovable SEO scan to catch anything I missed.

## Questions for you (please answer before I build)

1. **Which URL do you want?**
   - (a) `store.globalcontractor.network` subdomain (free, fastest), or
   - (b) A brand-new domain — if so, what should I use? (e.g. `thegcnstore.com`)
2. Want the store's `/` (whichever host you pick) to land directly on the storefront, and keep `/equipment` working as an alias? (Recommended: yes.)
3. Any preferred one-line pitch for the meta description, or should I write it in the same blunt contractor voice as the current hero copy?

Once you answer, I'll implement the host detection + redirect, add the Helmet SEO block and JSON-LD, update sitemap/robots, and give you the exact DNS records to point the domain at Lovable.