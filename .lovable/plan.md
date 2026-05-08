## Goal
Replace the homepage at `/` with the new homeowner-facing landing page from the uploaded `index.html`, using the gold GCN logo and brand styling.

## Routing changes
- `/` → new homepage (`src/pages/Index.tsx` rewritten as the new design).
- `/join` → currently `JoinNetwork.tsx`. Per your answer:
  - Move existing `JoinNetwork` to a new route `/join-network` (component file unchanged).
  - The current `LandingPage.tsx` (the page with the dashboard mockup + "I'm a Homeowner / I'm a Contractor" toggle) takes over `/join` so the new homepage's "Join the Network" button lands there.
- `App.tsx` updated: `/` uses the new `Index` page; `/join` renders `LandingPage`; `/join-network` renders `JoinNetwork`.

## Asset
- Copy `user-uploads://gcn-logo.png` → `public/gcn-logo.png`.
- Used in nav (~64px tall) and footer (~56px), no text label.

## New homepage build (`src/pages/Index.tsx` + section components in `src/components/home/`)
Faithful React + Tailwind conversion of the uploaded HTML, broken into:
- `HomeNav.tsx` — sticky nav with logo, links, mobile `Sheet` hamburger.
- `HomeHero.tsx` — headline with gold-shimmer span, two 3D CTAs (`Join the Network` → `/join`, `For Contractors` → `/contractors`), and the tilted 3D perks card (AI Estimating, Job Marketplace, Permit Expediting, Virtual Contractor, Vetted Directory, green pulsing dot, "Create Your Free Account" button).
- `HomeStats.tsx` — animated count-up stats (1,000+ Contractors / 50K+ Projects / $10M+ Supplemented + second strip 15+ Years / $50M+ Volume / 100% Guarantee / 24-hr Storm Response).
- `HomeServiceTiles.tsx` — 8 homeowner service tiles with color-coded icons, idle bob, hover lift+tilt+colored glow.
- `HomeFreeTools.tsx` — 6 "Free with every homeowner account" tools with "Included Free" pill.
- `HomeHireTiers.tsx` — 4 tiers with gold "Most Popular" badge on Virtual Contractor.
- `HomeMission.tsx` — mission headline + 6-card values grid with gold left bar.
- `HomeProcess.tsx` — 4-step process with gold numerals.
- `HomeStormCTA.tsx` — dark green gradient strip with 5-step claim list.
- `HomeContractorSection.tsx` — dark "For Contractors" with 9 tools tiles, gold radial glow.
- `HomeReviews.tsx` — 6 sample 5-star reviews + "illustrative" disclaimer banner.
- `HomeReferences.tsx` — 4 sample references + same disclaimer.
- `HomeFAQ.tsx` — 11 questions using shadcn `Accordion`.
- `HomeFinalCTA.tsx` — dark green band with shimmer headline + founder quote pull-quote.
- `HomeContactForm.tsx` — plain shadcn `Input/Textarea/Button`, `console.log` on submit.
- `HomeFooter.tsx` — dark, 4 columns, copyright bar.

## Styling & tokens
- Add brand color tokens to `src/index.css` and `tailwind.config.ts` (HSL): `--green-900/800/700/600/500/100/50`, `--gold-700/600/500/400/300`, `--paper`, `--ink`, `--line`, plus `--shadow-gold`, `--gradient-gold-shimmer`.
- Add Google Fonts `Cinzel`, `Playfair Display`, `Inter` via `<link>` in `index.html`.
- Define utility classes for: 3D button (gradient + inset highlight + shadow), gold-shimmer text animation (keyframe `goldShimmer`), idle float keyframe `bob`, hero card tilt.
- Keep all colors as semantic tokens — no raw hex in components.

## Animations
- Framer Motion `whileInView` fade-up for major sections.
- Custom `useCountUp` hook for stats triggered by `IntersectionObserver`.
- CSS `@keyframes bob` (3.5s ease-in-out infinite, staggered `animation-delay`) on tile icons.
- Hover: `hover:-translate-y-2 hover:scale-110 hover:[transform:rotateX(8deg)_rotateY(-6deg)]` plus per-color drop-shadow utility.
- Gold shimmer: animated linear-gradient `background-clip: text` on hero/final-CTA spans.
- `html { scroll-behavior: smooth }` already present.

## Mobile (your viewport is 563px)
- Hero stacks (card under headline) below `lg`.
- Service/tools/contractor grids: 4→3→2→1 columns at `lg/md/sm`.
- Nav collapses to shadcn `Sheet` hamburger under `md`.

## SEO
- `<Helmet>` title "Global Contractor Network — Trusted Contractors. Real Accountability." and meta description from the uploaded HTML.
- Single H1 in hero.

## Files touched
- New: `public/gcn-logo.png`, `src/components/home/*` (≈14 files), `src/hooks/useCountUp.ts`.
- Edited: `src/pages/Index.tsx` (full rewrite), `src/App.tsx` (route swap), `src/index.css`, `tailwind.config.ts`, `index.html` (font link + title/description).
- Untouched: `LandingPage.tsx`, `JoinNetwork.tsx` (re-routed only).

## Out of scope
- Wiring contact form to Supabase (logs to console for now, per your prompt).
- Changing any other pages, dashboards, or the mobile preview's other routes.
