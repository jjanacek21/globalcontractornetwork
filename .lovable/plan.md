## Issue

The packet UI shows "Missing" for **Signed Contract**, **Certificate of Insurance**, and **Contractor License** even though the user uploaded them. DB confirms uploads are stored as `document_type = 'contract'`, `'insurance'`, `'license'`, but the assembler's `user_upload` branch does an exact-match lookup against the packet structure types `'signed_contract'`, `'coi'`, `'contractor_license'`, so they never match.

## Fix

In `supabase/functions/permit-packet-assembler/index.ts`, in the `item.source === 'user_upload'` branch (~line 1071), replace the exact-equality lookup with an alias-aware match:

```ts
const TYPE_ALIASES: Record<string, string[]> = {
  signed_contract:    ['signed_contract', 'contract', 'signed contract'],
  coi:                ['coi', 'insurance', 'certificate_of_insurance', 'cert_of_insurance'],
  contractor_license: ['contractor_license', 'license', 'contractors_license'],
  owner_authorization:['owner_authorization', 'owner_auth', 'authorization_letter'],
  roof_layout:        ['roof_layout', 'roof_diagram', 'roof_plan'],
  site_photos:        ['site_photos', 'property_photos', 'photos'],
};
const aliases = TYPE_ALIASES[item.type] || [item.type];
const match = (t: any) => aliases.includes(String(t || '').toLowerCase());
const dbDoc     = dbDocuments?.find(d => match(d.document_type));
const passedDoc = uploadedDocuments.find(d => match(d.type));
```

The rest of the branch (push to `documentIndex`, `queueMerge(url)`) is unchanged. The same alias map also covers the conditional branch (~line 1212) — apply identical change there for consistency.

## Files touched
- `supabase/functions/permit-packet-assembler/index.ts`

Then redeploy the function and re-assemble the packet — the three uploaded files will be detected, marked Included, merged into the PDF, and packet completion will jump well past 31%.

## Out of scope
- No DB migration. Existing `contract` / `insurance` / `license` rows stay as-is; aliases reconcile both old and new values.
- No UI change — the checklist already renders correctly once the assembler reports them as `included`.
