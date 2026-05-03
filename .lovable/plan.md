I can see why this is stuck: the app is currently pointed at a different external auth project in `src/integrations/supabase/client.ts`, and that auto-generated client file was manually edited earlier. That means the in-app reset flow and the backend/admin tools are not operating against the same managed backend, so dashboard/password actions can appear to succeed but still not let you log in from `/crm/auth`.

Plan:

1. Restore the app's auth client to the managed project configuration
   - Stop hardcoding the external auth URL/key in `src/integrations/supabase/client.ts`.
   - Use the managed environment variables again so `/crm/auth`, reset password, database access, and backend functions all target the same backend.
   - Avoid manually editing generated backend type files.

2. Add a secure admin password reset backend function
   - Create a protected backend function that can update a user's password using server-side admin privileges.
   - Require an authenticated admin/super-admin session before it can run.
   - Validate email/password input and return only safe error messages.
   - Do not expose service keys, tokens, or raw backend errors to the browser.

3. Add a temporary admin UI/action for this case
   - Add a guarded reset-password action for authorized admins, or wire it into an existing admin user-management area if present.
   - Use it to set `j.janacek21@gmail.com` to the requested new password without sending another reset email, avoiding the email rate-limit entirely.
   - After the password is set, test login from `/crm/auth`.

4. Improve the normal recovery flow messaging
   - Keep the existing reset-password code path for future users.
   - Show a clearer message when the auth email rate limit is hit, so it does not look like a broken app.

Technical notes:

- This cannot be solved reliably by repeatedly sending password reset emails because the auth provider is throttling that email address.
- The immediate fix is to make sure the frontend and backend use the same managed auth project, then perform the password update through a secure server-side admin path.
- I will not expose secrets or put admin credentials in frontend code.