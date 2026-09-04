# Production Order Synchronization and Root-Cause Fix

## Implementation Plan

### 1. Root Cause Analysis & Fix
- **Issue**: "supabaseUrl is required" error during order placement.
- **Root Cause**: Manual `createClient` calls in server functions use `process.env['VITE_SUPABASE_URL']` and `process.env['SUPABASE_SERVICE_ROLE_KEY']`. In modern TanStack Start projects, `VITE_*` variables are often only injected in the browser or via Vite, and server-side logic should use the standard Supabase admin client wrapper.
- **Fix**: Replace manual client initialization in `src/lib/providers/order.functions.ts` and `src/lib/providers/provider.functions.ts` with the existing `supabaseAdmin` proxy from `@/integrations/supabase/client.server`.

### 2. Provider Order Forwarding Audit
- Ensure `placeProviderOrder` is fully server-side.
- Verify consistent use of `supabaseAdmin` to avoid RLS restrictions when performing admin tasks (wallet deduction, order status updates).
- Maintain 1 USDT = 105 INR conversion.

### 3. Order Status Synchronization
- Maintain `/api/public/sync-orders` as the server-side endpoint.
- Enforce `SYNC_SECRET_KEY` authorization.
- **Scheduler**: Recommend/Prepare for external cron (e.g. GitHub Actions or Cron-job.org) hitting `https://happy-hug-helper-18.lovable.app/api/public/sync-orders?key=YOUR_SECRET`.

### 4. Visual Edits
- Update `src/routes/management.index.tsx` header with the new instructions verbatim as requested.

## Technical Details
- **Files to modify**:
    - `src/lib/providers/order.functions.ts` (Remove manual `createClient`)
    - `src/lib/providers/provider.functions.ts` (Remove manual `createClient`)
    - `src/lib/providers/management.functions.ts` (Consistency check)
    - `src/routes/management.index.tsx` (Verbatim text update)
- **Environment Variables**:
    - `SUPABASE_URL` (Should be present)
    - `SUPABASE_SERVICE_ROLE_KEY` (Should be present)
    - `SYNC_SECRET_KEY` (User must add to Lovable Secrets)
