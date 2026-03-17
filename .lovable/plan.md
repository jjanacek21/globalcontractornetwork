

## Add Apollo.io Owner Contact Enrichment to PropertyIQ

### What this does
When a PropertyIQ report loads and owners are missing contact info (email, phone, LinkedIn), the `enrich-property` edge function will call Apollo.io's People Enrichment API to fill in those fields automatically.

### How it works

**File: `supabase/functions/enrich-property/index.ts`**

Replace the placeholder at lines 202-206 with actual Apollo enrichment logic:

1. For each owner missing email/phone/LinkedIn:
   - Parse the owner name into first/last name
   - Call Apollo's `/v1/people/match` endpoint with the owner name + any available domain/company info
   - Extract: email, phone, LinkedIn URL, website from the response
   - Update `piq_owners` with the enriched data

2. Apollo API details:
   - Endpoint: `https://api.apollo.io/v1/people/match`
   - Auth: `x-api-key` header with `APOLLO_API_KEY`
   - Request body: `{ first_name, last_name, organization_name (if available) }`
   - Response fields: `person.email`, `person.phone_numbers[0].sanitized_number`, `person.linkedin_url`, `person.organization.website_url`

3. Rate limiting: Add a small delay between calls if multiple owners need enrichment to avoid hitting Apollo rate limits.

4. Only call Apollo for owners where `email IS NULL` — skip already-enriched owners.

### Changes

| File | Change |
|------|--------|
| `supabase/functions/enrich-property/index.ts` | Replace owner contacts placeholder (lines 202-206) with Apollo People Match API calls; update piq_owners with results |

### Technical notes
- The `APOLLO_API_KEY` secret is already configured in the project
- The `piq_owners` table already has columns for `phone`, `email`, `linkedin_url`, `facebook_url`, `website`
- Enrichment auto-triggers on report page load, so no UI changes needed
- Will log enrichment results (e.g., "Owner contacts: enriched 2/3 owners via Apollo")

