import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/sync-orders')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Secure authorization: Check for a secret key from the runtime environment.
        // Cloudflare Workers bindings/vars get attached to the request object itself
        // as request.runtime.cloudflare.env in this stack (nitro's cloudflare-module
        // preset's augmentReq), with globalThis.__env__ / process.env as fallbacks.
        const url = new URL(request.url);
        const secretKey = url.searchParams.get('key') || request.headers.get('x-sync-key');
        const cfEnv = (request as any).runtime?.cloudflare?.env;
        const expectedSecret = cfEnv?.SYNC_SECRET_KEY || (globalThis as any).__env__?.SYNC_SECRET_KEY || process.env['SYNC_SECRET_KEY'];

        if (!expectedSecret) {
          console.error('[Sync] ERROR: SYNC_SECRET_KEY environment variable is not configured.');
          console.error('[Sync] DEBUG cfEnv keys:', cfEnv ? Object.keys(cfEnv).join(',') : 'cfEnv is ' + typeof cfEnv);
          console.error('[Sync] DEBUG globalThis.__env__ keys:', (globalThis as any).__env__ ? Object.keys((globalThis as any).__env__).join(',') : 'undefined');
          console.error('[Sync] DEBUG process.env has key:', 'SYNC_SECRET_KEY' in process.env);
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
