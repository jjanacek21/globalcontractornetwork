

## Move RoofScope AI from CRM to Standalone Dashboard Page

RoofScope is currently nested inside the CRM layout (`/member/crm/roofscope/*`). You want it as a standalone page accessible directly from the main Member Dashboard, similar to how PropertyIQ, Permit Queens, etc. work.

### Changes

**1. Add RoofScope service card to MemberDashboard.tsx**
- Add a new entry to the `services` array with a `Zap` icon, title "RoofScope AI Estimator", link to `/roofscope`, category "business"
- Add it to `contractorOnlyServices` since it's a contractor tool

**2. Update all routes in App.tsx**
- Change `/member/crm/roofscope` → `/roofscope`
- Change `/member/crm/roofscope/estimates` → `/roofscope/estimates`
- Change `/member/crm/roofscope/estimate/new` → `/roofscope/estimate/new`
- Change `/member/crm/roofscope/estimate/:id` → `/roofscope/estimate/:id`
- Change `/member/crm/roofscope/customers` → `/roofscope/customers`
- Change `/member/crm/roofscope/analyzer` → `/roofscope/analyzer`
- Remove `CRMLayout` wrapper — use a standalone layout with a "Return to Dashboard" header (matching the pattern used by PropertyIQ, Permit Queens, etc.)

**3. Create a lightweight RoofScope layout component**
- `src/components/roofscope/RoofScopeLayout.tsx` — header with RoofScope branding, "Return to Dashboard" button, and sidebar navigation for the sub-pages (Dashboard, Estimates, Customers, Analyzer)

**4. Update all internal navigation references**
- `RoofScopeDashboard.tsx` — update 6 `navigate()` calls from `/member/crm/roofscope/...` → `/roofscope/...`
- `RoofScopeEstimateWizard.tsx` — update 4 `navigate()` calls
- `RoofScopeEstimates.tsx` — update any navigation references
- `RoofScopeCustomers.tsx` — update any navigation references
- `RoofScopeAnalyzer.tsx` — update any navigation references

**5. Remove RoofScope from CRM sidebar**
- Remove the "RoofScope AI" entry from `CRMSidebar.tsx`

### Files Modified
| File | Change |
|------|--------|
| `src/pages/MemberDashboard.tsx` | Add RoofScope service card + Zap import |
| `src/App.tsx` | Move routes from `/member/crm/roofscope/*` to `/roofscope/*`, remove CRMLayout wrapper |
| `src/components/roofscope/RoofScopeLayout.tsx` | New standalone layout with header + sidebar nav |
| `src/pages/crm/RoofScopeDashboard.tsx` | Update all internal navigate paths |
| `src/pages/crm/RoofScopeEstimateWizard.tsx` | Update all internal navigate paths |
| `src/pages/crm/RoofScopeEstimates.tsx` | Update navigate paths |
| `src/pages/crm/RoofScopeCustomers.tsx` | Update navigate paths |
| `src/pages/crm/RoofScopeAnalyzer.tsx` | Update navigate paths |
| `src/components/crm/CRMSidebar.tsx` | Remove RoofScope AI entry |

