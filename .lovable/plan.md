

# Permit Expediting AI Workflow - Gap Analysis & Enhancement Plan

## Executive Summary

After thoroughly analyzing your codebase against the comprehensive vision you provided, I found that **~75% of your requirements are implemented**, with some critical gaps in specific areas. This plan identifies what's working, what's partially implemented, and what needs to be added to achieve the full "AI Permit Expediter Brain" you described.

---

## Current System Status

### What's Working Well

| Feature | Status | Location |
|---------|--------|----------|
| PDF Packet Analysis with OCR/Vision | Implemented | `permit-packet-analyzer` |
| Product Approval Extraction (NOAs, FL#, UL) | Implemented | 775 products in DB |
| Jurisdiction Rules Engine | Implemented | 20 rules, 17 departments |
| AI Expediter Chatbot | Implemented | `permit-expediter-brain` + `AIPermitChat.tsx` |
| Confidence Scoring | Implemented | Real-time % calculation |
| Training from Approved Packets | Implemented | 3 samples (2 pending) |
| Auto-Fill PDF Templates | Implemented | `permit-smart-form-filler` |
| Document Sourcing | Implemented | `source-product-approvals` |
| Packet Assembler | Implemented | `permit-packet-assembler` |
| Field Mapping Extraction | Implemented | 48 mappings learned |
| Rejection Pattern Learning | Implemented | `permit_rejections` table |

### Database Statistics

```text
Product Approvals:     775 (4 from training)
Building Departments:   17
Jurisdiction Rules:     20
Field Mappings:         48
Training Samples:        3 (1 completed, 2 queued)
Permit Projects:         4
```

---

## Gap Analysis

### Critical Gaps (Missing from Your Vision)

#### 1. Nail/Screw Pattern Database - PARTIALLY MISSING
Your vision specifies extracting detailed fastener schedules (e.g., "6" o.c. field, 4" o.c. laps; zone-specific fastening").

**Current State:**
- The analyzer extracts `tradeSpecificData.nailPattern` but doesn't store it in a searchable database
- No lookup table for "Prior Parkland jobs with nail patterns"

**Gap:** No dedicated `fastener_patterns` table or integration with jurisdiction/material matching

#### 2. Inspection Schedule Tracking - PARTIALLY MISSING
Your vision requires: "Inspections: List with SEQ ID/Type (e.g., 8: Anchor Sheet, 9: Fire Barrier, 10: Final)"

**Current State:**
- `permit_projects` has `inspection_requested` and `inspection_requested_at` columns
- No structured inspection schedule table with SEQ types

**Gap:** Missing `permit_inspections` table with sequence IDs, types, inspector assignment, results

#### 3. Digital Signature/Notarization - NOT IMPLEMENTED
Your vision requires: "Support drawing signatures on device, integrate RON (compliant with FL §117.245)"

**Current State:**
- Documents are flagged `needs_signature` or `needs_notary` in packet structure
- No actual signature capture or RON integration

**Gap:** No signature pad component, no notarization workflow, no RON provider integration

#### 4. Property Appraiser Integration - NOT IMPLEMENTED
Your vision requires: "Legal description from folio lookup, county appraiser integration for values"

**Current State:**
- Users manually enter property details
- No BCPA/MDPA/PBCPA API integration

**Gap:** No automated folio lookup or property data enrichment

#### 5. DBPR License Verification - NOT IMPLEMENTED
Your vision requires: "DBPR license check integration"

**Current State:**
- License numbers stored but not validated
- No real-time verification against Florida DBPR database

**Gap:** No DBPR API integration for contractor license verification

#### 6. Roofing Notification / Section 1524 Forms - PARTIALLY MISSING
Your vision extracts: "Section 1524 items (Aesthetics-Workmanship Reserved, Renailing Wood Decks...)"

**Current State:**
- Referenced in packet structure as `section_1524`
- No dedicated extraction or auto-fill for these specific checkboxes

**Gap:** Need checkbox-aware form filling for notification forms

#### 7. Version Control for Resubmittals - NOT IMPLEMENTED
Your vision requires: "Version control for resubmittals"

**Current State:**
- Packets are generated once
- No versioning or revision history

**Gap:** No `packet_versions` table or revision tracking

---

## Detailed Implementation Plan

### Phase 1: Complete Core Data Extraction (1-2 days)

#### Task 1.1: Enhance Fastener Pattern Storage

Create database table and update analyzer:

```sql
CREATE TABLE fastener_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_approval_id UUID REFERENCES product_approvals(id),
  jurisdiction_county TEXT NOT NULL,
  is_hvhz BOOLEAN DEFAULT false,
  zone_type TEXT CHECK (zone_type IN ('field', 'perimeter', 'corner', 'hip_ridge')),
  nail_type TEXT, -- "ring shank", "coil", "cap nail"
  nail_length TEXT, -- "1.25 inch"
  spacing_inches NUMERIC(4,2),
  nails_per_unit INTEGER,
  source_document TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Update `permit-packet-analyzer` to save to this table when extracting trade-specific data.

#### Task 1.2: Add Inspection Schedule Table

```sql
CREATE TABLE permit_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_project_id UUID REFERENCES permit_projects(id) ON DELETE CASCADE,
  seq_id INTEGER NOT NULL,
  inspection_type TEXT NOT NULL, -- 'anchor_sheet', 'fire_barrier', 'roof_in_progress', 'final'
  category TEXT CHECK (category IN ('building', 'electrical', 'plumbing', 'mechanical')),
  scheduled_date DATE,
  completed_date DATE,
  inspector_name TEXT,
  result TEXT CHECK (result IN ('passed', 'failed', 'pending', 'scheduled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Update wizard to display inspection schedule extracted from permit applications.

---

### Phase 2: Smart Form Improvements (2-3 days)

#### Task 2.1: Checkbox-Aware Form Filling

Update `permit-smart-form-filler` to handle:
- Section 1524 roofing notifications (checkboxes for "Reserved", "Not Applicable")
- HVHZ affidavits (material type checkboxes)
- Owner notification forms (acknowledgment checkboxes)

Technical approach:
```typescript
// In permit-smart-form-filler
if (field instanceof PDFCheckBox) {
  const shouldCheck = determineCheckboxValue(
    fieldMapping.our_field, 
    formData,
    fieldMapping.conditional_logic
  );
  if (shouldCheck) field.check();
}
```

#### Task 2.2: Section 1524 Template

Create pre-mapped template for Florida Roofing Notification form with all checkbox conditions:
- Aesthetics/Workmanship Reserved
- Renailing Wood Decks
- Common Roofs Reserved
- Exposed Ceilings
- Ponding Water Reserved
- Overflow Scuppers

---

### Phase 3: External Integrations (3-5 days)

#### Task 3.1: Property Appraiser Lookup

Create `property-appraiser-lookup` edge function:
- Input: Address or Folio/PCN
- Output: Legal description, assessed value, zoning, HVHZ status, sales history

Target APIs:
- Palm Beach County: PBCGOV Parcel Viewer API
- Broward County: BCPA Property Search
- Miami-Dade: Property Appraiser API

```typescript
// supabase/functions/property-appraiser-lookup/index.ts
async function lookupProperty(county: string, folio: string) {
  if (county === 'Palm Beach') {
    return await fetchPalmBeachProperty(folio);
  } else if (county === 'Broward') {
    return await fetchBrowardProperty(folio);
  } else if (county === 'Miami-Dade') {
    return await fetchMiamiDadeProperty(folio);
  }
}
```

#### Task 3.2: DBPR License Verification

Create `dbpr-license-check` edge function:
- Input: License number (CCC/CBC/CGC format)
- Output: Valid/expired, qualifier name, business name, complaints

Use Florida DBPR public lookup API or web scraping with Firecrawl.

---

### Phase 4: Digital Signing & Notarization (3-4 days)

#### Task 4.1: Signature Capture Component

Create `SignatureCapture.tsx`:
- Canvas-based signature drawing
- Touch/stylus support for mobile
- Save as PNG/SVG
- Embed into PDF at signature fields

```tsx
// src/components/permit-queens/SignatureCapture.tsx
export function SignatureCapture({ onSign }: { onSign: (dataUrl: string) => void }) {
  // Canvas-based signature pad
  // Clear/Redo buttons
  // Save button that calls onSign with base64 image
}
```

#### Task 4.2: Remote Online Notarization (RON) Workflow

For FL §117.245 compliance:
- Create `NotarizationRequest` component
- Integrate with RON provider (Notarize.com, DocVerify, or similar)
- Track notarization status in `permit_project_documents`

Add columns:
```sql
ALTER TABLE permit_project_documents 
ADD COLUMN notarization_status TEXT CHECK (notarization_status IN ('required', 'scheduled', 'completed', 'waived')),
ADD COLUMN notarized_at TIMESTAMPTZ,
ADD COLUMN notary_name TEXT,
ADD COLUMN notarization_session_url TEXT;
```

---

### Phase 5: Version Control & Resubmittals (1-2 days)

#### Task 5.1: Packet Versioning

```sql
CREATE TABLE permit_packet_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_project_id UUID REFERENCES permit_projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  packet_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID,
  change_notes TEXT,
  submission_date DATE,
  result TEXT CHECK (result IN ('pending', 'approved', 'rejected', 'revision_requested'))
);
```

Update `permit-packet-assembler` to create version records.

#### Task 5.2: Resubmittal Workflow

Create `ResubmittalPanel.tsx`:
- Show previous versions with rejection reasons
- Highlight documents that need updating
- Generate new version with "Revision #X" watermark

---

### Phase 6: Enhanced Learning Loop (2-3 days)

#### Task 6.1: Approval/Rejection Feedback

After each permit decision, prompt admin:
- Was this packet approved?
- If rejected, what was missing?

Store in `permit_rejections` and feed back into:
- `permit_ai_knowledge` (patterns)
- `building_department_rules` (gotchas)
- Confidence scoring adjustments

#### Task 6.2: Accuracy Tracking Dashboard

Enhance `LearningMetricsSection`:
- Show approval rate by jurisdiction
- Display "known reviewer preferences" learned from feedback
- Confidence trend over time (should increase as more packets are processed)

---

## Technical Architecture Summary

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        PERMIT EXPEDITER BRAIN                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  INGESTION LAYER                                                     │
│  ├─ permit-packet-analyzer (OCR/Vision)                              │
│  ├─ permit-document-processor (field extraction)                     │
│  └─ permit-intake-ai (scope parsing)                                │
│                                                                      │
│  INTELLIGENCE LAYER                                                  │
│  ├─ permit-expediter-brain (chat + gap analysis)                    │
│  ├─ Jurisdiction Rules Engine (building_department_rules)           │
│  ├─ Product Approval DB (775+ products with NOAs)                   │
│  └─ AI Knowledge Base (permit_ai_knowledge)                         │
│                                                                      │
│  OUTPUT LAYER                                                        │
│  ├─ permit-smart-form-filler (auto-fill PDFs)                       │
│  ├─ permit-packet-assembler (organize + merge)                      │
│  └─ source-product-approvals (fetch NOA PDFs)                       │
│                                                                      │
│  LEARNING LOOP                                                       │
│  ├─ Training Packet Upload → AI Analysis → DB Storage               │
│  ├─ Rejection Tracking → Rule Extraction                            │
│  └─ Confidence Improvement Over Time                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Recommended Priority Order

| Priority | Feature | Business Impact | Effort |
|----------|---------|-----------------|--------|
| 1 | Fix Re-analyze file content (DONE) | Enables training data quality | Completed |
| 2 | Inspection schedule table | Complete permit tracking | 1 day |
| 3 | Fastener pattern database | Technical accuracy | 1 day |
| 4 | Checkbox-aware form filling | Section 1524 compliance | 2 days |
| 5 | Property appraiser lookup | Auto-fill legal descriptions | 3 days |
| 6 | DBPR license verification | Reduce rejections | 2 days |
| 7 | Digital signature capture | Remove manual step | 2 days |
| 8 | RON integration | End-to-end digital flow | 3 days |
| 9 | Packet versioning | Handle resubmittals | 2 days |

---

## What's Already Strong

Your system already excels at:
- **Learning from real packets** - The training uploader + analyzer pipeline is solid
- **Jurisdiction awareness** - 17 building departments, HVHZ detection, rules engine
- **Interactive guidance** - The AI chat with confidence scoring and gap analysis
- **Product approval sourcing** - 775 products with Firecrawl + AI integration
- **Smart form filling** - pdf-lib integration with field mappings

The foundation matches your vision of "turning institutional permitting knowledge into a compounding intelligence system." The gaps are primarily in external integrations (DBPR, property appraisers) and final-mile features (signatures, notarization, versioning).

