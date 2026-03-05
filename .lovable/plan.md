

# Expand OUR_FIELDS with Roofing-Specific Fields

## Problem
The `OUR_FIELDS` constant in `PermitQueensAdminTemplates.tsx` only has 17 generic fields. When admins map PDF form fields to data fields, they can't map roofing-specific fields like roof size, pitch, materials, deck attachment, NOA numbers, etc. This blocks permit packet generation for roofing permits.

## Solution
Expand `OUR_FIELDS` from 17 to ~65+ fields, grouped by category, covering all data the system collects. Fields are sourced from `PermitFormData` (permitFormFiller.ts), `RoofingFormData` (RoofingQuestions.tsx), `WindowDoorFormData`, and NOC-specific fields.

## New Field Categories

| Category | Fields |
|----------|--------|
| **Property** (existing + new) | property_address, property_unit, property_city, property_state, property_zip, folio_number, legal_description, flood_zone, wind_speed_zone |
| **Owner** (existing + new) | owner_name, owner_address, owner_city, owner_state, owner_zip, owner_phone, owner_fax, owner_email, tenant_name |
| **Contractor** (existing + new) | contractor_name, contractor_company, contractor_license, contractor_address, contractor_suite, contractor_city, contractor_state, contractor_zip, contractor_phone, contractor_fax, contractor_email, contractor_qualifier |
| **Project** (existing + new) | permit_type, scope_description, work_type, valuation, square_footage, commencement_date, expiration_date |
| **Roofing** (NEW) | roof_work_type, roof_size_sqft, roof_pitch, roof_stories, existing_roof_material, new_roof_material, underlayment_product, underlayment_noa, roof_covering_product, roof_covering_noa, fastener_product, fastener_noa, deck_type, deck_attachment_confirmed, year_built, building_type, has_exposed_ceilings, has_ponding_water, requires_overflow_scuppers, obstacles |
| **Windows & Doors** (NEW) | window_count, door_count, sliding_door_count, frame_material, u_factor, shgc, window_product, window_noa, door_product, door_noa |
| **NOC** (NEW) | improvement_description, lender_name, lender_address, bond_amount, surety_name |
| **Compliance** (NEW) | is_hvhz, hvhz_protocol, energy_code_compliant, engineer_required |
| **Auto** (existing + new) | date_today, application_number |

## Rendering Enhancement
Update the `<SelectContent>` in the mapping dialog to render fields grouped by category with `<SelectGroup>` + `<SelectLabel>` for easy scanning instead of a flat list.

## File Changed
`src/pages/PermitQueensAdminTemplates.tsx` — expand OUR_FIELDS constant and add grouped rendering in the Select dropdown.

