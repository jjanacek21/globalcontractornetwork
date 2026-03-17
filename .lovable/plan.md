

## Fix PropertyIQ Search → ATTOM Flow

### Problem
ATTOM saves addresses like `"2847 NE 2ND AVE"` in city `"BOCA RATON"`, but the search query is `"2847 Northeast 2nd Avenue, Boca Raton, Florida 33431, United States"`. The ILIKE match fails. After ATTOM succeeds and returns a `propertyId`, the page just invalidates the cache and re-runs the same failing search.

### Changes

**1. `src/pages/PropertyIQSearch.tsx` — Navigate on ATTOM success**
- Pass `navigate` into the ATTOM mutation's `onSuccess` callback
- When `attomLookup.mutate(query)` succeeds with a `propertyId`, call `navigate(/property-iq/property/${propertyId})`
- Use `attomLookup.mutate(query, { onSuccess: (data) => navigate(...) })` inline to avoid modifying the shared hook
- The existing loading spinner already shows during ATTOM lookup — keep it as-is

**2. `src/hooks/usePropertyIQ.ts` — Smarter search parsing**
- In `usePropertyIQSearch`, before building the query:
  - Strip `, United States` from the search string
  - Split by comma into segments (street, city, state/zip)
  - Normalize abbreviations in the street segment: Northwest→NW, Northeast→NE, Southwest→SW, Southeast→SE, Avenue→AVE, Street→ST, Drive→DR, Boulevard→BLVD, Road→RD, Lane→LN, Court→CT, Place→PL
  - Build the `.or()` filter using both the original first segment AND the normalized version against `address`, plus city segment against `city`
  - This ensures `"2847 Northeast 2nd Avenue"` matches `"2847 NE 2ND AVE"`

### Files
- `src/pages/PropertyIQSearch.tsx` — Add `onSuccess` navigation to ATTOM mutate call
- `src/hooks/usePropertyIQ.ts` — Rewrite search query normalization in `usePropertyIQSearch`

