

## Add Dynamic API Keys to PropertyIQ Admin

### What we're building
Replace the hardcoded 4-API-key grid in the API Config tab with a dynamic system. An "Add API Key" button lets you add custom API integrations (name, description, key) that get persisted to the database. Existing keys can be edited or deleted.

### Database
Create a `piq_api_configs` table to store API keys per admin user:
- `id` (uuid PK)
- `user_id` (uuid, references auth.users, not null)
- `api_name` (text, not null) — e.g. "Skip Tracing", "Zillow"
- `api_description` (text)
- `api_key` (text, not null) — stored encrypted-at-rest by default
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamps)
- RLS: users can only CRUD their own rows

### Changes

**1. Database migration** — Create `piq_api_configs` table with RLS policies restricting to authenticated users managing their own rows.

**2. `PropertyIQAdmin.tsx`** — Replace the static `apiKeys` state and hardcoded card grid with:
- Fetch from `piq_api_configs` on load
- Render saved keys as cards (masked key display, edit/delete buttons, active toggle)
- "Add API Key" button opens a dialog/inline form with fields: Name, Description, API Key
- Save inserts to `piq_api_configs`; edit updates; delete removes
- Keep the 4 default suggestions as quick-add presets (Property Appraiser, Skip Tracing, Sunbiz, Zillow) that pre-fill the name/description

### UI sketch
```text
┌─ API Config ──────────────────────────────┐
│ [+ Add API Key]                           │
│                                           │
│ Quick Add: [Property Appraiser] [Skip     │
│  Tracing] [Sunbiz] [Zillow]              │
│                                           │
│ ┌─ Skip Tracing API ──────────────────┐   │
│ │ Owner contact lookup                │   │
│ │ Key: ••••••••••abc123               │   │
│ │ ● Active  [Edit] [Delete]           │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─ Custom Weather API ────────────────┐   │
│ │ Storm data for damage reports       │   │
│ │ Key: ••••••••••xyz789               │   │
│ │ ● Active  [Edit] [Delete]           │   │
│ └─────────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

