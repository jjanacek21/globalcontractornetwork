

## Fix: Property Owner Data Not Populating from ATTOM + Apollo

### Root Cause — Two bugs

**Bug 1: ATTOM lookup skips owner creation for existing properties**
When searching for a property that already exists in the database (line 206), the function returns early at line 225 with `source: 'existing'` **without ever inserting owner data**. Owner creation only runs for brand-new properties (line 262+). Your Boca Raton property (`aa872861`) was found as "existing," so no owner was ever created.

**Bug 2: Apollo enrichment has nothing to enrich**
Since no `piq_owners` records exist for this property, the `enrich-property` function finds zero owners → the Apollo code is never reached. The enrichment logs confirm this — only "booted" messages, no Apollo calls.

Additionally, the `piq_companies` table uses a `company_name` column, but the Apollo code queries it with `.select("name")` (line 230) — this would always return null, preventing organization-based matching even if owners existed.

### Fix Plan

**File: `supabase/functions/attom-property-lookup/index.ts`**

In the "existing property" branch (lines 206-227), after updating missing fields:
1. Check if the property has any owners in `piq_property_ownership`
2. If no owners exist, run the same owner insertion logic (lines 262-285) for the existing property
3. This ensures owner data is backfilled for properties that were previously saved without it

**File: `supabase/functions/enrich-property/index.ts`**

Fix the Apollo company lookup (line 230): change `.select("name")` to `.select("company_name")` and update the check at line 234 to use `ownerCompanies[0]?.company_name`.

### Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/attom-property-lookup/index.ts` | Add owner creation to the "existing property" branch so owners are inserted even for already-saved properties |
| `supabase/functions/enrich-property/index.ts` | Fix company name column reference from `name` to `company_name` in Apollo enrichment |

### Expected Result
After these fixes:
1. Searching any property (new or existing) will create owner records from ATTOM data
2. Apollo enrichment will then find those owners and populate email, phone, LinkedIn, website
3. The Owner Intelligence card on the report page will show real contact data

