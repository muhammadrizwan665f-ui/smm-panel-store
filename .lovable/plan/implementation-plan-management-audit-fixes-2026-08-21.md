# Implementation Plan - Management Audit & Fixes

## 1. Management Users Page Fix
- **Root Cause**: The `adminListUsers` server function was querying `profiles.email`, which does not exist in the database schema.
- **Remedy**: Update `adminListUsers` in `src/lib/admin/admin.functions.ts` to only query valid columns (`id`, `mobile_number`, `wallet_balance`, `status`, `created_at`).
- **Additional Data**: If email is required, I will attempt to fetch it via `supabase.auth.admin.listUsers` server-side and join it by ID.

## 2. Admin "Login as User" (Impersonation)
- **Goal**: Allow an admin to securely log in as a user without their password.
- **Mechanism**:
    1. Create a server function `adminImpersonateUser` that uses the `service_role` key to generate a temporary login link or short-lived OTP/session.
    2. Since Supabase doesn't natively support "impersonation" tokens easily without magic links, I will implement a "switch-session" flow:
        - Admin clicks "Login as User".
        - Server function generates a custom auth token or signs in as user using `supabase.auth.admin.generateLink`.
        - Client receives tokens, clears current session (preserving admin session in a dedicated cookie if possible, or just requiring re-login), and calls `establishClientSession` with user tokens.
    3. UI update in `src/routes/management.users.tsx` to handle the flow and redirect to `/dashboard`.
    4. Provide a "Return to Management" banner in the user dashboard when an impersonated session is active.

## 3. Management Dashboard Redirect Loop
- **Root Cause**: Race condition between `loader`, `beforeLoad`, and client-side hydration. `ManagementLayout` sometimes sees a "checking" state and defaults to a denial/redirect if `sessionResult` is slightly delayed or if the cookie is not picked up instantly.
- **Remedy**:
    - Harmonize `src/routes/management.tsx` auth logic.
    - Ensure `getSession()` is fully awaited and that the client-side `authState` doesn't flip to `denied` prematurely.
    - Standardize on cookie-based session verification to prevent flickering.

## 4. UI Clean-up
- **Action**: Remove all prompt/instruction text from `src/routes/management.tsx` and `src/routes/management.index.tsx`. I have already started this by replacing the sidebar text with "Fameworld Management".

## Technical Details
- **Files to Edit**:
    - `src/lib/admin/admin.functions.ts` (List users, Impersonate function)
    - `src/routes/management.users.tsx` (Handle impersonate click)
    - `src/routes/management.tsx` (Auth guard stability)
    - `src/routes/_authenticated.tsx` (Add "Return to Management" banner)
- **Database**: No schema changes required.
- **Security**: Service role key remains server-side only. Role verification is strictly enforced in server functions.
