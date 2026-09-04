import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/sync-orders')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Secure authorization: Check for a secret key ONLY from environment variables
        const url = new URL(request.url);
        const secretKey = url.searchParams.get('key') || request.headers.get('x-sync-key');
        const expectedSecret = process.env['SYNC_SECRET_KEY'];

        if (!expectedSecret) {
          console.error('[Sync] ERROR: SYNC_SECRET_KEY environment variable is not configured.');
          return new Response('Server configuration error', { status: 500 });
        }

        if (!secretKey || secretKey !== expectedSecret) {
           return new Response('Unauthorized', { status: 401 });
        }

        try {
          const { syncPendingOrders } = await import('@/lib/providers/sync.server')
          const res = await syncPendingOrders({ limit: 30 })
          return new Response(JSON.stringify(res), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err?.message ?? 'Sync failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }
  }
})
