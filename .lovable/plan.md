

# Plan: Fix Edit Contact and Create Lead Functionality

## Problems Identified

1. **Edit button is dead** — the Edit button in the contact detail header doesn't open any dialog. It's just a static button with no onClick handler.

2. **No address editing** — the EditContactDialog has no address/property fields. In PITCH, the contact's address is shown in the header and editable. Address data lives in the `properties` table (linked by `contact_id`).

3. **Create Lead blocks on missing property** — the CreateLeadDialog requires selecting an existing property. If the contact has no properties, you can't create a lead at all. PITCH's Create Lead dialog lets you enter an address inline, creating the property on the fly.

## What Will Be Built

### 1. Wire Edit Button to EditContactDialog
- Import `EditContactDialog` in `CRMContactDetail.tsx`
- Add state `showEditContact` and connect it to the Edit button's onClick
- Pass `contact` and `refetch` callback to the dialog

### 2. Add Address Fields to EditContactDialog
- Add address fields: `address_line1`, `city`, `state`, `zip`
- On load, pre-populate from the contact's first property (if any)
- On save: update the contact fields AND upsert the property record (create if none exists, update if one does)
- Uses existing `useProperties` hook for property CRUD

### 3. Rebuild CreateLeadDialog to Work Without Pre-existing Property
- Remove the hard requirement for pre-existing `property_id`
- Add inline address entry fields (address, city, state, zip)
- Add "Use same info as contact" checkbox that copies the contact's property address
- On submit: if no property selected, create a new property first, then create the lead with that property_id
- Add fields matching PITCH: estimated value, lead type, priority, notes
- Uses existing `useProperties` hook's `createProperty`

### 4. Show Address in Contact Detail Header
- Display the first property's address in the header info row (next to phone/email) like PITCH shows

## Files Modified
- `src/pages/crm/CRMContactDetail.tsx` — wire Edit button, show address in header
- `src/components/crm/EditContactDialog.tsx` — add address/property fields
- `src/components/crm/CreateLeadDialog.tsx` — allow inline property creation

## Database
No migration needed — `properties` table already has all required columns and RLS policies should allow authenticated inserts (same migration that fixed contacts).

