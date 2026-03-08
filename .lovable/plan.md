

# Plan: Build Functional Contact Detail Page and Fix CRM Data Layer

## Problem Summary
The current CRM is UI-only scaffolding. The PITCH reference screenshots show a fully functional contact detail page with tabs, actions, and working CRUD. Additionally, contacts cannot be created due to an RLS policy violation (403 on INSERT).

## What Will Be Built

### 1. Fix Contacts RLS Policy (Database Migration)
The POST to `contacts` returns 403. Need to add an INSERT policy for authenticated users so contacts can actually be created.

### 2. Contact Detail Page (`/member/crm/contacts/:id`)
New page matching the PITCH screenshots exactly:

**Header Section:**
- Large avatar with initials, contact name, company name, contact number badge, status dropdown (Qualified/New/etc.)
- Contact info row: phone, email, address
- Action buttons: Call, Skip Trace, Rep assignment dropdown, Edit, + Create Lead (navy)

**Pipeline Lead Summary Card:**
- Shows lead type with "project" badge, estimated value, contact/lead ID badges, win probability bar, "View Details" button

**5-Tab Interface:**
- **Details tab**: Homeowner Portal Access toggle with Active badge, Copy Link / Send Email buttons, Portal URL display. Below: 5 stat cards (Lead Score, Created, Source, Status, Total Jobs). Contact Information section with Edit button showing company, address, phones, email.
- **Pipeline tab**: 3 stat cards (Leads, Active Jobs, Closed). Pipeline items list showing lead cards and job cards with View buttons.
- **Notes tab**: "Add a contact note..." input, chronological note list.
- **Communication tab**: Call Now / Send Email / Send SMS buttons. 4 stat cards (Total, Calls, Emails, SMS). Communication Timeline with entries.
- **Documents tab**: Documents & Files section with upload placeholder.

### 3. Enhanced Create Contact Dialog
Replace the simple 4-field form with the full PITCH form:
- First Name*, Last Name*, Email (required if no phone), Phone (required if no email)
- Secondary Phone, Additional Phone Numbers (+ Add Phone)
- Company Name, Contact Type dropdown (Homeowner default)
- Lead Source* dropdown, Qualification Status dropdown
- Assign to Sales Rep dropdown
- Contact Address section with autocomplete, City, State, ZIP
- Tags input with Add button
- Notes textarea
- Create Contact button (navy) + Cancel button

### 4. Create Lead Dialog (from Contact Detail)
Dialog triggered by "+ Create Lead" button on contact detail:
- Lead Name (pre-filled), Phone Number (pre-filled)
- Roof Age (years), "Use same info as contact" checkbox
- Pipeline Status (Lead/Qualified/etc.), Roof Type dropdown, Priority dropdown
- Estimated Value input
- Address with geocoding verification (showing verified address options)
- Assign Sales Representatives (up to 2) with tag chips
- Notes textarea
- Cancel + Complete Required Fields button

### 5. Route Wiring
Add route: `/member/crm/contacts/:contactId` in App.tsx pointing to new `CRMContactDetail.tsx`.

## Technical Details

### Database Migration
```sql
-- Allow authenticated users to insert contacts
CREATE POLICY "Users can insert contacts"
ON public.contacts FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update their contacts  
CREATE POLICY "Users can update contacts"
ON public.contacts FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);
```

### New Files
- `src/pages/crm/CRMContactDetail.tsx` - Full contact detail page (~500 lines)
- `src/components/crm/CreateContactDialog.tsx` - Enhanced create contact form
- `src/components/crm/CreateLeadFromContactDialog.tsx` - Create lead dialog

### Modified Files
- `src/App.tsx` - Add contactId route
- `src/pages/crm/CRMContacts.tsx` - Wire View buttons to navigate to detail, use new CreateContactDialog

### Data Flow
- Uses existing `useContact(id)` hook from `useContacts.tsx` which already fetches contact + properties + leads
- Board/table view "View" links navigate to `/member/crm/contacts/:id`
- Contact detail fetches related leads, jobs, and properties via existing hooks

