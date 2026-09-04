# Task: Fix Authentication and Rebuild Light Dashboard UI

## Overview
The goal is to move from the current dark theme to a bright, modern SaaS-style interface based on the Fameworld reference. We also need to fix authentication to be fully functional (real mobile/password auth) and build a complete dashboard for both mobile and desktop.

## User-Facing Changes
- **Light Theme**: The entire app will switch from a dark background to a clean white background with soft blue/purple/pink gradients.
- **Functional Auth**: Real registration and login using Indian mobile numbers (+91) and password authentication.
- **Dashboard**: A new Control Center with wallet balance, quick actions, stats, and recent orders.
- **Modular Navigation**: Functional sidebar for desktop and bottom navigation for mobile.

## Technical Details
- **Design System**: Update `src/styles.css` to use light OKLCH tokens and a SaaS-like glassmorphism style.
- **Authentication**:
  - Update `signUp` and `signIn` in `src/lib/auth/auth.functions.ts` to ensure consistent handling of the masked phone email.
  - Fix `src/lib/auth/session.functions.ts` to return profile data correctly.
  - Update `LoginForm` and `RegisterForm` to follow the new light theme and properly handle India number validation.
- **Routing**:
  - Fix route tree to use `/authenticated` as the main dashboard path.
  - Implement functional placeholders for all secondary dashboard routes.
- **State Management**: Use `useSuspenseQuery` for real-time dashboard data from the database.
- **Supabase**: Ensure RLS policies and table grants allow the user to read their own profile/wallet balance.

## Verification Plan
1. **Auth Flow**: Register a new account -> Verify redirection to dashboard -> Verify wallet balance is ₹0.
2. **Session Persistence**: Refresh the dashboard -> Verify user remains logged in.
3. **Logout**: Logout -> Verify redirection to `/login` and access to `/authenticated` is blocked.
4. **Responsive Check**: Test dashboard on mobile view to verify bottom navigation and header.
5. **Theme Verification**: Confirm no dark elements remain and gradients match the light aesthetic.
