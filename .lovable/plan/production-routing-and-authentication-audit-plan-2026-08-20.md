# Production Routing and Authentication Audit Plan

Stabilize the authentication and routing architecture to ensure a seamless experience on published domains, fixing registration-to-dashboard issues and removing all legacy `/authenticated` references.

## User Panel Route Standardization
- Audit `src/routes/` for any residual files or definitions using the `/authenticated` path prefix.
- Ensure all user-facing routes are nested under the `_authenticated` pathless layout.
- Canonical routes:
  - `/dashboard`
  - `/create-order`
  - `/services`
  - `/orders`
  - `/profile`
  - `/add-funds`
  - `/balance-history`
  - `/support`

## Authentication Flow Stabilization
- **Registration Flow:**
  - Update `RegisterForm.tsx` to ensure `signUp` is followed by a verified session before redirecting.
  - Implement a dedicated "Session Ready" check that polls or waits for Supabase session availability.
  - Remove `window.location.replace` hacks in favor of `router.navigate` or `redirect` where possible, or ensure `window.location.href` points to the canonical `/dashboard`.
- **Login Flow:**
  - Update `LoginForm.tsx` to handle session injection correctly.
  - Verify `auth-attacher.ts` and `auth-middleware.ts` correctly handle tokens on the published domain.
- **Pathless Layout (`_authenticated.tsx`):**
  - Refine `beforeLoad` guard to handle session detection robustly.
  - Implement a loading state in the component itself to prevent layout shifts or blank pages during session hydration.

## Internal Link & Redirect Audit
- Search and replace all internal navigation targets:
  - Replace `to="/authenticated/..."` with `to="/..."`.
  - Update all `redirect({ to: "/authenticated/..." })` calls.
  - Ensure the sidebar, bottom nav, and dashboard cards use canonical paths.

## Production Resilience
- **Dashboard Widgets:**
  - Wrap dashboard data fetches in `try-catch` blocks.
  - Ensure missing profile or wallet data shows a fallback instead of crashing the page.
- **Refresh Support:**
  - Ensure the server-side loader/middleware correctly identifies authenticated sessions on direct URL hits (refresh).

## Technical Implementation Details
- Use `useSuspenseQuery` for core data to leverage TanStack Start's loading state handling.
- Update `src/routeTree.gen.ts` by ensuring all `createFileRoute` IDs match the new pathless structure.
- Verify RLS grants on `profiles` and `user_roles` to ensure the `getSession` server function doesn't fail silently.
