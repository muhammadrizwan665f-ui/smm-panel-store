import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEFAULT_CUSTOMER_CURRENCY, DEFAULT_EXCHANGE_RATE, DEFAULT_PRICE_ROUNDING } from "./currency.constants";


export const getCurrencySettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['customer_currency', 'usdt_rate', 'price_rounding', 'usdt_to_inr', 'currency_symbol', 'currency_code']);

    if (error) throw new Error(error.message);

    const settings: Record<string, string> = {};
    data.forEach(item => {
      settings[item.key] = item.value || '';
    });

    return JSON.stringify({
      customer_currency: settings['customer_currency'] || DEFAULT_CUSTOMER_CURRENCY,
      usdt_rate: settings['usdt_rate'] || String(DEFAULT_EXCHANGE_RATE),
      price_rounding: settings['price_rounding'] || DEFAULT_PRICE_ROUNDING,
      usdt_to_inr: settings['usdt_to_inr'] || String(DEFAULT_EXCHANGE_RATE),
      currency_symbol: settings['currency_symbol'] || '',
      currency_code: settings['currency_code'] || DEFAULT_CUSTOMER_CURRENCY
    });
  });

export const updateCurrencySettings = createServerFn({ method: "POST" })
  .inputValidator((d: any) => d as {
    customer_currency: string;
    usdt_rate: string;
    price_rounding: string;
    usdt_to_inr?: string;
    currency_symbol?: string;
    currency_code?: string;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const updates = [
      { key: 'customer_currency', value: data.customer_currency },
      { key: 'usdt_rate', value: data.usdt_rate },
      { key: 'price_rounding', value: data.price_rounding },
      { key: 'usdt_to_inr', value: data.usdt_to_inr || String(DEFAULT_EXCHANGE_RATE) },
      { key: 'currency_symbol', value: data.currency_symbol || '' },
      { key: 'currency_code', value: data.currency_code || data.customer_currency }
    ];

    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) throw new Error(error.message);

    return JSON.stringify({ success: true });
  });
