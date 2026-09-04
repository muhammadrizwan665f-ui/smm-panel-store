# Plan: Fix Server Function Authorization Error

The user is experiencing an `Unauthorized: No authorization header provided` error when calling certain server functions (like `addProvider` or `getProviderServices`). This happens because these functions are protected with the `requireSupabaseAuth` middleware, but the frontend isn't attaching the required Supabase authentication token to the request.

## Technical Details

- **Root Cause**: The global `functionMiddleware` in `src/start.ts` is configured with `attachSupabaseAuth`, which is responsible for fetching the Supabase session and adding the `Authorization: Bearer <token>` header to all server function calls. If this is failing or missing during certain calls, the server-side `requireSupabaseAuth` middleware will throw the "No authorization header provided" error.
- **Problem Observation**: The `addProvider` and `getProviderServices` functions in `src/lib/providers/provider.functions.ts` use `.middleware([requireSupabaseAuth])`. If the user is logged in via `supabase.auth.signInWithPassword` (which they are), `attachSupabaseAuth` should be picking up that session.

## Steps to Fix

1. **Verify Middleware Registration**: Ensure `attachSupabaseAuth` is correctly registered in `src/start.ts` (already confirmed, but will double-check for any typos or issues).
2. **Handle Optional Auth**: For server functions where strict RLS might not be needed but we still want to use `supabaseAdmin` (like some provider functions already do), we can either:
    - Ensure the client always sends the token.
    - Or, if the operation is purely administrative and doesn't rely on the user's RLS context, remove the `requireSupabaseAuth` middleware and handle authorization via a different check (like checking if the caller is an admin) within the function itself using the service role client.
3. **Fix `listProviders` and `testConnection`**: These currently don't use `requireSupabaseAuth`. If the user wants consistent protection, they should.
4. **Fix `src/integrations/supabase/auth-middleware.ts`**: Add better logging to see why the header might be missing during an active session.

## Implementation Details

- **src/lib/providers/provider.functions.ts**: Maintain `requireSupabaseAuth` where appropriate, but ensure the frontend is actually triggering the middleware.
- **src/start.ts**: Ensure the `attachSupabaseAuth` middleware is at the top of the array to run first.
- **src/integrations/supabase/auth-attacher.ts**: Add logging to verify if a session/token is actually being found in the browser.

I will start by adding logging to the auth attacher to diagnose if the browser is finding the session.
