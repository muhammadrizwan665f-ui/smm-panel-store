# Plan — Phase 1: Authentication & Initial User Flow

Build a modern Indian SMM panel application with authentication and initial selection flow.

## Design System & Architecture

- **Dark Premium Theme:** Update `src/styles.css` with a deep dark palette, primary accent colors (Blue/Purple), and glassmorphism tokens.
- **Database Schema:** 
  - `profiles` table: Store `id`, `mobile_number`, `wallet_balance`, `role` (user/admin), `status`.
  - `user_roles` table: Manage RBAC (admin/user).
- **Authentication:** Custom server functions for phone-based login/registration using Supabase Auth.

## Implementation Tasks

### 1. Database & Security
- Migration for `profiles` and `user_roles` tables.
- RLS policies for user-specific data.
- RBAC functions (`has_role`).

### 2. Authentication Logic
- `src/lib/auth/auth.functions.ts`: `signIn`, `signUp`, `signOut` server functions.
- `src/lib/auth/session.functions.ts`: Session management helpers.

### 3. UI Components
- **Auth Components:** `LoginForm`, `RegisterForm` with validation (Zod, React Hook Form) and India phone formatting.
- **Dashboard Selection:** `OptionCards` component for the initial three-choice flow.

### 4. Routing & Pages
- `src/routes/login.tsx`: Login page.
- `src/routes/register.tsx`: Registration page.
- `src/routes/_authenticated.tsx`: Pathless layout for protected routes.
- `src/routes/_authenticated/index.tsx`: Initial selection screen.
- `src/routes/_authenticated/option.$id.tsx`: Placeholder for option selections.

## Technical Details

- **Tailwind v4:** Using semantic tokens and OKLCH colors.
- **TanStack Start:** SSR-safe server functions for backend operations.
- **Supabase:** Auth and DB persistence.
- **Validation:** `react-phone-number-input` for India formatting (+91).

## Verification Plan

- **Automated Checks:** 
  - `bun run build` to verify routing and type safety.
  - Supabase migration test for schema consistency.
- **Manual Preview:**
  - Verify mobile responsiveness in preview.
  - Test registration -> login -> selection flow.
  - Confirm unauthenticated users are redirected from protected routes.
