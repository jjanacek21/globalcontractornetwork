## Approved + 3 additions

---

## Addition 1 — Rule table reconciliation (the 14 seeded rules are NOT stranded)

`permit_form_requirements` and `permit_packet_structures` are **two different tables** that both exist:

| | `permit_form_requirements` (your 14 rules) | `permit_packet_structures` (10 rows) |
|---|---|---|
| Key | `building_dept_id + permit_type` | `county/city/trade_type/material_type/is_hvhz` |
| Output | `required_template_ids uuid[]` + `conditions jsonb` (e.g. `{year_built_before:1994, work_type:'full_reroof'}`) | `document_structure jsonb` (ordered list with `source: generated|auto_fill|user_upload|auto_source`) + `conditional_documents` |
| Granularity | Per-department, per-condition, per-priority | Per city/material, full doc list & order |

**Decision: use BOTH. They serve different purposes.**

- `permit_form_requirements` → answers **"which template IDs are required?"** (your dept + condition rules; includes the Palm Beach Expedited Reroof Form mapping)
- `permit_packet_structures` → answers **"in what order, with what source-strategy, plus the non-template items (NOC, cover sheet, NOAs, uploads)?"**

**Resolver merge order in the new edge function:**
1. Load `permit_form_requirements` rows for `(building_dept_id, permit_type)` ordered by `priority DESC`. Evaluate each row's `conditions` JSON against the project (year_built, work_type, valuation, hvhz, etc.). Union all matching `required_template_ids` → this is the **authoritative template list**, your 14 rules included.
2. Load the matching `permit_packet_structures` row (existing fallback hierarchy: city+material → city → county+material → county). Use it for ordering, the `source` strategy per item, and the non-template items (NOC, cover sheet, uploads, NOAs).
3. Merge: items that appear in both keep their structure metadata; templates only in `permit_form_requirements` are appended as `source: 'auto_fill'` with default ordering after structure items.
4. Append firecrawl-discovered templates and `selected_products` NOAs as before.

No data migration needed — both tables remain authoritative for their own concern. The 14 seeded rules become the **primary driver** of which forms are required.

---

## Addition 2 — Fix jurisdiction resolution upstream FIRST (blocking)

Before the resolver can work, fix the address-pick handler in Step 1 of `PermitQueensNewRequest.tsx`:

```text
on address selected from autocomplete:
  console.log('[jurisdiction] address picked:', addr)
  parse zip from addr.postal_code (fall back to last token of address)
  console.log('[jurisdiction] zip:', zip)
  query: supabase
    .from('permit_building_departments')
    .select('id, jurisdiction_name, county, is_hvhz')
    .contains('zip_codes', [zip])
    .limit(1).maybeSingle()
  console.log('[jurisdiction] dept lookup result:', dept)
  if (dept):
    setFormData(... building_dept_id, jurisdiction_county=dept.county, is_hvhz=dept.is_hvhz)
    if tempPermitId:
      AWAIT supabase.from('permit_projects').update({
        building_dept_id: dept.id,
        jurisdiction_county: dept.county,
        is_hvhz: dept.is_hvhz,
        zip_code: zip,
      }).eq('id', tempPermitId)
      console.log('[jurisdiction] persisted to permit_projects', tempPermitId)
  else:
    console.warn('[jurisdiction] no dept matched zip', zip)
    show toast: "Couldn't auto-detect jurisdiction — please select manually"
```

The "Next" button on Step 1 must `await` this write before transitioning to Step 2. Add a `jurisdictionResolving` state flag — disable Next while pending. Replace the "Detecting…" UI in the Request Summary card with the resolved jurisdiction name once written.

---

## Addition 3 — Restore previous-permit autofill banner

On Step 1 address change (debounced 400ms), query:

```text
supabase.from('permit_projects')
  .select('id, owner_name, owner_email, owner_phone, valuation, permit_type, created_at')
  .eq('property_address_normalized', normalize(addr))   // existing normalized column
  .neq('id', tempPermitId)
  .order('created_at', { ascending: false })
  .limit(1).maybeSingle()
```

If a row is returned, render an amber banner above the form:

```text
[ ! ] Previous permit found at this address
      Owner: {owner_name} • Last valuation: ${valuation} • {timeAgo(created_at)}
      [ Use This Data ]   [ Dismiss ]
```

`Use This Data` copies owner/valuation/permit_type into the current form and updates the draft permit row. Dismissed banners stay dismissed for the session.

---

## Updated execution order (with verification checkpoints)

1. **Migration** — add `permit_packets.source_hash text` + index. *Verify:* `SELECT column_name FROM information_schema.columns WHERE table_name='permit_packets' AND column_name='source_hash'` returns 1 row.
2. **Fix jurisdiction handler in Step 1** (Addition 2) + restore previous-permit banner (Addition 3). *Verify:* console logs show dept lookup → `permit_projects` row has `jurisdiction_county` + `building_dept_id` populated. Banner shows for repeat address.
3. **Edge function `resolve-required-forms`** with the merged-rules logic (Addition 1). *Verify:* POST with the Fleming permit id returns `items[]` containing the Palm Beach Expedited Reroof Form template.
4. **`useResolvedRequiredForms` hook + `permitAutoFill.ts` orchestrator.**
5. **Wire `PacketContentsPreview` (Step 3) AND `PermitPacketAssembly` page** to the hook; remove their old per-component queries. *Verify:* walk wizard end-to-end — both panels render identical state for the same project.

All other items from the original plan (response schema, hash caching, parallel fills with retry, signed-URL eye icon, NOA sourcing fallback, native `Deno.serve` + CORS preflight) stand unchanged.

Proceeding now with the migration.