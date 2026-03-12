

# PropertyIQ - UI Shell + Owner Intelligence + Admin Panel

## Overview

Build PropertyIQ as a standalone service (like Supplement Kings) with a landing page, search results with owner contact intelligence, a full property report page, and a PropertyIQ admin section inside the master admin AI Training Center.

## Routes (added to App.tsx)

- `/property-iq` - Landing page
- `/property-iq/search` - Search results
- `/property-iq/property/:id` - Full property report

No auth for now since this is UI shell with seed data.

## Files to Create

### Seed Data
- **`src/lib/propertyIQSeedData.ts`** - 3 demo properties with full owner intelligence:
  - Each property includes: address, type, sqft, year_built, roof info, scores, permits, sales history, storm events, building components
  - Each property has owner(s) with: name, owner_type (individual/company/trust), phone numbers (array), emails (array), social media links (linkedin, facebook, twitter), mailing address, company/trust details (registered agent, formation date, sunbiz URL)

### Pages
- **`src/pages/PropertyIQ.tsx`** - Landing page with hero, address search bar, feature cards (Property Reports, Owner Networks, Roof Intelligence, Storm History), pricing tiers (display only), CTA buttons
- **`src/pages/PropertyIQSearch.tsx`** - Search results page showing property cards with owner name/company prominently displayed, property type badge, roof score, address, value, sqft. Clicking navigates to report.
- **`src/pages/PropertyIQReport.tsx`** - Full "Carfax-style" report:
  - Header with address + badges
  - AI Score Panel: 3 circular gauges (Roof Replacement, Renovation, Investment)
  - Property Overview grid
  - **Owner Intelligence section**: owner name(s), owner type badge, mailing address, all phone numbers, all emails, social media links (LinkedIn, Facebook, Twitter), company/trust name, registered agent, formation date, Sunbiz link
  - Roof Intelligence with life progress bar
  - Building Components with life bars
  - Permit History timeline
  - Sales History
  - Storm Exposure
  - Contractor Opportunity Panel
  - Save + Export buttons (UI only)

### Components
- **`src/components/property-iq/PropertyIQHeader.tsx`** - Nav header
- **`src/components/property-iq/PropertyIQFooter.tsx`** - Footer
- **`src/components/property-iq/ScoreGauge.tsx`** - Circular score gauge (0-100) with color coding
- **`src/components/property-iq/PropertyCard.tsx`** - Search result card with owner info
- **`src/components/property-iq/OwnerIntelligenceCard.tsx`** - Detailed owner contact card with phones, emails, socials

### Admin Section
- **`src/components/admin/PropertyIQAdmin.tsx`** - New tab component for the master admin AI Training Center with:
  - **Site Query Tool**: Input field to enter URLs + button to crawl via Firecrawl (uses existing firecrawl edge functions), results displayed in table
  - **CSV/List Upload**: Drag-and-drop zone to upload a CSV of addresses or owner names for batch lookup
  - **API Configuration**: Cards for external APIs (property appraiser, skip tracing, Sunbiz) with fields to enter/update API keys
  - **Search History**: Table showing recent queries and results

## Files to Modify

- **`src/App.tsx`** - Add 3 new routes for PropertyIQ pages
- **`src/components/admin/AITrainingCenter.tsx`** - Add "PropertyIQ" tab with Building icon, rendering `PropertyIQAdmin`

## Design
- Matches existing GCN light theme using shadcn/ui
- Cards, Badges, Tables, Progress bars from existing component library
- Owner contact info uses icons: Phone, Mail, Linkedin, Globe, Building2, User

## No Database Changes
All data from seed file. Admin panel UI is shell only (Firecrawl integration reuses existing edge functions).

