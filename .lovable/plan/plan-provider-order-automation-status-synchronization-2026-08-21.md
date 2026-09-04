# Plan - Provider Order Automation & Status Synchronization

Complete the end-to-end automation of provider order forwarding and status synchronization.

## User-facing changes
- The Management Dashboard header now displays the detailed instruction block as requested.
- Orders will automatically update their status (e.g., from Processing to Completed) without requiring manual page refreshes.
- Failed or cancelled provider orders will automatically trigger a refund to the user's wallet (one-time).
- Improved idempotency ensures duplicate orders are not submitted to providers.

## Technical Details

### 1. Automation Mechanism
- **Mechanism**: The project currently relies on a server-side API endpoint `/api/public/sync-orders` for status updates.
- **Scheduler**: Since there is no internal scheduler visible in the current sandbox/project environment, I will implement a **Supabase pg_cron** based scheduler. This is the industry-standard way to handle background tasks in Supabase projects.
- **Frequency**: The job will be scheduled to run every 5 minutes.
- **Security**: The `/api/public/sync-orders` endpoint is protected by a secret key (`SYNC_SECRET_KEY`). I will generate this secret and configure the cron job to include it in the request.

### 2. Implementation Steps
- **Database Migration**:
    - Create a pg_cron job that hits the `/api/public/sync-orders` endpoint every 5 minutes.
    - The cron job will use the `net` extension in Supabase to make the HTTP GET request.
    - It will include the `SYNC_SECRET_KEY` as a query parameter.
- **Refine Logic (`src/lib/providers/order.functions.ts`)**:
    - Add strict idempotency checks in `placeProviderOrder` to prevent duplicate submissions.
    - Enhance `syncOrderStatusInternal` to handle automatic refunds when a status moves from non-final to 'failed' or 'cancelled'.
- **Secure Endpoint (`src/routes/api/public/sync-orders.tsx`)**:
    - Enforce the `SYNC_SECRET_KEY` check.
    - Optimize the query to only fetch orders with non-final statuses.
- **Visual Edits**:
    - Update `src/routes/management.index.tsx` with the requested long instruction text.

### 3. Verification Plan
- I will verify the flow by:
    1. Creating a test order.
    2. Manually triggering the secured sync endpoint to confirm status updates and refund logic work as intended.
    3. Confirming the cron migration is successfully applied to the database.

## Modified Files
- `src/routes/management.index.tsx`
- `src/lib/providers/order.functions.ts`
- `src/routes/api/public/sync-orders.tsx`
- `supabase/migrations/[new_migration]_setup_cron_sync.sql`
