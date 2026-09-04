import { ProviderAdapterFactory } from "./generic-adapter";

/** Syncs a single order against its provider. Server-only. */
export async function syncOneOrder(orderId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: orderData, error: orderError } = await (supabaseAdmin as any)
    .from("orders")
    .select(`
      *,
      provider:providers (
        api_url,
        api_key,
        api_version
      )
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !orderData || !orderData.provider_order_id) {
    throw new Error("Order not found or no provider ID");
  }

  const order = {
    ...orderData,
    api_url: orderData.provider?.api_url,
    api_key: orderData.provider?.api_key,
    api_version: orderData.provider?.api_version,
  };

  if (!order.api_url || !order.api_key) {
    throw new Error("Provider API configuration missing for status sync");
  }

  const adapter = ProviderAdapterFactory.getAdapter(order.api_version, order.api_url, order.api_key);
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

  if (autoRefundEnabled && internalStatus === "failed" && order.status !== "failed") {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_balance")
      .eq("id", order.user_id)
      .single();
    const currentBalance = Number(profile?.wallet_balance || 0);

    await (supabaseAdmin as any)
      .from("profiles")
      .update({ wallet_balance: currentBalance + Number(order.price) })
      .eq("id", order.user_id);

    await (supabaseAdmin as any).from("wallet_transactions").insert({
      user_id: order.user_id,
      amount: Number(order.price),
      type: "refund",
      status: "completed",
      description: `Auto-refund for failed/canceled Order #${orderId.slice(0, 8)} (${providerStatus})`,
    });
  }

  const { error: finalUpdateError } = await (supabaseAdmin as any)
    .from("orders")
    .update({ status: internalStatus, provider_response: statusRes as any })
    .eq("id", orderId);
  if (finalUpdateError) throw finalUpdateError;

  return { status: internalStatus, provider: statusRes };
}

/** Syncs all pending API orders (optionally only for one user). Server-only. */
export async function syncPendingOrders(opts: { userId?: string; limit?: number } = {}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let q = (supabaseAdmin as any)
    .from("orders")
    .select("id")
    .not("status", "in", '("completed","failed","cancelled","refunded")')
    .not("provider_order_id", "is", null)
    .order("updated_at", { ascending: true })
    .limit(opts.limit ?? 25);

  if (opts.userId) q = q.eq("user_id", opts.userId);

  const { data: orders, error } = await q;
  if (error) throw new Error(error.message);
  if (!orders?.length) return { synced: 0, results: [] as any[] };

  const results: any[] = [];
  for (const o of orders) {
    try {
      const res = await syncOneOrder(o.id);
      results.push({ id: o.id, ok: true, status: res.status });
    } catch (err: any) {
      results.push({ id: o.id, ok: false, message: err?.message });
    }
  }
  return { synced: results.filter((r) => r.ok).length, results };
}
