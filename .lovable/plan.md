

# Permit Packet Assembly System — Comprehensive Build Plan

## What the Uploaded Packets Reveal

From analyzing the four real completed permit packets (Wellington, Boca Raton/PBC, Margate/Broward, Riviera Beach/PBC), every packet follows a consistent structure with jurisdiction-specific variations:

```text
UNIVERSAL PACKET STRUCTURE (from real packets):
┌─────────────────────────────────────────────────┐
│ 1. PERMIT CARD / ISSUED PERMIT (after approval) │
│ 2. PROPERTY APPRAISER SUMMARY (auto-source)     │
│ 3. PERMIT APPLICATION FORM (auto-fill)          │
│ 4. RTW MITIGATION LETTER (generated, notarized) │
│ 5. CONTRACTOR LICENSE (upload)                   │
│ 6. UNDERLAYMENT FL PRODUCT APPROVAL (auto-src)  │
│ 7. UNDERLAYMENT P.E. EVALUATION REPORT (auto)   │
│ 8. ROOFING PRODUCT NOA (auto-source)            │
│ 9. ROOF MEASUREMENT REPORT (upload)             │
│ 10. FORM 100/300 REROOFING SUMMARY (auto-fill)  │
│ 11. UNDERLAYMENT OPTIONS FORM (auto-fill)       │
│ 12. NOC (auto-fill, notarized)                  │
│ 13. SKYLIGHT NOA (conditional, auto-source)     │
│ 14. CITY-SPECIFIC SUPPLEMENTS (conditional)     │
└─────────────────────────────────────────────────┘
```

**Key observations:**
- PBC uses Form 100 (Shingle) or Form 300 (Metal) + Underlayment Options form
- Broward/Margate uses HVHZ NOAs (skylight NOA 24-0401.06 was included)
- Wellington required RTW mitigation letter with 15% cost threshold calculation
- All packets include property appraiser printouts (auto-sourceable via existing property lookup)
- Product approvals span multiple pages (GAF NOA = 6 pages, Polyglass PEER = 11 pages)
- Every NOA/product approval page has jurisdiction stamps ("Reviewed for compliance with...")

## What Already Exists (Strong Foundation)

The system already has significant infrastructure:
- `permit-packet-assembler` edge function with PDF merging, cover sheet generation, AI-driven content, product sourcing, and learned rejection patterns
- `permit-smart-form-filler` edge function with 85+ field mappings, Section 1524 checkbox logic, and conditional field evaluation
- `PacketContentsPreview` component showing expected documents per jurisdiction
- `PacketBuilder` and `PacketDownloader` components for generation/download
- `permit_form_templates` table with 22 templates across Broward, Miami-Dade, and Palm Beach
- `permit_packet_structures` table for jurisdiction-specific document ordering
- `product_approvals` table with NOA/FL approval sourcing pipeline
- `fastener_patterns` table for nail schedule auto-fill
- Property appraiser lookup via existing edge function
- 3-step wizard collecting all required data

## What Needs to Be Built

### Phase 1: Packet Structure Definitions (Database)

Insert `permit_packet_structures` records for each jurisdiction/trade combination based on the real packets. These define the exact document order and sources.

**Wellington (PBC - Roofing - Metal):**
1. Cover Sheet (generated)
2. Property Appraiser Summary (auto-source via property-appraiser-lookup)
3. Permit Application — PBC Universal Form (auto-fill)
4. RTW Mitigation Letter (generated with 15% cost calculation)
5. Contractor License (user upload)
6. Underlayment FL Product Approval (auto-source from product_approvals)
7. Underlayment P.E. Evaluation Report (auto-source)
8. Roofing Material NOA (auto-source)
9. Roof Measurement Report (user upload)
10. Form 300 Reroofing Summary Metal (auto-fill)
11. Underlayment Options Selection (auto-fill)

**Riviera Beach (PBC - Roofing - Shingle):**
Same as Wellington but Form 100 instead of Form 300, and shingle NOA instead of metal.

**Margate (Broward - Roofing - Shingle):**
1. Cover Sheet
2. City of Margate Permit Application (city-specific auto-fill)
3. Change of Plan Submittal (conditional)
4. Skylight NOA (conditional - if skylights present)
5. Roofing Material NOA (auto-source)
6. Underlayment NOA (auto-source)
7. City Application Summary (auto-fill)

**Boca Raton (PBC - Roofing - Metal):**
Same PBC structure as Wellington with standing seam metal product approvals.

### Phase 2: Enhanced Packet Assembler Page

Create a new dedicated **Permit Packet Assembly** page (`/permit-queens/packet-assembly/:projectId`) that replaces the current fragmented approach with a single, comprehensive workflow.

**UI Layout:**
- Left panel: Document checklist with real-time status (Ready/Pending/Missing/Needs Signature)
- Right panel: Preview of the current document or the full assembled packet
- Bottom bar: Action buttons (Generate Packet, Download, Submit)

**Component: `PermitPacketAssemblyPage.tsx`**
- Fetches the project data and determines jurisdiction
- Loads the correct `permit_packet_structures` entry
- Shows each required document with its source type and current status
- For auto-fill documents: "Preview" button that calls `permit-smart-form-filler`
- For auto-source documents: Shows sourced NOA/FL# with PDF preview
- For upload documents: Drag-drop upload zone
- Progress bar showing packet completion percentage
- "Assemble Packet" button that triggers the full assembler

**Component: `PacketDocumentRow.tsx`**
- Individual document row showing: order number, document name, source badge, status badge, action buttons
- Smart actions based on source type:
  - `auto_fill`: Preview filled form, Edit data, Re-generate
  - `auto_source`: View PDF, Search for alternative, Manual upload fallback
  - `user_upload`: Upload, Replace, View
  - `generated`: Preview, Regenerate
  - `conditional`: Toggle inclusion, shows condition reason

### Phase 3: Smart Form Auto-Fill Integration

Wire the existing `permit-smart-form-filler` into the assembly page so each auto-fill document can be previewed and edited before final assembly.

**For each form template in the packet:**
1. Query `permit_form_templates` matching county + trade type
2. Call `permit-smart-form-filler` with the project data
3. Return filled PDF as a blob for preview
4. Allow the user to override values before final generation

**PBC-specific forms that need auto-fill support:**
- Form 100 (shingle) — map roof pitch, area, underlayment method, product specs
- Form 300 (metal) — map wind uplift pressure, metal type, fastener specs
- Underlayment Options — map selected underlayment option (A/B/C)
- PBC Universal Permit Application — already has field mappings
- Mandated Retrofits RTW Form — map RTW connection details

### Phase 4: RTW Mitigation Letter Generator

Create an edge function `generate-rtw-letter` that produces the Roof-to-Wall mitigation letter seen in the Wellington packet.

**Logic:**
```
IF roof_value > 0 AND rtw_retrofit_cost > (roof_value * 0.15):
  Generate letter stating retrofit exceeds 15% threshold ($7,800 example)
  Include: property address, owner name, contractor name/license
  Requires: notarization
```

This is a simple PDF generated with pdf-lib, pre-filled with project data.

### Phase 5: Property Appraiser Integration

The packets all include a "Property Detail" printout from PBC Property Appraiser. The system already has a `property-appraiser-lookup` edge function.

**Enhancement:** After folio lookup, store the full property detail as a generated PDF page in the packet. This includes:
- Owner info, sales history, exemptions
- Structural details (year built, roof type, sq footage)
- Appraisals and tax values

### Phase 6: Product Approval Sourcing Enhancement

The existing auto-sourcing pipeline handles NOAs well. Enhancements needed:

1. **P.E. Evaluation Reports**: The Wellington packet includes an 11-page Polyglass PEER document (FL5259-R42). The system needs to source these alongside NOAs. Add a `pe_evaluation_url` column to `product_approvals` and source these from floridabuilding.org.

2. **UL Test Reports**: Add sourcing for UL impact test reports referenced in product approvals.

3. **Fastener Pattern Documentation**: Auto-generate fastener pattern pages from the `fastener_patterns` table data for the selected products.

### Phase 7: Packet Assembly Dashboard Enhancement

Update the existing `PermitExpeditingTab` admin view to show:
- Packet completion percentage per project
- Missing documents count
- One-click "Generate Complete Packet" for projects with all data

---

## Implementation Order

1. **Database: Insert packet structures** for PBC (Wellington/Boca Raton/Riviera Beach) and Broward (Margate) — SQL inserts into `permit_packet_structures`
2. **New page: `PermitPacketAssemblyPage`** with document checklist and status tracking
3. **Component: `PacketDocumentRow`** with source-aware actions
4. **Edge function: `generate-rtw-letter`** for RTW mitigation letters
5. **Wire auto-fill preview** into assembly page via existing `permit-smart-form-filler`
6. **Product sourcing enhancement** — PE evaluation reports and UL reports
7. **Dashboard integration** — link from project details to assembly page

## Files to Create/Modify

**New files:**
- `src/pages/PermitPacketAssembly.tsx` — main assembly page
- `src/components/permit-queens/PacketDocumentRow.tsx` — individual document row
- `src/components/permit-queens/PacketAssemblyChecklist.tsx` — document checklist panel
- `supabase/functions/generate-rtw-letter/index.ts` — RTW letter generator

**Modified files:**
- `src/App.tsx` — add route for `/permit-queens/packet-assembly/:projectId`
- `supabase/functions/permit-packet-assembler/index.ts` — enhance with PE evaluation sourcing
- `src/components/permit-queens/PacketContentsPreview.tsx` — connect to packet structures table

**Database changes:**
- Insert packet structure records into `permit_packet_structures` for PBC and Broward
- Add `pe_evaluation_url` and `ul_report_url` columns to `product_approvals` (migration)

