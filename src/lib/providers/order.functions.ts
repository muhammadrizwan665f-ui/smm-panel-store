import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ProviderAdapterFactory } from "./generic-adapter";

// TanStack Start / Seroval serialization workaround:
// We return simple strings to avoid "All object keys match" errors.

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as {
    providerId: string;
    serviceId: string;
    link: string;
    quantity: number;
    extraParams?: Record<string, any>;
  })
  .handler(async (args: any) => {
    const data = args.data;
    const { supabaseAdmin: _sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = _sbAdmin;
    
    const { data: provider, error: pError } = await (supabaseAdmin as any)
      .from('providers')
      .select('api_url, api_key, api_version')
      .eq('id', data.providerId)
      .single();

    if (pError || !provider) throw new Error("Provider not found");
    
    const adapter = ProviderAdapterFactory.getAdapter(provider.api_version, provider.api_url, provider.api_key);
    
    const orderResult = await adapter.addOrder({
      service: data.serviceId,
      link: data.link,
      quantity: data.quantity,
      ...data.extraParams
    });
    
    return JSON.stringify(orderResult);
  });

export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator((d: any) => d as {
    providerId: string;
    orderId: string;
  })
  .handler(async (args: any) => {
    const data = args.data;
    const { supabaseAdmin: _sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = _sbAdmin;
    
    const { data: provider, error: pError } = await (supabaseAdmin as any)
      .from('providers')
      .select('api_url, api_key, api_version')
      .eq('id', data.providerId)
      .single();

    if (pError || !provider) throw new Error("Provider not found");
    
    const adapter = ProviderAdapterFactory.getAdapter(provider.api_version, provider.api_url, provider.api_key);
    const status = await adapter.getOrderStatus(data.orderId);
    
    return JSON.stringify(status);
  });

export const placeProviderOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as {
    orderId: string;
  })
  .handler(async (args: any) => {
    const data = args.data;
    const context = args.context;
    const supabase = (context as any)?.supabase;

    const fetchContext = async () => {
      const { data: ctxRow, error } = await supabase.rpc("rpc_get_order_context", { _order_id: data.orderId });
      if (error) console.warn(`[placeProviderOrder] Order lookup error:`, error);
      return ctxRow;
    };

    let ctx = await fetchContext();

    if (!ctx) {
      // Eventual-consistency safety net: retry a few times with backoff.
      for (let attempt = 1; attempt <= 3 && !ctx; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        console.log(`[placeProviderOrder] Retrying lookup for order ${data.orderId} (attempt ${attempt}/3)`);
        ctx = await fetchContext();
      }
    }

    if (!ctx) {
      throw new Error(`Order not found. (ID: ${data.orderId})`);
    }

    const orderRow = ctx.order;
    const serviceRow = ctx.service;
    const providerRow = ctx.provider;

    // Fetch global currency settings for consistent conversion (publicly readable).
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['usdt_rate', 'usdt_to_inr']);

    const settings: Record<string, string> = {};
    settingsData?.forEach((item: any) => {
      settings[item.key] = item.value || '';
    });

    const usdtToInr = parseFloat(settings['usdt_to_inr'] || settings['usdt_rate'] || String(280));

    const providerId = serviceRow?.provider_id || orderRow.provider_id;
    if (!providerId) throw new Error("Provider not linked to this order or service");
    if (!providerRow?.api_url || !providerRow?.api_key) {
      throw new Error("Provider API configuration missing for this order");
    }

    const order = {
      ...orderRow,
      provider_id: providerId,
      provider_service_id: serviceRow?.provider_service_id,
      provider_rate: serviceRow?.provider_rate,
      provider_currency: serviceRow?.provider_currency || providerRow?.currency || 'USDT',
      api_url: providerRow.api_url,
      api_key: providerRow.api_key,
      api_version: providerRow.api_version,
      wallet_balance: ctx.wallet_balance,
      usdt_to_inr: usdtToInr,
    };

    const adapter = ProviderAdapterFactory.getAdapter(order.api_version, order.api_url, order.api_key);

    try {
      console.log(`[placeProviderOrder] Starting order placement for order ${data.orderId}`);

      // 1. Idempotency: skip if this order already has a provider order id.
      if (orderRow.provider_order_id) {
        console.log(`[placeProviderOrder] Order ${data.orderId} already has provider ID ${orderRow.provider_order_id}. Skipping duplicate submission.`);
        return JSON.stringify({ order: orderRow.provider_order_id, message: "Order already processed" });
      }

      // 2. Deduct balance atomically (RPC checks balance and raises if insufficient).
      console.log(`[placeProviderOrder] Deducting balance: ${order.price}`);
      await supabase.rpc("rpc_debit_wallet_for_order", { _order_id: data.orderId, _amount: Number(order.price) });

      await supabase.rpc("rpc_log_provider_api", {
        _provider_id: order.provider_id,
        _operation: 'add_order_attempt',
        _request: {
          service: order.provider_service_id,
          link: order.link,
          quantity: order.quantity,
        },
        _response: null,
        _status_code: 0,
        _is_success: true,
      });

      console.log(`[placeProviderOrder] Calling provider API adapter for service ${order.provider_service_id}`);
      const response = await adapter.addOrder({
        service: order.provider_service_id,
        link: order.link,
        quantity: order.quantity
      });

      console.log(`[placeProviderOrder] Provider API response:`, JSON.stringify(response));

      if (!response || (!response.order && !response['order_id'])) {
        console.error(`[placeProviderOrder] Provider returned no order ID. Response: ${JSON.stringify(response)}`);
        throw new Error("Provider returned no order ID. Response: " + JSON.stringify(response));
      }

      const providerOrderId = (response.order || response['order_id']).toString();
      console.log(`[placeProviderOrder] Successfully received Provider Order ID: ${providerOrderId}`);

      const providerCostBase = (Number(order.provider_rate) * order.quantity) / 1000;
      const providerCostInInr = order.provider_currency === 'PKR'
        ? providerCostBase
        : providerCostBase * usdtToInr;

      const profit = Number(order.price) - providerCostInInr;

      await supabase.rpc("rpc_finalize_order", {
        _order_id: data.orderId,
        _status: 'processing',
        _provider_order_id: providerOrderId,
        _provider_cost: providerCostInInr,
        _profit: profit,
        _provider_response: response as any,
      });

      await supabase.rpc("rpc_log_provider_api", {
        _provider_id: order.provider_id,
        _operation: 'add_order_success',
        _request: null,
        _response: response as any,
        _status_code: 200,
        _is_success: true,
      });

      return JSON.stringify(response);

    } catch (err: any) {
      console.error("[placeProviderOrder] Error:", err.message);

      // Refund if balance was deducted but order failed (only if it wasn't a balance error itself)
      if (err.message !== "Insufficient balance" && !err.message.includes("Balance deduction failed")) {
        await supabase.rpc("rpc_refund_wallet_for_order", {
          _order_id: data.orderId,
          _amount: Number(order.price),
          _description: `Refund for failed Order #${data.orderId.slice(0, 8)}`,
        });
      }

      await supabase.rpc("rpc_finalize_order", {
        _order_id: data.orderId,
        _status: 'failed',
        _provider_order_id: null,
        _provider_cost: null,
        _profit: null,
        _provider_response: { error: err.message || "Provider API error" } as any,
      });

      await supabase.rpc("rpc_log_provider_api", {
        _provider_id: order.provider_id,
        _operation: 'add_order_failed',
        _request: null,
        _response: { error: err.message } as any,
        _status_code: 500,
        _is_success: false,
      });

      throw err;
    }
  });

export const syncOrderStatusInternal = createServerFn({ method: "POST" })
  .inputValidator((d: any) => d as { orderId: string })
  .handler(async (args: any) => {
    const { syncOneOrder } = await import("./sync.server");
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: orders } = await (supabase as any).rpc("rpc_list_pending_sync_orders", { _limit: 1000, _user_id: null });
    const order = (orders as any[])?.find((o) => o.id === args.data.orderId);
    if (!order) throw new Error("Order not found or not eligible for sync");
    const res = await syncOneOrder(order);
    return JSON.stringify(res.provider);
  });
