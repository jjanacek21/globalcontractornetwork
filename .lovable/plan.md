

# Plan: Wire Lead Detail View + Fix Lead Update RLS

## Problems

1. **"View Details" button (line 182) and "View" button (line 346)** in `CRMContactDetail.tsx` have no `onClick` handler — they do nothing when clicked.

2. **Lead status updates fail with 406** — the `leads` table has no UPDATE RLS policy matching the current user. The PATCH request returns 0 rows, causing the `.single()` call to throw a 406.

3. **Lead data from `useContact` is raw** — it fetches `leads` with `select("*")`, but `LeadDetailSheet` expects `LeadWithDetails` shape (with `contact`, `property`, `assigned_rep` joins). Need to either fetch enriched data or use `useLead` hook.

## Changes

### 1. Database Migration — Add leads UPDATE policy
```sql
DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

### 2. CRMContactDetail.tsx
- Import `LeadDetailSheet` and `useLead` hook
- Add state: `selectedLeadId` (string | null)
- Use `useLead(selectedLeadId)` to fetch enriched lead data
- Wire both "View Details" and "View" buttons: `onClick={() => setSelectedLeadId(lead.id)}`
- Render `LeadDetailSheet` at the bottom, with `onStatusChange` calling `updateLeadStatus` from `useLeads` hook
- Import `useLeads` for `updateLeadStatus`

### Files Modified
- `src/pages/crm/CRMContactDetail.tsx` — wire lead detail sheet
- Database migration for leads UPDATE policy

