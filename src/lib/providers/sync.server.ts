import { ProviderAdapterFactory } from "./generic-adapter";

/**
 * Syncs a single order against its provider. Server-only.
 * Uses the public (anon-key) client — the actual DB reads/writes go
 * through SECURITY DEFINER RPC functions, so no service_role key
 * is required even though this runs outside any user session.
 */
export async function syncOneOrder(order: {
  id: string;
  status: string;
  provider_order_id: string;
  price: number;
  user_id: string;
  api_url: string | null;
  api_key: string | null;
  api_version: string | null;
}) {
  const { supabase } = await import("@/integrations/supabase/client");

  if (!order.api_url || !order.api_key) {
    throw new Error("Provider API configuration missing for status sync");
  }

  const adapter = ProviderAdapterFactory.getAdapter(order.api_version || "v2", order.api_url, order.api_key);
  const statusRes = await adapter.getOrderStatus(order.provider_order_id);

  let internalStatus = order.status;
  const providerStatus = String(statusRes.status || "").toLowerCase();

  if (providerStatus.includes("completed") || providerStatus === "success") internalStatus = "completed";
  else if (
    providerStatus.includes("processing") ||
    providerStatus.includes("pending") ||
    providerStatus.includes("inprogress") ||
    providerStatus.includes("progress")
  )
    internalStatus = "processing";
  else if (
    providerStatus.includes("canceled") ||
    providerStatus.includes("error") ||
    providerStatus.includes("fail") ||
    providerStatus.includes("cancelled") ||
    providerStatus.includes("refunded")
  )
    internalStatus = "failed";
  else if (providerStatus.includes("partial")) internalStatus = "failed";

  const { readBranding } = await import("@/lib/settings/branding.server");
  const autoRefundEnabled = (await readBranding()).auto_refund_enabled;
  const shouldRefund = autoRefundEnabled && internalStatus === "failed" && order.status !== "failed";

  const { error } = await (supabase as any).rpc("rpc_apply_sync_result", {
    _order_id: order.id,
    _internal_status: internalStatus,
    _provider_response: statusRes as any,
    _do_refund: shouldRefund,
    _refund_description: shouldRefund
      ? `Auto-refund for failed/canceled Order #${order.id.slice(0, 8)} (${providerStatus})`
      : null,
  });
  if (error) throw new Error(error.message);

  return { status: internalStatus, provider: statusRes };
}

/** Syncs all pending API orders (optionally only for one user). Server-only. */
export async function syncPendingOrders(opts: { userId?: string; limit?: number } = {}) {
  const { supabase } = await import("@/integrations/supabase/client");

  const { data: orders, error } = await (supabase as any).rpc("rpc_list_pending_sync_orders", {
    _limit: opts.limit ?? 25,
    _user_id: opts.userId ?? null,
  });
  if (error) throw new Error(error.message);
  if (!orders?.length) return { synced: 0, results: [] as any[] };

  const results: any[] = [];
  for (const o of orders as any[]) {
    try {
      const res = await syncOneOrder(o);
      results.push({ id: o.id, ok: true, status: res.status });
    } catch (err: any) {
      results.push({ id: o.id, ok: false, message: err?.message });
    }
  }
  return { synced: results.filter((r) => r.ok).length, results };
}
