import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ProviderAdapterFactory } from "./generic-adapter";
import { DEFAULT_EXCHANGE_RATE, DEFAULT_CUSTOMER_CURRENCY, DEFAULT_PRICE_ROUNDING } from "../currency.constants";

// TanStack Start / Seroval serialization workaround:
// We return a simple string and handle parsing on the client to avoid "All object keys match" errors.

export const listProviders = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    
    // Unified table name: 'providers'
    const { data, error } = await supabaseAdmin
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("listProviders error:", error);
      return JSON.stringify({ 
        error: error.message, 
        data: []
      });
    }

    return JSON.stringify(data || []);
  });

export const addProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as {
    name: string;
    apiUrl: string;
    apiKey: string;
    apiVersion?: string;
    currency: string;
    notes?: string;
  })
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    
    const apiVersion = data.apiVersion || 'v2';
    const notes = data.notes || '';
    
    console.log("addProvider handler called with:", { ...data, apiKey: '[REDACTED]' });

    // Unified table name: 'providers'
    const { data: result, error } = await supabaseAdmin
      .from('providers')
      .insert({
        name: data.name,
        api_url: data.apiUrl,
        api_key: data.apiKey,
        api_version: apiVersion,
        currency: data.currency,
        notes: notes,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) {
      console.error("addProvider insertion error:", error);
      return JSON.stringify({ error: error.message });
    }
    
    console.log("addProvider success result:", result);
    return JSON.stringify({ success: true, id: result?.id });
  });

export const testConnection = createServerFn({ method: "POST" })
  .inputValidator((d: any) => d as { 
    apiUrl: string; 
    apiKey: string;
    apiVersion?: string;
  })
  .handler(async ({ data, context }) => {
    try {
      // Logic for TEST MODE vs REAL API
      if (data.apiKey === 'TEST_KEY_ONLY' || data.apiUrl.includes('example.com')) {
        // Internal integration test simulation
        if (!data.apiUrl) throw new Error("API URL is required");
        if (!data.apiVersion) throw new Error("API Version is required");
        
        return JSON.stringify({ 
          success: true, 
          message: "Test Configuration Successful (Mock Mode)" 
        });
      }
 
      console.log(`Testing connection for ${data.apiUrl} (Version: ${data.apiVersion})`);
      const adapter = ProviderAdapterFactory.getAdapter(data.apiVersion || 'v2', data.apiUrl, data.apiKey);
      const balance = await adapter.getBalance();
      console.log("Connection test balance result:", balance);
      
      // Some adapters return balance as a direct property, others wrap it
      if (balance && (balance.balance !== undefined || (typeof balance === 'object' && !(balance as any).error))) {
        return JSON.stringify({ success: true, message: `Connection Successful! Balance: ${balance.currency || ''} ${balance.balance}` });
      } else {
        throw new Error((balance as any)?.error || "Invalid response from provider API");
      }
    } catch (error: any) {
      console.error("Connection test error:", error);
      return JSON.stringify({ success: false, message: error.message || "Connection Failed" });
    }
  });

export const getProviderBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { providerId: string })
  .handler(async ({ data, context }: { data: { providerId: string }; context: any }) => {
    const supabaseAdmin = (context as any)?.supabase;

    const { data: provider, error: pError } = await supabaseAdmin
      .from('providers')
      .select('api_url, api_key, api_version, currency')
      .eq('id', data.providerId)
      .single();

    if (pError || !provider) throw new Error("Provider not found");
    
    // Check for API configuration
    if (!provider.api_url || !provider.api_key || provider.api_key === 'TEST_KEY_ONLY') {
      return JSON.stringify({ 
        balance: 0, 
        currency: provider.currency || 'PKR',
        error: "Provider API is not configured yet." 
      });
    }
    
    const { data: settings } = await supabaseAdmin.from('site_settings').select('key, value').eq('key', 'usdt_rate').maybeSingle();
    const effectiveRate = parseFloat(settings?.value || String(DEFAULT_EXCHANGE_RATE));
    const adapter = ProviderAdapterFactory.getAdapter(provider.api_version || 'v2', provider.api_url || '', provider.api_key || '');
    const balanceInfo = await adapter.getBalance();
    
    // Robust balance parsing (strip currency symbols, commas, etc)
    let balanceValue = 0;
    if (balanceInfo && balanceInfo.balance) {
      const cleanBalance = String(balanceInfo.balance).replace(/[^\d.-]/g, '');
      balanceValue = parseFloat(cleanBalance) || 0;
    }

    await supabaseAdmin
      .from('providers')
      .update({ 
        balance: balanceValue, 
        last_balance_check: new Date().toISOString() 
      })
      .eq('id', data.providerId);
      
    return JSON.stringify({ 
      balance: (balanceValue * (String(balanceInfo.currency || provider.currency || 'USDT') === 'PKR' || String(balanceInfo.currency || provider.currency || 'USDT') === 'PKR' ? 1 : effectiveRate)).toString(), 
      currency: 'BASE' 


    });
  });

export const getProviderServices = createServerFn({ method: "POST" })
  .inputValidator((d: any) => z.object({ providerId: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;

    const { data: provider, error: pError } = await supabaseAdmin
      .from('providers')
      .select('id, name, api_url, api_key, api_version, currency')
      .eq('id', data.providerId)
      .single();

    if (pError || !provider) {
      return JSON.stringify({ success: false, message: `Provider not found: ${pError?.message || 'no row'}` });
    }

    if (!provider.api_url || !provider.api_key || provider.api_key === 'TEST_KEY_ONLY') {
      return JSON.stringify({ success: false, message: "Provider API is not configured (missing URL or API key)." });
    }

    let host = provider.api_url;
    try { host = new URL(provider.api_url).host; } catch { /* keep raw */ }

    const diag = {
      provider: provider.name,
      providerId: provider.id,
      host,
      version: provider.api_version || 'v2',
      method: 'POST',
      operation: 'services',
      at: new Date().toISOString(),
    };
    console.log("[FETCH SERVICES] request", diag);

    // ---- 1. Real HTTP call to the provider ----
    let raw: any;
    try {
      const adapter = ProviderAdapterFactory.getAdapter(
        provider.api_version || 'v2',
        provider.api_url,
        provider.api_key,
      );
      raw = await adapter.getServices();
      console.log(`[FETCH SERVICES] Received ${Array.isArray(raw) ? raw.length : 'object'} response from ${host}`);
    } catch (error: any) {
      console.error("[FETCH SERVICES] provider request failed", { ...diag, error: error?.message });
      return JSON.stringify({
        success: false,
        stage: 'provider_request',
        diagnostics: diag,
        message: error?.message || "Provider request failed",
      });
    }

    // ---- 2. Normalise the response shape ----
    let list: any[] | null = null;
    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && typeof raw === 'object') {
      // Check common wrappers
      if (Array.isArray(raw.services)) list = raw.services;
      else if (Array.isArray(raw.data)) list = raw.data;
      else if (Array.isArray(raw.result)) list = raw.result;
      else if (Array.isArray(raw.list)) list = raw.list;
      else {
        // Some providers return an object where keys are service IDs
        const values = Object.values(raw);
        if (values.length && values.every((v: any) => v && typeof v === 'object' && (v.service || v.id || v.name))) {
          list = values;
        }
      }
    }

    if (!list) {
      const preview = typeof raw === 'string' ? raw.slice(0, 300) : JSON.stringify(raw)?.slice(0, 300);
      console.error("[FETCH SERVICES] unrecognised response shape", { ...diag, preview });
      return JSON.stringify({
        success: false,
        stage: 'parse',
        diagnostics: diag,
        message: `Provider returned an unrecognised services format. Response preview: ${preview}`,
      });
    }

    // ---- 3. Map provider fields ----
    const rows = list
      .map((s: any) => {
        const providerServiceId = s.service ?? s.id ?? s.service_id ?? s.serviceId;
        if (providerServiceId === undefined || providerServiceId === null) return null;
        
        // Ensure values are numbers and have defaults
        const rate = Number(s.rate ?? s.price ?? 0);
        const min = parseInt(String(s.min ?? s.min_order ?? 0), 10);
        const max = parseInt(String(s.max ?? s.max_order ?? 0), 10);
        
        return {
          provider_id: provider.id,
          provider_service_id: String(providerServiceId),
          name: String(s.name ?? s.service_name ?? `Service ${providerServiceId}`),
          category: String(s.category ?? s.category_name ?? 'Uncategorized'),
          type: s.type ? String(s.type) : 'default',
          provider_cost: isNaN(rate) ? 0 : rate,
          provider_min: isNaN(min) ? 0 : min,
          provider_max: isNaN(max) ? 0 : max,
          refill: s.refill === true || s.refill === 1 || String(s.refill).toLowerCase() === 'yes',
          cancel: s.cancel === true || s.cancel === 1 || String(s.cancel).toLowerCase() === 'yes',
          status: 'active',
          last_synced_at: new Date().toISOString(),
          provider_currency: provider.currency || 'USDT',
        };
      })
      .filter(Boolean) as any[];

    // ---- 4. Persist (upsert on provider_id + provider_service_id) ----
    let stored = 0;
    const dbErrors: string[] = [];
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error, count } = await supabaseAdmin
        .from('provider_services')
        .upsert(chunk, { onConflict: 'provider_id,provider_service_id', count: 'exact' });
      if (error) {
        console.error("[FETCH SERVICES] db upsert error", { ...diag, error: error.message });
        dbErrors.push(error.message);
      } else {
        stored += count ?? chunk.length;
      }
    }

    if (dbErrors.length) {
      return JSON.stringify({
        success: false,
        stage: 'database',
        diagnostics: diag,
        received: rows.length,
        stored,
        message: `Database error: ${dbErrors[0]}`,
      });
    }

    await supabaseAdmin
      .from('providers')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', provider.id);

    console.log("[FETCH SERVICES] done", { ...diag, received: rows.length, stored });
    return JSON.stringify({
      success: true,
      diagnostics: diag,
      received: rows.length,
      stored,
      count: stored,
    });
  });

export const recalculateServicePrices = createServerFn({ method: "POST" })
  .inputValidator((d: any) => d as { 
    serviceIds?: string[]; // If empty, all services
    providerId?: string; // If provided, filter by provider
  })
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;

    // 1. Fetch settings
    const { data: settingsData } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', ['usdt_rate', 'customer_currency', 'price_rounding', 'usdt_to_inr']);
    
    const settings: Record<string, string> = {};
    settingsData?.forEach((item: any) => { settings[item.key] = item.value || ''; });
    
    const usdtExchangeRate = parseFloat(settings['usdt_rate'] || String(DEFAULT_EXCHANGE_RATE));
    const customerCurrency = settings['customer_currency'] || DEFAULT_CUSTOMER_CURRENCY;
    const roundingMethod = settings['price_rounding'] || DEFAULT_PRICE_ROUNDING;
    const usdtToInr = parseFloat(settings['usdt_to_inr'] || String(DEFAULT_EXCHANGE_RATE));

    // 2. Fetch services to recalculate
    let query = supabaseAdmin.from('services').select('*');
    if (data.serviceIds && data.serviceIds.length > 0) {
      query = query.in('id', data.serviceIds);
    }
    if (data.providerId) {
      query = query.eq('provider_id', data.providerId);
    }
    const { data: services, error } = await query;
    if (error) throw new Error(error.message);
    if (!services || services.length === 0) return JSON.stringify({ success: true, count: 0, message: "No services found to recalculate." });

    let updatedCount = 0;
    for (const service of services) {
      const providerRate = Number(service.provider_rate);
      const providerCurrency = service.provider_currency || 'USDT';
      const markupType = service.markup_type || 'percentage';
      const markupAmount = Number(service.markup_amount || 0);

      // Normalization Logic
      let usdtCost = providerRate;
      if (providerCurrency === 'PKR' || providerCurrency === 'PKR') {
        usdtCost = providerRate / usdtToInr;
      } else if (providerCurrency === 'USD' || providerCurrency === 'USDT') {
        usdtCost = providerRate; 
      } else {
        usdtCost = providerRate;
      }
      
      const internalCost = usdtCost * usdtExchangeRate;

      let customerPrice = internalCost;
      if (markupType === 'percentage') {
        customerPrice = internalCost * (1 + markupAmount / 100);
      } else {
        customerPrice = internalCost + markupAmount;
      }

      // Rounding
      if (roundingMethod === 'whole') customerPrice = Math.round(customerPrice);
      else if (roundingMethod === 'nearest_5') customerPrice = Math.round(customerPrice / 5) * 5;
      else if (roundingMethod === 'nearest_10') customerPrice = Math.round(customerPrice / 10) * 10;
      else customerPrice = Math.round(customerPrice * 100) / 100;

      await supabaseAdmin
        .from('services')
        .update({
          price_per_1000: customerPrice,
          customer_rate: customerPrice,
          usdt_rate_at_calculation: usdtExchangeRate,
          normalized_usdt_cost: usdtCost,
          customer_currency: customerCurrency,
          converted_cost: internalCost,
          customer_price: customerPrice,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', service.id);
      
      updatedCount++;
    }

    return JSON.stringify({ success: true, count: updatedCount, message: `Recalculated prices for ${updatedCount} services.` });
  });
