# Plan - Stabilize Management Authentication

This plan will create a reliable administration entry point, ensure the admin account is correctly configured in Supabase Auth, and solidify the authorization guards.

## User-facing changes
- A dedicated management login at `/management/login`.
- Automatic redirection to login when accessing management pages while logged out.
- "Access Denied" messaging for normal users attempting to access admin areas.
- Persistent admin sessions that survive browser refreshes.

## Technical details
- **Admin Account Setup**: Use a one-time server function to ensure `rehansheikhofficial19c@gmail.com` exists in Supabase Auth with the `admin` role.
- **Routing Guards**:
    - Update `src/routes/management.tsx` to use a robust session and role check that survives hydration.
    - Standardize the `beforeLoad` and `component` logic for consistent redirection.
- **LoginForm Compatibility**: Ensure the shared `LoginForm` handles the management redirect correctly.
- **Database Alignment**: Ensure the `user_roles` table and role checking functions are correctly utilized.

## Implementation Steps

### 1. Configure Admin Account
- Run `ensureAdminUser` server function via a temporary test script to confirm the account exists and has the `admin` role.
- Verify the link between `auth.users`, `public.profiles`, and `public.user_roles`.

### 2. Refine Management Layout
- Edit `src/routes/management.tsx` to improve the `authState` checking logic.
- Ensure it handles the "Loading" -> "Redirect" -> "Dashboard" flow smoothly.
- Add a specific "Access Denied" UI for non-admin users.

### 3. Final Verification
- Test direct access to `/management` (expect redirect to login).
- Test login with admin credentials (expect dashboard access).
- Test refresh on dashboard (expect persistence).
- Test login with normal user credentials (expect access denied).
