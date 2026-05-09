## Goal

Replace the home-page **"Get My Free Quote"** button with **"Schedule Consultation"** that opens a lead intake form. Submitting the form saves the lead to the database and pings your Telegram bot in real time.

## What gets built

### 1. Home page button swap
`src/pages/Home.tsx` (line 484) — change copy to "Schedule Consultation" and link to `/schedule-consultation`.

### 2. New page: `/schedule-consultation`
Single-page intake form, emerald/green theme matching the site, with these sections:

- **Owner info** — full name, phone, email, best time to call (chips: Morning / Afternoon / Evening / Anytime)
- **Property info** — address (existing `AddressAutocomplete` component), property type (Residential / Commercial), is this your primary residence (Yes/No)
- **Project details** — services needed (multi-select chips: Roofing, Windows & Doors, Paint, Siding, Gutters, Stucco, Bathroom, Kitchen, Emergency, Other), short project description (textarea)
- **Timeline** — when do you want to start (chips: ASAP / Within 30 days / 1–3 months / Just exploring)
- **Payment method** — three radio cards: **Cash**, **Financing**, **Insurance Claim**
  - If Insurance → optional carrier + claim # fields
  - If Financing → "interested in financing options" toggle
- **Consent checkbox** + Submit

Validation via `react-hook-form` + `zod` (already in project). Trim, length caps, email regex, phone normalization.

### 3. Database — new `consultation_leads` table
Columns: full_name, phone, email, best_time_to_call, property_address, property_lat/lng, property_type, is_primary_residence, services (text[]), project_description, timeline, payment_method, insurance_carrier, insurance_claim_number, financing_interest, status (default `'new'`), source (default `'Schedule Consultation'`), user_id (nullable), created_at.

**RLS:**
- Anyone (including anon) can `INSERT` — public lead form.
- Only `super_admins` can `SELECT` / `UPDATE` / `DELETE` — admin-only review.

### 4. Telegram notification
On successful insert, the page calls `supabase.functions.invoke("telegram-lead-alert", { body: {...} })`. The existing edge function already formats and sends to your Telegram chat using `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (both already configured). Payload mapping:

- `source: "Schedule Consultation"`
- `name`, `phone`, `email`, `address`, `service` (joined services list), `urgency` (timeline)
- `notes`: project description + payment method + insurance/financing details

Insert happens **before** the Telegram call — if Telegram fails, the lead is still saved and the user still gets the success screen (soft toast only).

### 5. Success state
After submit, swap the form for a confirmation card: "Thanks! A consultant will reach out within 1 business day." with a button back to home.

### 6. Routing
Add `/schedule-consultation` to `src/App.tsx`, lazy-loaded inside `<Suspense>` per project rules.

## Out of scope
- Date/time appointment slot picker (just a "when to start" chip — say the word and I'll add a calendar picker later).
- Admin UI table to browse leads (the data lands in `consultation_leads` ready to wire up).
- No changes to the other "Get Quote" service-card buttons.

## Files touched
- `src/pages/Home.tsx` — button copy + route
- `src/pages/ScheduleConsultation.tsx` — **new**
- `src/App.tsx` — new route
- New migration: `consultation_leads` table + RLS policies
