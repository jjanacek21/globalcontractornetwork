
# Implementation Plan: Enhanced Permit Expediting System

## Overview

This plan addresses three key enhancements to the AI permit expediting system:

1. **Run batch product sourcing for Underlayment products** - Trigger automated PDF downloads
2. **Add year_built field functionality** - Enable Section 1524 pre-1994 deck renailing logic
3. **Create Smart Document Manager organized by Building Department** - Upload and convert blank documents

---

## Current System Status

| Component | Status | Notes |
|-----------|--------|-------|
| Batch sourcing edge function | Implemented | `batch-source-products` ready |
| Firecrawl API key | Configured | Connected via connector |
| Product approvals database | 782 products | Only 2 have PDFs (Underlayment category) |
| year_built field | In database | Not populated in any projects |
| Template Manager | Basic implementation | Not organized by building department |
| Building departments | 17 departments | All three counties covered |

---

## Phase 1: Trigger Batch Underlayment Sourcing

### 1.1 UI Enhancement for BatchProductSourcing

Enhance the existing component to show real-time progress and auto-select Underlayment:

```typescript
// Add to BatchProductSourcing.tsx
- Add "Start with Underlayment" quick action button
- Show sourcing status per product in real-time
- Add edge function log streaming for visibility
```

### 1.2 Product Category Alignment

Fix the category filter issue - database has "Underlayment" (55 products) and "underlayment" (17 products):

```sql
-- Normalize categories
UPDATE product_approvals 
SET product_category = 'Underlayment' 
WHERE product_category = 'underlayment';
```

### 1.3 Storage Bucket Verification

Ensure `product-approvals` bucket exists with public read access for downloaded PDFs.

---

## Phase 2: Year Built Field Integration

### 2.1 Property Appraiser Auto-Population

Enhance the `property-appraiser-lookup` edge function to extract and populate year_built:

```typescript
// In property-appraiser-lookup
// Currently returns: address, parcel_id, owner_name, legal_description
// Add: year_built extraction from property appraiser data
```

### 2.2 UI Integration

The `RoofingQuestions.tsx` already has the year_built field. Enhancement needed:

```typescript
// Add auto-populate from property appraiser lookup
// Show visual indicator when year_built < 1994
// Add tooltip explaining Section 1524 implications
```

### 2.3 Update Existing Projects

Provide admin tool to batch-update year_built from property appraiser data:

```typescript
// New component: PropertyDataEnrichment.tsx
// - Lists projects missing year_built
// - One-click property appraiser lookup
// - Updates project with found data
```

---

## Phase 3: Smart Document Manager by Building Department

### 3.1 New Component: SmartDocumentManager

Create a comprehensive document management interface organized by building department:

```text
+-------------------------------------------+
| Smart Document Manager                     |
+-------------------------------------------+
| [Building Department Selector]             |
|   > Broward County                        |
|   > City of Fort Lauderdale               |
|   > Miami-Dade County                     |
|   > City of Boca Raton                    |
|   > Palm Beach County                     |
|   ...                                     |
+-------------------------------------------+
| Selected: City of Boca Raton              |
+-------------------------------------------+
| ROOFING DOCUMENTS (6)                     |
| +---------------------------------------+ |
| | Permit Application    [AI-Fill] [View]| |
| | Notice of Commencement[AI-Fill] [View]| |
| | Section 1524 Form     [AI-Fill] [View]| |
| | Roofing Compliance    [Generate]      | |
| | Supplemental A-E      [AI-Fill] [View]| |
| | Roof-to-Wall Affidavit[Upload]        | |
| +---------------------------------------+ |
|                                           |
| [+ Upload Blank Document]                 |
+-------------------------------------------+
| WINDOWS/DOORS DOCUMENTS (4)               |
| +---------------------------------------+ |
| | Permit Application    [AI-Fill]       | |
| | NOC                   [AI-Fill]       | |
| | Energy Compliance     [Upload]        | |
| | Engineering Drawings  [Upload]        | |
| +---------------------------------------+ |
+-------------------------------------------+
```

### 3.2 Drag-and-Drop Upload with AI Analysis

When a blank document is uploaded:

1. Detect jurisdiction from document content (AI analysis)
2. Extract fillable field names (PDF form fields)
3. Map to internal data fields
4. Store in `permit-form-templates` bucket
5. Link to building department

### 3.3 Smart Document Conversion Flow

```text
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ Upload Blank    │────▶│ AI Field         │────▶│ Store as Smart │
│ PDF Form        │     │ Detection        │     │ Document       │
└─────────────────┘     └──────────────────┘     └────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │ Create Field     │
                        │ Mappings         │
                        └──────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │ Link to Dept +   │
                        │ Trade Type       │
                        └──────────────────┘
```

### 3.4 Database Updates

```sql
-- Add building_dept_id to permit_form_templates
ALTER TABLE permit_form_templates 
ADD COLUMN IF NOT EXISTS building_dept_id UUID REFERENCES permit_building_departments(id);

-- Add trade_type array for multi-trade forms
-- Already exists: trade_types TEXT[]

-- Add smart document status tracking
ALTER TABLE permit_form_templates
ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS field_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ;
```

### 3.5 Integration with AITrainingCenter

Add new "Smart Docs" tab to the AI Training Center:

```typescript
// AITrainingCenter.tsx tabs:
// Analytics | Ground Truth | Report Upload | Extracted Products | 
// PDF Sourcing | Templates | Smart Docs (NEW) | Rejections

<TabsTrigger value="smart-docs">
  <Sparkles className="h-4 w-4" />
  Smart Docs
</TabsTrigger>
```

---

## Implementation Files

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/permit-queens/admin/SmartDocumentManager.tsx` | Main smart document UI organized by building dept |
| `src/components/permit-queens/admin/DocumentUploadZone.tsx` | Drag-drop upload with AI analysis |
| `src/components/permit-queens/admin/PropertyDataEnrichment.tsx` | Batch update year_built from property appraiser |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/batch-source-products/index.ts` | Add progress streaming, fix category matching |
| `supabase/functions/property-appraiser-lookup/index.ts` | Extract and return year_built |
| `src/components/permit-queens/BatchProductSourcing.tsx` | Add quick-start Underlayment button |
| `src/components/permit-queens/RoofingQuestions.tsx` | Auto-populate year_built from lookup |
| `src/components/admin/AITrainingCenter.tsx` | Add Smart Docs tab |
| `src/components/permit-queens/admin/TemplateManager.tsx` | Add building dept grouping |

### Database Migration

```sql
-- 1. Normalize product categories
UPDATE product_approvals SET product_category = 'Underlayment' WHERE product_category = 'underlayment';

-- 2. Add building_dept_id to templates
ALTER TABLE permit_form_templates ADD COLUMN IF NOT EXISTS building_dept_id UUID REFERENCES permit_building_departments(id);
ALTER TABLE permit_form_templates ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending';
ALTER TABLE permit_form_templates ADD COLUMN IF NOT EXISTS field_count INTEGER DEFAULT 0;
ALTER TABLE permit_form_templates ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ;

-- 3. Create index for department lookups
CREATE INDEX IF NOT EXISTS idx_templates_dept ON permit_form_templates(building_dept_id);
```

---

## Technical Details

### Smart Document Manager Component Structure

```typescript
interface SmartDocumentManagerProps {}

// State management
const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
const [documents, setDocuments] = useState<GroupedDocuments>({});
const [uploading, setUploading] = useState(false);
const [analyzing, setAnalyzing] = useState<string | null>(null);

// Document grouping by trade type
interface GroupedDocuments {
  [tradeType: string]: SmartDocument[];
}

interface SmartDocument {
  id: string;
  form_name: string;
  form_type: string;
  file_path: string;
  is_fillable: boolean;
  field_count: number;
  analysis_status: 'pending' | 'analyzing' | 'complete' | 'error';
  building_dept_id: string;
  trade_types: string[];
}
```

### Upload and Analysis Flow

```typescript
const handleDocumentUpload = async (file: File, tradeType: string) => {
  // 1. Upload to storage
  const fileName = `${selectedDepartment}/${tradeType}/${file.name}`;
  await supabase.storage.from('permit-form-templates').upload(fileName, file);
  
  // 2. Create template record
  const { data: template } = await supabase.from('permit_form_templates').insert({
    building_dept_id: selectedDepartment,
    trade_types: [tradeType],
    file_path: fileName,
    analysis_status: 'analyzing'
  }).select().single();
  
  // 3. Trigger AI analysis
  await supabase.functions.invoke('permit-packet-analyzer', {
    body: {
      mode: 'detect_and_analyze',
      templateId: template.id,
      fileUrl: publicUrl
    }
  });
  
  // 4. Update with extracted field mappings
  // (handled by edge function callback)
};
```

---

## Priority Order

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Run Underlayment batch sourcing | Immediate | Critical - enables NOA population |
| 2 | Fix category normalization | 5 min | Required for sourcing to work |
| 3 | Create SmartDocumentManager | 2-3 hours | High - enables organized form management |
| 4 | Add year_built auto-population | 1 hour | Medium - improves Section 1524 compliance |
| 5 | Integrate with AITrainingCenter | 30 min | Medium - improves admin workflow |

---

## Post-Implementation Verification

After implementation, verify:

1. **Underlayment sourcing**: Check that PDFs are downloaded to `product-approvals` bucket
2. **year_built**: Confirm Section 1524 checkbox auto-checks when year < 1994
3. **Smart docs**: Upload a blank NOC, verify AI detects fields and creates mappings
4. **Department organization**: Confirm templates display grouped by building department
