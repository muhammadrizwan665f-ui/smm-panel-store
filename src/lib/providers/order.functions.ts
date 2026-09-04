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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
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
  .inputValidator((d: any) => d as {
    orderId: string;
  })
  .handler(async (args: any) => {
    const data = args.data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch Order with Service detail.
    // NOTE: orders.user_id references auth.users, NOT profiles, so profiles
    // cannot be embedded here (PostgREST would fail the whole query).
    const orderSelect = `
      *,
      service:services (
        id,
        provider_id,
        provider_service_id,
        provider_rate,
        provider_currency
      )
    `;

    const fetchOrder = async () => {
      const { data: row, error } = await (supabaseAdmin as any)
        .from('orders')
        .select(orderSelect)
        .eq('id', data.orderId)
        .maybeSingle();
      if (error) console.warn(`[placeProviderOrder] Order lookup error:`, error);
      return row;
    };

    let orderData = await fetchOrder();

    if (!orderData) {
      // Eventual-consistency safety net: retry a few times with backoff.
      for (let attempt = 1; attempt <= 3 && !orderData; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        console.log(`[placeProviderOrder] Retrying lookup for order ${data.orderId} (attempt ${attempt}/3)`);
        orderData = await fetchOrder();
      }
    }

    if (!orderData) {
      throw new Error(`Order not found. (ID: ${data.orderId})`);
    }

    // Attach wallet balance from the user's profile (separate query, no FK embed).
    if (orderData.user_id) {
      const { data: profileRow } = await (supabaseAdmin as any)
        .from('profiles')
        .select('wallet_balance')
        .eq('id', orderData.user_id)
        .maybeSingle();
      orderData.profile = profileRow ?? null;
    }

    return processOrder(orderData);


    async function processOrder(orderData: any) {
      if (!orderData) throw new Error("Critical: processOrder called without order data");
      
      // 2. Fetch Provider (using service.provider_id or order.provider_id)
      const providerId = orderData.service?.provider_id || orderData.provider_id;
      if (!providerId) throw new Error("Provider not linked to this order or service");

      const { data: providerData, error: providerError } = await (supabaseAdmin as any)
        .from('providers')
        .select(`
          api_url,
          api_key,
          api_version,
          currency
        `)
        .eq('id', providerId)
        .single();

      if (providerError || !providerData) throw new Error(`Provider configuration not found for ID: ${providerId}`);
      
      // 3. Verify IDs needed for submission
      if (!orderData.service?.provider_service_id) {
        // One last attempt to fetch the service directly if it's missing from the join
        const { data: directService } = await (supabaseAdmin as any)
          .from('services')
          .select('provider_service_id, provider_rate, provider_currency, provider_id')
          .eq('id', orderData.service_id)
          .single();
          
        if (directService?.provider_service_id) {
          orderData.service = directService;
        } else {
          throw new Error(`Service ${orderData.service_id} does not have a valid Provider Service ID linked.`);
        }
      }
      
      // Fetch global currency settings for consistent conversion
      
      // Fetch global currency settings for consistent conversion
      const { data: settingsData } = await supabaseAdmin
        .from('site_settings')
        .select('key, value')
        .in('key', ['usdt_rate', 'usdt_to_inr']);
      
      const settings: Record<string, string> = {};
      settingsData?.forEach((item: any) => {
        settings[item.key] = item.value || '';
      });
      
      const usdtToInr = parseFloat(settings['usdt_to_inr'] || settings['usdt_rate'] || String(280));

      // Flatten the data for easier access
      const order = {
        ...orderData,
        provider_id: providerId,
        provider_service_id: orderData.service?.provider_service_id,
        provider_rate: orderData.service?.provider_rate,
        provider_currency: orderData.service?.provider_currency || providerData.currency || 'USDT',
        api_url: providerData.api_url,
        api_key: providerData.api_key,
        api_version: providerData.api_version,
        wallet_balance: orderData.profile?.wallet_balance,
        usdt_to_inr: usdtToInr
      };

      if (!order.api_url || !order.api_key) {
        throw new Error("Provider API configuration missing for this order");
      }

      const adapter = ProviderAdapterFactory.getAdapter(order.api_version, order.api_url, order.api_key);

      try {
        console.log(`[placeProviderOrder] Starting order placement for order ${data.orderId}`);
        console.log(`[placeProviderOrder] Service: ${order.service_name} (ID: ${order.service_id}, ProviderServiceID: ${order.provider_service_id})`);
        console.log(`[placeProviderOrder] Provider: ${order.provider_id} (API: ${order.api_url})`);

        // 1. Verify idempotency: Ensure Provider Order ID doesn't already exist
        const { data: currentOrder, error: fetchError } = await (supabaseAdmin as any)
          .from('orders')
          .select('provider_order_id')
          .eq('id', data.orderId)
          .maybeSingle();
          
        if (fetchError) throw fetchError;
        if (currentOrder?.provider_order_id) {
          console.log(`[placeProviderOrder] Order ${data.orderId} already has provider ID ${currentOrder.provider_order_id}. Skipping duplicate submission.`);
          return JSON.stringify({ order: currentOrder.provider_order_id, message: "Order already processed" });
        }

        // 2. Double check balance to be sure (fresh read from profiles)
        const { data: freshProfile } = await (supabaseAdmin as any)
          .from('profiles')
          .select('wallet_balance')
          .eq('id', order.user_id)
          .maybeSingle();
        const walletBalance = freshProfile?.wallet_balance ?? order.wallet_balance;
        if (Number(walletBalance) < Number(order.price)) {
          console.error(`[placeProviderOrder] Insufficient balance: ${walletBalance} < ${order.price}`);
          throw new Error("Insufficient balance");
        }

        // 3. Pre-deduct balance to avoid double spending (we'll refund if provider fails)
        console.log(`[placeProviderOrder] Deducting balance: ${order.price} from ${walletBalance}`);
        const { error: deductError } = await (supabaseAdmin as any)
          .from('profiles')
          .update({ wallet_balance: Number(walletBalance) - Number(order.price) })
          .eq('id', order.user_id);
        
        if (deductError) {
          console.error(`[placeProviderOrder] Balance deduction failed: ${deductError.message}`);
          throw new Error("Balance deduction failed: " + deductError.message);
        }

        await (supabaseAdmin as any).from('provider_api_logs').insert({
          provider_id: order.provider_id,
          operation: 'add_order_attempt',
          request_payload: {
            service: order.provider_service_id,
            link: order.link,
            quantity: order.quantity
          } as any,
          status_code: 0,
          is_success: true
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

        const { error: updateError } = await (supabaseAdmin as any)
          .from('orders')
          .update({
            status: 'processing',
            provider_order_id: providerOrderId,
            provider_cost: providerCostInInr,
            estimated_profit: profit,
            provider_response: response as any
          })
          .eq('id', data.orderId);
        
        if (updateError) throw updateError;

        // Log transaction
        await (supabaseAdmin as any).from('wallet_transactions').insert({
          user_id: order.user_id,
          amount: -Number(order.price),
          type: 'order',
          status: 'completed',
          description: `Order #${data.orderId.slice(0, 8)} - ${order.service_name}`
        });

        await (supabaseAdmin as any).from('provider_api_logs').insert({
          provider_id: order.provider_id,
          operation: 'add_order_success',
          response_payload: response as any,
          status_code: 200,
          is_success: true
        });

        return JSON.stringify(response);

      } catch (err: any) {
        console.error("[placeProviderOrder] Error:", err.message);

        // Refund if balance was deducted but order failed (only if it wasn't a balance error itself)
        if (err.message !== "Insufficient balance" && !err.message.includes("Balance deduction failed")) {
           await (supabaseAdmin as any)
            .from('profiles')
            .update({ wallet_balance: Number(order.wallet_balance) })
            .eq('id', order.user_id);
            
           // Log refund transaction
           await (supabaseAdmin as any).from('wallet_transactions').insert({
             user_id: order.user_id,
             amount: Number(order.price),
             type: 'refund',
             status: 'completed',
             description: `Refund for failed Order #${data.orderId.slice(0, 8)}`
           });
        }

        await (supabaseAdmin as any)
          .from('orders')
          .update({
            status: 'failed',
            provider_response: { error: err.message || "Provider API error" } as any
          })
          .eq('id', data.orderId);

        await (supabaseAdmin as any).from('provider_api_logs').insert({
          provider_id: order.provider_id,
          operation: 'add_order_failed',
          response_payload: { error: err.message } as any,
          status_code: 500,
          is_success: false
        });

        throw err;
      }
    }
  });

export const syncOrderStatusInternal = createServerFn({ method: "POST" })
  .inputValidator((d: any) => d as { orderId: string })
  .handler(async (args: any) => {
    const { syncOneOrder } = await import("./sync.server");
    const res = await syncOneOrder(args.data.orderId);
    return JSON.stringify(res.provider);
  });
