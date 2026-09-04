# Merge Claude Fixes Plan

I will merge the provided Claude package into the current project, focusing on authentication improvements and centralized currency handling while preserving all existing features and data.

## Step 1: Core Infrastructure
- **Currency**: Update `src/lib/currency.constants.ts` with the new `convertUsdtToInr` helper.
- **Auth**: Add `src/lib/auth/client-session.ts` for clean client-side session management.
- **Session**: Update `src/lib/auth/session.functions.ts` with optimized session fetching.

## Step 2: Routing & Protection
- **Layout**: Refactor `src/routes/_authenticated.tsx` to use the improved auth guards and hydration logic.
- **Management**: Update `src/routes/management.tsx` to ensure strict admin-only access without redirect loops.
- **Clean up**: Audit `src/routes/__root.tsx` for navigation and layout stability.

## Step 3: Business Logic
- **Providers**: Merge fixes into `src/lib/providers/provider.functions.ts` for better API field mapping and error handling.
- **Orders**: Update `src/lib/providers/order.functions.ts` to ensure consistent currency conversion during order placement.
- **Import**: Refactor `src/lib/providers/import.functions.ts` to use the centralized currency helper.

## Step 4: UI Updates
- **Auth Forms**: Update `LoginForm.tsx` and `RegisterForm.tsx` with improved validation and session handling.
- **Admin Panel**: Apply visual and functional fixes to management routes (providers, services, settings) to ensure correct INR display.

## Verification
- Run build and type-check to ensure no regressions.
- Verify end-to-end flows: User Login -> Dashboard, Admin Login -> Management.
- Confirm currency conversion: 1 USDT = 105 INR across all business logic.

**Important**: I will not overwrite existing database settings or delete any user data. Current secrets and environment variables will be preserved.
