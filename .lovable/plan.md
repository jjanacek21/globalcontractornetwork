

# Plan: Build Documents, Communication, Enhanced Lead Dialog, and Lead Detail Page

## Overview
Implement the four priority features from the Pitch CRM reference: document uploads, communication tracking, an enhanced Create Lead dialog, and a full-page lead detail view. This is a large scope, so the plan is structured in phases.

## Database Changes

### New Tables

**`contact_documents`** — File attachments for contacts and leads
- `id`, `contact_id`, `lead_id` (nullable), `file_name`, `file_path`, `file_type`, `file_size`, `uploaded_by`, `created_at`
- RLS: authenticated users can CRUD

**`contact_communications`** — Communication log (calls, emails, SMS)
- `id`, `contact_id`, `lead_id` (nullable), `type` (call/email/sms/system), `direction` (inbound/outbound), `subject`, `content`, `created_by`, `created_at`
- RLS: authenticated users can CRUD

### Storage
- Create `contact-documents` bucket (private) with RLS for authenticated uploads

### Leads Table Update
- Add columns: `roof_type`, `roof_age`, `priority` (text, default 'medium')

## File Changes

### 1. Enhanced Create Lead Dialog (`CreateLeadDialog.tsx`)
Inspired by the Pitch reference screenshots:
- Add fields: **Roof Type** (select: shingle, tile, metal, flat, other), **Roof Age** (number input), **Priority** (low/medium/high select)
- Pre-fill contact name and phone at top of form (read-only display)
- Show "Use same info as contact" checkbox (already exists, keep it)
- Add Notes textarea (already exists)

### 2. Communication Tab (`CRMContactDetail.tsx`)
- Create a `useContactCommunications` hook to fetch/create communications
- Wire "Call Now", "Send Email", "Send SMS" buttons to log communication entries
- Display communication timeline with type badges, direction, content, and timestamps
- Show stat cards with actual counts from the database

### 3. Documents Tab (`CRMContactDetail.tsx`)
- Create a `useContactDocuments` hook to fetch/upload/delete documents
- Wire the "Upload" button to a file input (accept: jpg, jpeg, png, pdf)
- Upload files to `contact-documents` bucket, save metadata to `contact_documents` table
- Display uploaded files as a list with file name, type icon, size, date, and delete button
- Support image preview for screenshots

### 4. Lead Detail — Full Page Route
- Create new page `src/pages/crm/CRMLeadDetail.tsx` at route `/member/crm/leads/:leadId`
- Replace the current `LeadDetailSheet` slide-out with navigation to this full page
- Page layout inspired by Pitch reference:
  - Header: contact name, status dropdown, address, phone, email, roof details
  - Internal Team Notes section (using `useNotes` hook with entity type "lead")
  - Communication sub-tabs (Comms, Photos, Activity, Timeline)
  - Activity timeline using existing `ActivityTimeline` component

### New Hooks
- `src/hooks/useContactDocuments.tsx` — CRUD for `contact_documents` + storage upload/delete
- `src/hooks/useContactCommunications.tsx` — CRUD for `contact_communications`

## Files Modified
- Database migration (2 new tables, storage bucket, leads column additions)
- `src/components/crm/CreateLeadDialog.tsx` — add roof type, roof age, priority fields
- `src/pages/crm/CRMContactDetail.tsx` — wire documents + communication tabs
- `src/hooks/useContactDocuments.tsx` — new hook
- `src/hooks/useContactCommunications.tsx` — new hook
- `src/pages/crm/CRMLeadDetail.tsx` — new full-page lead detail
- `src/App.tsx` — add route for lead detail page

## Technical Notes
- File uploads restricted to jpg, jpeg, png, pdf (max 10MB enforced client-side)
- Storage paths: `{userId}/{contactId}/{timestamp}_{filename}`
- All new tables have RLS policies for authenticated users
- The leads table additions (`roof_type`, `roof_age`, `priority`) are nullable to avoid breaking existing data

