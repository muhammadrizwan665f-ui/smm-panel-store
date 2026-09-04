import { createServerFn } from "@tanstack/react-start";

// Public, read-only catalogue. Only customer-facing columns are ever returned —
// internal cost/margin fields (provider_cost, provider_rate, markup_amount,
// profit_value, normalized_usdt_cost, provider ids) are never exposed.
const PUBLIC_SERVICE_COLUMNS =
  "id, category_id, name, description, price_per_1000, min_quantity, max_quantity, status, icon, discount_percent, created_at";

export const listPublicServices = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("services")
    .select(PUBLIC_SERVICE_COLUMNS)
    .eq("status", "active")
    .eq("service_type", "api")
    .order("name", { ascending: true })
    .limit(2000);

  if (error) {
    console.error("[services] public catalogue read failed:", error.message);
    return JSON.stringify({ success: false, data: [] });
  }

  return JSON.stringify({ success: true, data: data ?? [] });
});
