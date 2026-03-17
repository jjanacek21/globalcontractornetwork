

## Fix ATTOM Data Extraction — Case Mismatch

### Root Cause
The ATTOM API returns **all-lowercase** field names, but the edge function reads **camelCase** properties. Every data extraction returns `null`.

**Evidence from logs:**
- API returns: `yearbuilt`, `livingsize`, `bldgsize`, `lotsize1`, `lotsize2`, `assdttlvalue`, `mktttlvalue`, `constructiontype`, `roofcover`
- Code reads: `yearBuilt`, `livingSize`, `bldgSize`, `lotSize1`, `lotSize2`, `assdTtlValue`, `mktTtlValue`, `constructionType`, `roofCover`

### Fix: `supabase/functions/attom-property-lookup/index.ts`

Update all field accessors to use lowercase property names matching the actual API response:

| Current (broken) | Fix to |
|---|---|
| `summary.yearBuilt` | `summary.yearbuilt` |
| `summary.propType` / `summary.propSubType` | `summary.proptype` / `summary.propsubtype` |
| `buildingSize.livingSize` / `buildingSize.bldgSize` / `buildingSize.grossSize` | `buildingSize.livingsize` / `buildingSize.bldgsize` / `buildingSize.grosssize` |
| `lot.lotSize1` / `lot.lotSize2` | `lot.lotsize1` / `lot.lotsize2` |
| `buildingRooms.stories` | `buildingRooms.stories` (keep) + add `building.summary?.levels` fallback |
| `assessment.assessed.assdTtlValue` | `assessment.assessed.assdttlvalue` |
| `assessment.market.mktTtlValue` | `assessment.market.mktttlvalue` |
| `buildingConstruction.constructionType` | `buildingConstruction.constructiontype` |
| `buildingConstruction.roofCover` / `roofType` | `buildingConstruction.roofcover` / `rooftype` |
| `lot.siteZoningIdent` / `lot.zoningType` | `lot.sitezoningident` / `lot.zoningtype` |
| `summary.floodZone` / `lot.floodZoneIdent` | `summary.floodzone` / `lot.floodzoneidnt` |
| `location.latitude` / `longitude` | Already works (lowercase in API) |
| `summary.livingSize` | `summary.livingsize` |
| `building.summary?.storyCount` | `building.summary?.levels` |
| `owner.owner1?.last` etc. | Need lowercase check too |
| `sale.amount.saleAmt` | `sale.amount.saleamt` |
| `sale.saleTransDate` | `sale.saletransdate` |

Additionally, add a **case-insensitive property accessor helper** or just fix all ~30 field references to lowercase.

### Also fix: `safeNum` function
The function rejects `0` as invalid (`val === 0` returns null). This is wrong — `lotsize1` of `0.4044995` is valid. Remove the `val === 0` check and only reject actual nulls/empty strings.

### Scope
- **1 file**: `supabase/functions/attom-property-lookup/index.ts`
- ~30 field name changes from camelCase to lowercase
- Remove `val === 0` from `safeNum`
- Deploy edge function

### Expected Result
After fix, searching a new address will correctly populate: building_sqft, lot_sqft, year_built, property_type, assessed_value, estimated_value, construction_type, stories, zoning, flood_zone — and scores will calculate from real data instead of defaults.

