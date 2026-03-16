

## Multi-Roof Support for Measurement Tool

### What we're building
An "Add Roof" button and roof grouping system so users can organize facets into separate roofs (e.g., Main House, Garage, Shed) on the same property. Each roof section is collapsible and shows its own subtotals.

### Data model change
Add a `roofId` field to `RoofFacet` and track roofs as a lightweight array:
```typescript
interface RoofSection {
  id: string;
  name: string; // "Roof 1", "Garage", etc.
}
```

### Changes

**1. `types.ts`** — Add `roofId` optional field to `RoofFacet`, add `RoofSection` interface.

**2. `RoofMeasurementTool.tsx`** — Add `roofs` state (`RoofSection[]`) initialized with one default roof. New facets get assigned to the active/selected roof. Add handlers for adding/renaming/deleting roofs. Pass roofs down to `FacetListPanel`.

**3. `FacetListPanel.tsx`** — Restructure to group facets by roof. Each roof section has:
- Editable name header + delete button
- Collapsible facet list underneath
- Per-roof subtotals (flat area, pitched area, squares)
- "Add Roof" button at the bottom
- Grand totals across all roofs remain at the footer

**4. `MeasurementReportPanel.tsx`** — Group per-facet breakdown table by roof name.

### UI sketch
```text
┌─ Roof Facets ──────────────────┐
│ [+ Add Roof]                   │
│                                │
│ ▼ Main House (3 facets)        │
│   ┌ Facet 1 ─────────────┐    │
│   │ pitch / waste / areas │    │
│   └───────────────────────┘    │
│   Subtotal: 12.5 sq           │
│                                │
│ ▼ Garage (1 facet)             │
│   ┌ Facet 1 ─────────────┐    │
│   └───────────────────────┘    │
│   Subtotal: 3.2 sq            │
│                                │
│ ── Edge Summary ──             │
│ ── Grand Totals: 15.7 sq ──   │
└────────────────────────────────┘
```

