
# AI Training Analytics Enhancement Plan

## Overview
This plan adds three major features to the AI Permit Expediting Training system:
1. **Product Approvals Admin View** - View/edit NOAs and FL approvals extracted from training
2. **Learning Metrics Dashboard** - Track products learned, field mappings discovered, and rules extracted over time
3. **Test the Enhanced Analyzer** - Verify the extraction system is working

---

## Feature 1: Product Approvals Admin View (Extracted from Training)

### What It Does
A new tab in the AI Training Center showing all product approvals that were extracted from uploaded training packets. Admins can:
- View all NOAs, FL approvals, and UL listings found during analysis
- Filter by source (training-extracted vs manually added)
- Verify or edit extracted data
- Mark products as verified or delete incorrect entries

### Technical Implementation

**New Component:** `src/components/admin/ExtractedProductsTab.tsx`

This component will:
- Query `product_approvals` table filtering by `source_status = 'training_extracted'`
- Display in a searchable, filterable table
- Show which training packet the product was extracted from (using metadata)
- Allow inline editing of manufacturer, product name, NOA number, etc.
- Provide "Verify" button to mark as admin-verified
- Show extraction confidence if available

**UI Layout:**
```
+--------------------------------------------------+
| Extracted Product Approvals                      |
| [Search...] [Category ▼] [Status ▼] [Refresh]   |
+--------------------------------------------------+
| Stats Cards: Total | Verified | Pending Review   |
+--------------------------------------------------+
| Product          | NOA #      | Source     | Act |
| GAF Timberline   | NOA 21-... | Wellington | ✓ ✎ |
| Owens Corning... | NOA 19-... | Boca Raton | ✓ ✎ |
+--------------------------------------------------+
```

**Database Query:**
```sql
SELECT pa.*, ppt.source_file_name, ppt.county, ppt.city
FROM product_approvals pa
LEFT JOIN permit_packet_training ppt 
  ON pa.metadata->>'source_training_id' = ppt.id::text
WHERE pa.source_status = 'training_extracted'
ORDER BY pa.created_at DESC
```

---

## Feature 2: Learning Metrics Dashboard

### What It Does
A dedicated section in the Analytics tab showing:
- Products extracted over time (line chart)
- Field mappings discovered (count + trend)
- Jurisdiction rules learned (count by county)
- Extraction success metrics

### Technical Implementation

**Update:** `src/components/admin/PermitTrainingAnalytics.tsx`

Add new data fetching and visualization:

**New Stats Cards:**
| Products Extracted | Field Mappings | Rules Discovered |
|-------------------|----------------|------------------|
| From `permit_packet_training.products_extracted` sum |

**New Charts:**
1. **Learning Over Time** (Line Chart)
   - X-axis: Date
   - Y-axis: Cumulative products/mappings/rules extracted
   
2. **Extraction by County** (Horizontal Bar)
   - Which jurisdictions are we learning from most
   
3. **Knowledge Base Health** (Stats)
   - Total product approvals in DB
   - Total field mappings learned
   - Total jurisdiction rules

**Data Sources:**
```sql
-- Aggregated learning metrics
SELECT 
  DATE(created_at) as date,
  SUM(products_extracted) as products,
  SUM(mappings_learned) as mappings,
  SUM(rules_discovered) as rules
FROM permit_packet_training
WHERE processing_status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30
```

---

## Feature 3: Update AI Training Center Tabs

### Current Structure:
- Analytics
- Ground Truth  
- Report Upload

### New Structure:
- Analytics (with Learning Metrics section)
- Ground Truth
- Report Upload
- **Extracted Products** (NEW)

**File:** `src/components/admin/AITrainingCenter.tsx`

Add new tab:
```tsx
<TabsTrigger value="extracted-products">
  <FileCheck className="h-4 w-4" />
  Extracted Products
</TabsTrigger>

<TabsContent value="extracted-products">
  <ExtractedProductsTab />
</TabsContent>
```

---

## Implementation Files

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/ExtractedProductsTab.tsx` | CREATE | New component for viewing/editing extracted products |
| `src/components/admin/AITrainingCenter.tsx` | UPDATE | Add new tab for Extracted Products |
| `src/components/admin/PermitTrainingAnalytics.tsx` | UPDATE | Add Learning Metrics section with charts |
| `src/components/admin/LearningMetricsSection.tsx` | CREATE | Reusable component for learning metrics display |

---

## Technical Details

### ExtractedProductsTab Component Structure

```typescript
interface ExtractedProduct {
  id: string;
  manufacturer: string;
  product_name: string;
  product_category: string;
  noa_number: string | null;
  fl_product_approval: string | null;
  hvhz_approved: boolean;
  created_at: string;
  source_training_id?: string;
  source_file_name?: string;
  source_county?: string;
}

// Features:
// - Table with sorting and filtering
// - Inline edit mode for corrections
// - Verify button (updates is_active, source_status)
// - Delete button for incorrect extractions
// - Link to source training packet
```

### LearningMetricsSection Component

```typescript
interface LearningMetrics {
  totalProductsExtracted: number;
  totalMappingsLearned: number;
  totalRulesDiscovered: number;
  extractionTrend: { date: string; products: number; mappings: number; rules: number }[];
  topJurisdictions: { county: string; extractions: number }[];
}

// Displays:
// - Summary stat cards with icons
// - Line chart for extraction over time
// - Bar chart for top learning jurisdictions
```

---

## Testing the Analyzer

After implementation, the test workflow will be:
1. Upload a new training packet via the Report Upload tab
2. Watch the processing status change from "queued" → "processing" → "completed"
3. Navigate to "Extracted Products" tab to see newly extracted NOAs
4. Check "Learning Metrics" to see counters increment
5. Verify data in `product_approvals`, `permit_field_mappings`, and `building_department_rules` tables

---

## Summary

This enhancement transforms the AI Training Center into a comprehensive knowledge extraction dashboard where admins can:
- See what the AI is learning from each uploaded packet
- Review and verify extracted product approvals
- Track learning progress over time with visual metrics
- Manage the growing knowledge base of Florida permit requirements
