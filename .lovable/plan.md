# Lead-to-Contractor Messaging Flow (Broadcast Claims)

Today the Available Referrals tab lets a contractor claim a broadcast and shows a "Claimed" pill, but there is no actual way to message the client. This plan wires the full path: **Claim → Consent gate → Message Client → live conversation → customer notification**.

## Goals

1. After a contractor claims a broadcast, give them a clear **Message Client** CTA that opens a real conversation thread.
2. Respect customer privacy: customer contact info (phone/email/full address) is **masked** until the customer consents to be contacted by that specific contractor.
3. Notify the customer (email + in-app if they have an account) the moment a claimed contractor sends their first message, with a one-click consent link.
4. Track engagement for the existing 3-claim cap rule (first 3 to actually message win the seat) and for residual/payout attribution.

## UX Flow

```
Available Referrals card
  └─ [Claim & Message] button
       ├─ creates referral_broadcast_claims row (existing trigger enforces cap of 3)
       ├─ opens MessageClientDialog
       │     ├─ shows masked customer (first name, city, trade, notes)
       │     ├─ shows pre-filled intro template the contractor can edit
       │     ├─ requires contractor to agree to GCN messaging rules
       │     └─ [Send first message]
       │           ├─ inserts broadcast_conversation + broadcast_message
       │           ├─ stamps referral_broadcast_claims.message_sent_at
       │           └─ triggers send-broadcast-claim-notification edge function
       │                 ├─ emails customer with contractor card + Accept/Decline links
       │                 └─ if customer has auth account, also drops a homeowner_notification
       └─ after first message, card shows [Open Conversation] instead
```

Customer side:
- Email contains 3 buttons per contractor: **Accept & Reply**, **Save for later**, **Not interested**.
- Accept flips `broadcast_conversations.customer_consent = true`, unmasks contact info for that contractor only, and (if customer has an account) routes them into the existing homeowner messaging UI for replies.

## Database Changes (one migration)

New tables:
- `broadcast_conversations` — `id`, `broadcast_id`, `claim_id`, `customer_id`, `contractor_id`, `customer_consent` (bool, default false), `consent_at`, `customer_declined` (bool), `last_message_at`, `contractor_unread_count`, `customer_unread_count`. Unique on (broadcast_id, contractor_id).
- `broadcast_messages` — `id`, `conversation_id`, `sender_type` ('contractor'|'customer'|'system'), `sender_id` (nullable for system), `content`, `is_read`, `created_at`.
- `broadcast_consent_tokens` — `token` (uuid pk), `conversation_id`, `action` ('accept'|'decline'), `expires_at`, `used_at`. Used by the email links so the customer doesn't need to log in.

Triggers/functions:
- After insert on `broadcast_messages` where sender_type='contractor' and it's the **first** contractor message in that conversation: set `referral_broadcast_claims.message_sent_at = now()` for the matching claim. (Reinforces the "first 3 to message" rule already documented.)
- Standard `update_updated_at` and `last_message_at` triggers.

RLS:
- `broadcast_conversations`: contractor can SELECT/UPDATE rows where `contractor_id = get_contractor_profile_id()`. Super admin all. Customer access only via signed token (handled in edge function with service role) or via their authenticated user matching `gcn_customers.user_id` if/when linked.
- `broadcast_messages`: contractor can SELECT/INSERT in their own conversations. Customer messages flow in via the consent edge function.
- `broadcast_consent_tokens`: no client access; service-role only.

## Edge Functions

1. `send-broadcast-claim-notification` (POST, JWT-verified)
   - Input: `conversation_id`.
   - Loads conversation + contractor profile + customer contact.
   - Generates two `broadcast_consent_tokens` (accept, decline).
   - Sends a Resend email to the customer with contractor card, intro message, and the two tokenized links pointing at `/r/consent?token=...`.
   - Inserts a `homeowner_notifications` row if `gcn_customers.user_id` is set.

2. `process-broadcast-consent` (GET/POST, public, no JWT)
   - Validates token, marks `used_at`, sets `customer_consent` or `customer_declined` on the conversation.
   - Returns a small success page that links the customer into the in-app reply view (or a public reply form if they don't have an account).

## Frontend Changes

- `src/components/referrals/tabs/AvailableReferralsTab.tsx`
  - Replace the existing "Claim" button with **Claim & Message**. On click: claim, then open `MessageClientDialog`.
  - Replace the disabled "Claimed" pill with **Open Conversation** that opens the same dialog in thread mode.

- `src/components/referrals/modals/MessageClientDialog.tsx` (new)
  - Two states: `compose` (no message sent yet, shows masked customer + template + send) and `thread` (shows full conversation, message composer, masked-vs-unmasked contact based on `customer_consent`).
  - Uses Supabase Realtime on `broadcast_messages` filtered by `conversation_id`.

- `src/hooks/referrals/messaging.ts` (new)
  - `useOrCreateBroadcastConversation(broadcastId, claimId, contractorId)`
  - `useBroadcastMessages(conversationId)` with realtime subscription
  - `useSendBroadcastMessage()` — inserts message, calls `send-broadcast-claim-notification` on first send
  - `useMyBroadcastConversations(contractorId)` for an inbox view

- `src/pages/ReferralsDashboard.tsx`
  - Add a small **Inbox** badge next to the Available Referrals tab showing total contractor unread count.

- `src/pages/BroadcastConsent.tsx` + route `/r/consent` (new)
  - Calls `process-broadcast-consent`, displays a friendly "You're connected with {Contractor}" page or "We'll let them know you're not interested" page.

## Out of Scope

- SMS notifications (email + in-app only for v1).
- Group/3-way conversations — each contractor↔customer pair gets its own thread.
- Customer-initiated outreach to contractors who didn't claim.
- Payment/escrow — existing referral/residual logic untouched.

## Technical Notes

- The 3-claim cap is already enforced atomically by `enforce_broadcast_claim_cap`; no change needed there.
- `message_sent_at` already exists on `referral_broadcast_claims` and is being set optimistically at claim time today — this plan moves it to the actual first-message trigger so the "first 3 to message wins" rule documented in earlier work is truthfully enforced.
- All consent links use single-use tokens with 14-day expiry; signed URLs are not used because the customer may not have a Supabase session.
- Resend key already configured (`RESEND_API_KEY`); no new secrets required.
