# Security Audit and Authentication Architecture Correction

Remove privileged Admin API usage from public registration and secure the authentication flow for production.

## User-Facing Changes
- **Public Registration**: Users will now register via standard Supabase Auth, creating their own sessions securely.
- **Login**: Stable, standard login flow using mobile or email.
- **Security**: Complete removal of service-role exposure risk in the browser bundle.

## Technical Details

### 1. Registration Refactor (`src/lib/auth/auth.functions.ts`)
- **Remove Admin API**: Replace `supabaseAdmin.auth.admin.createUser` with standard `supabase.auth.signUp` for public registration.
- **Profile/Role Creation**: Move profile and role creation to a database trigger or a secure server-side post-signup process. Since I don't have direct access to Supabase triggers, I will use a secure server function that the client calls *after* a successful signup (authenticated).
- **Session Handling**: Ensure the server function uses the client's session to perform actions, rather than bypassing RLS with the service role key where not strictly required.

### 2. Client-Side Cleanup (`src/components/auth/RegisterForm.tsx`, `src/components/auth/LoginForm.tsx`)
- **Direct Auth**: Use the standard Supabase client directly where appropriate for session management.
- **Remove Normalization Excess**: Ensure normalization logic is consistent between registration, login, and lookups.

### 3. Security Audit
- **Service Role Audit**: Verify `SUPABASE_SERVICE_ROLE_KEY` is ONLY used inside `.handler()` blocks of `createServerFn` or in `.server.ts` files, and never reaches the browser.
- **Admin Init Audit**: Ensure `ensureAdminAccount` is only accessible to authorized developers/admins and not part of the public route tree.

### 4. Production Verification Flow
- **Browser-Driven Testing**: Use Playwright to test the *actual* login and registration flow against the live preview, verifying that:
    - `supabase.auth.getSession()` returns the user session.
    - No `sb_secret_` or `service_role` keys appear in network requests or storage.
    - Pathless `/authenticated` layout does not appear in the URL.
    - Role separation (Admin vs User) is enforced at the server boundary.

## Action Plan

1. **Fix `signUp`**: Change to standard `supabase.auth.signUp`.
2. **Secure Profile Creation**: Create a new server function `completeProfile` that users call after signup to initialize their profile/roles.
3. **Update UI**: Update `RegisterForm` to follow the `signUp -> completeProfile -> /dashboard` flow.
4. **Final Security Sweep**: Use `rg` to double-check all `process.env` and `supabaseAdmin` usage.
5. **Verify Production Behavior**: Run a comprehensive Playwright suite simulating a real user journey.
