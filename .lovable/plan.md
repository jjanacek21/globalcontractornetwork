

## Clean Up PropertyIQ — Restore Demo-Ready Seed Data

### Current State
- **3 seed properties** with full data (owners, scores, components, permits, etc.) — but prop-001 has wrong scores
- **11 broken ATTOM-fetched properties** with null sqft, null year_built, null values, and default 50/50/50 scores — these clutter search results

### Plan

**Step 1: Delete broken ATTOM-fetched properties**

Remove the 11 non-seed properties and all their related records (scores, ownership, components, permits, sales, storms, opportunities, violations). These are the records with IDs not matching the `a0000001-*` seed pattern.

Tables to clean (in dependency order):
- `piq_property_scores`
- `piq_property_ownership` 
- `piq_building_components`
- `piq_permits`
- `piq_property_sales`
- `piq_storm_events`
- `piq_contractor_opportunities`
- `piq_code_violations`
- `piq_saved_properties`
- `piq_properties` (last)

**Step 2: Fix prop-001 scores**

Update `piq_property_scores` for property `a0000001-0000-0000-0000-000000000001`:
- `roof_replacement_score`: 42 → **92**
- `renovation_score`: 38 → **65**  
- `investment_score`: 31 → **78**
- `overall_contractor_score`: 40 → **78**

**Step 3: Add 2 more seed properties for variety**

Insert 2 additional demo properties with realistic South Florida data, complete with scores, owners, building components, permits, and storm history — giving users 5 total properties to browse and demonstrating the full range of the app (high/low scores, different property types, multiple owners).

### Result
- Search page shows 5 properties with real data, scores, and owners
- Property reports display fully populated sections
- No empty/broken cards with "Sqft: 0" or "Value: $0.0M"

### Files Modified
- No code changes — data-only operations via database insert tool

