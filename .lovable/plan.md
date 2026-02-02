
# Add Engineering as a Service Type - Implementation Plan

## Summary

This plan adds "Engineering" as a fully integrated service category across the entire platform, including contractor signup, company registration, directory listings, quote systems, permit workflows, social feeds, and referral systems.

---

## Technical Overview

Engineering services will be added to **16 files** across the codebase, plus a database migration to add `engineering` to the `permit_type_enum` PostgreSQL enum.

**Icon Choice**: The `Ruler` icon from lucide-react will represent Engineering services throughout the platform.

**Color Scheme**: Engineering will use an indigo/violet color scheme (`bg-violet-500/10 text-violet-400 border-violet-500/30`) to differentiate it from other trades.

---

## Changes Required

### 1. Database Migration

Add `engineering` to the existing `permit_type_enum`:

```sql
ALTER TYPE permit_type_enum ADD VALUE 'engineering';
```

### 2. Contractor Directory (`src/pages/ContractorDirectory.tsx`)

| Line Range | Change |
|------------|--------|
| 8 | Add `Ruler` to imports |
| 27-40 | Add `engineering: Ruler` to `categoryIcons` |
| 42-55 | Add engineering color to `categoryColors` |
| 91-105 | Add `{ id: "engineering", name: "Engineering", icon: Ruler }` to `categories` |

### 3. Contractor Signup (`src/pages/JoinNetwork.tsx`)

| Line Range | Change |
|------------|--------|
| 698-711 | Add `<SelectItem value="Engineering">Engineering</SelectItem>` to Primary Service Category select |

### 4. Company Registration (`src/pages/CompanyRegistration.tsx`)

| Line Range | Change |
|------------|--------|
| 24-45 | Add `"Engineering"` to `SERVICE_CATEGORIES` array |

### 5. Get Quote Page (`src/pages/GetQuote.tsx`)

| Line Range | Change |
|------------|--------|
| 12-15 | Add `Ruler` to imports |
| 20 | Add `"engineering"` to `ServiceType` union |
| 30-36 | Add engineering service option to `services` array |
| 58-64 | Add `engineering: "property-estimator-ai"` to `functionMap` |
| 167-323 | Add `case "engineering":` with relevant questions |

### 6. Homepage Services (`src/pages/Index.tsx`)

| Line Range | Change |
|------------|--------|
| 45-55 | Add `{ icon: Ruler, title: "Engineering", description: "Structural & specialty engineering", link: "/get-quote" }` to `homeownerServices` |

### 7. Instant Quote Section (`src/components/marketing/InstantQuoteSection.tsx`)

| Line Range | Change |
|------------|--------|
| 39-46 | Add `{ icon: Ruler, label: "Engineering" }` to `quoteTypes` |

### 8. Social Feed (`src/pages/social/SocialFeed.tsx`)

| Line Range | Change |
|------------|--------|
| 11-14 | Add `"Engineering"` to `TRADE_OPTIONS` array |

### 9. Create Post Form (`src/components/social/CreatePostForm.tsx`)

| Line Range | Change |
|------------|--------|
| 10-14 | Add `"Engineering"` to `TRADE_OPTIONS` array |

### 10. Submit Referral Dialog (`src/components/referrals/SubmitReferralDialog.tsx`)

| Line Range | Change |
|------------|--------|
| 11-33 | Add `"Engineering"` to `SERVICE_TYPES` array |

### 11. Add Job Dialog (`src/components/contractor-dashboard/AddJobDialog.tsx`)

| Line Range | Change |
|------------|--------|
| 41-51 | Add `"Engineering"` to `serviceTypes` array |

### 12. Permit Queens Landing (`src/pages/PermitQueens.tsx`)

| Line Range | Change |
|------------|--------|
| 11 | Add `Ruler` to imports |
| 85-92 | Add `{ icon: Ruler, name: "Engineering", description: "Structural, MEP, specialty" }` to `industries` |

### 13. Permit Pros Landing (`src/pages/PermitPros.tsx`)

| Line Range | Change |
|------------|--------|
| 11 | Add `Ruler` to imports |
| 84-91 | Add `{ icon: Ruler, name: "Engineering", description: "Structural, MEP, specialty" }` to `industries` |

### 14. Building Dept Lookup (`src/components/permit-pros/BuildingDeptLookup.tsx`)

| Line Range | Change |
|------------|--------|
| 75-82 | Add `{ value: "engineering", label: "Engineering" }` to `trades` array |

### 15. Permit Request Wizard (`src/pages/PermitQueensNewRequest.tsx`)

| Line Range | Change |
|------------|--------|
| 11 | Add `Ruler` to imports |
| 50-59 | Add `{ id: 'engineering', label: 'Engineering', icon: Ruler, description: 'Structural calcs, sealed plans', priority: false }` to `PERMIT_TYPES` |

### 16. Trade Products Hook (`src/hooks/useTradeProducts.ts`)

| Line Range | Change |
|------------|--------|
| 23 | Add `'engineering'` to `TradeType` union |
| 32-57 | Add `engineering` entry to `TRADE_CATEGORIES` config |

---

## File Summary

| File | Action |
|------|--------|
| Database | Migration to add `engineering` to `permit_type_enum` |
| `src/pages/ContractorDirectory.tsx` | Add icon, color, and category |
| `src/pages/JoinNetwork.tsx` | Add service select option |
| `src/pages/CompanyRegistration.tsx` | Add to SERVICE_CATEGORIES |
| `src/pages/GetQuote.tsx` | Add service type with questions |
| `src/pages/Index.tsx` | Add to homeownerServices |
| `src/components/marketing/InstantQuoteSection.tsx` | Add to quoteTypes |
| `src/pages/social/SocialFeed.tsx` | Add to TRADE_OPTIONS |
| `src/components/social/CreatePostForm.tsx` | Add to TRADE_OPTIONS |
| `src/components/referrals/SubmitReferralDialog.tsx` | Add to SERVICE_TYPES |
| `src/components/contractor-dashboard/AddJobDialog.tsx` | Add to serviceTypes |
| `src/pages/PermitQueens.tsx` | Add to industries |
| `src/pages/PermitPros.tsx` | Add to industries |
| `src/components/permit-pros/BuildingDeptLookup.tsx` | Add to trades |
| `src/pages/PermitQueensNewRequest.tsx` | Add to PERMIT_TYPES |
| `src/hooks/useTradeProducts.ts` | Add to TradeType and TRADE_CATEGORIES |

---

## Engineering Service Configuration

**Display Name**: Engineering
**Icon**: Ruler (from lucide-react)
**Color Theme**: Violet (`bg-violet-500/10 text-violet-400 border-violet-500/30 hover:bg-violet-500/20`)
**Description Options**:
- "Structural & specialty engineering" (homepage)
- "Structural calcs, sealed plans" (permits)
- "Structural, MEP, specialty" (landing pages)

**Quote Questions** (for GetQuote.tsx):
- Engineering type: Structural, MEP (Mechanical/Electrical/Plumbing), Civil, Environmental, Specialty
- Project scope: New Construction, Renovation, Inspection/Review, Sealed Plans Only
- Property type: Residential, Commercial

---

## Verification Points

After implementation:
1. Engineering appears in Contractor Directory filters
2. Contractors can select Engineering during signup/registration
3. Engineering shows on homepage service grid
4. Users can request Engineering quotes
5. Engineering posts can be tagged in social feed
6. Engineering appears in permit type selection
7. Referrals can be submitted for Engineering services
