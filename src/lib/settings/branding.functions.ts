import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readBranding, isAdminUser, type BrandingSettings } from "./branding.server";

export const getBranding = createServerFn({ method: "GET" }).handler(async () => {
  const branding = await readBranding();
  return JSON.stringify(branding);
});

export const adminUpdateBranding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as Partial<BrandingSettings>)
  .handler(async ({ data, context }) => {
    if (!(await isAdminUser((context as any).userId))) {
      return JSON.stringify({ success: false, message: "Admin access required" });
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const rows = [
      { key: "brand_name", value: (data.brand_name ?? "").trim() },
      { key: "logo_url", value: data.logo_url ?? "" },
      { key: "favicon_url", value: data.favicon_url ?? "" },
      { key: "whatsapp_number", value: (data.whatsapp_number ?? "").trim() },
      { key: "whatsapp_group_url", value: (data.whatsapp_group_url ?? "").trim() },
      { key: "support_email", value: (data.support_email ?? "").trim() },
      { key: "auto_refund_enabled", value: data.auto_refund_enabled === false ? "false" : "true" },
      { key: "theme", value: (data.theme || "aurora").trim() },
    ];

    const { error } = await (supabaseAdmin as any)
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });
    if (error) return JSON.stringify({ success: false, message: error.message });

    return JSON.stringify({ success: true, data: await readBranding() });
  });

export const adminUpdateCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { email?: string; password?: string })
  .handler(async ({ data, context }) => {
    const userId = (context as any).userId as string | null;
    if (!(await isAdminUser(userId))) {
      return JSON.stringify({ success: false, message: "Admin access required" });
    }

    const payload: { email?: string; password?: string } = {};
    if (data.email && data.email.trim()) payload.email = data.email.trim();
    if (data.password && data.password.length > 0) {
      if (data.password.length < 8) {
        return JSON.stringify({ success: false, message: "Password must be at least 8 characters" });
      }
      payload.password = data.password;
    }
    if (!payload.email && !payload.password) {
      return JSON.stringify({ success: false, message: "Nothing to update" });
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId as string, {
      ...payload,
      email_confirm: payload.email ? true : undefined,
    } as any);
    if (error) return JSON.stringify({ success: false, message: error.message });

    return JSON.stringify({ success: true });
  });

export const adminCancelRefundOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { orderId: string; refund?: boolean })
  .handler(async ({ data, context }) => {
    if (!(await isAdminUser((context as any).userId))) {
      return JSON.stringify({ success: false, message: "Admin access required" });
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, price, status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderErr || !order) return JSON.stringify({ success: false, message: "Order not found" });
    if (order.status === "cancelled" || order.status === "refunded") {
      return JSON.stringify({ success: false, message: "Order already cancelled" });
    }

    const branding = await readBranding();
    const shouldRefund = data.refund ?? branding.auto_refund_enabled;
    let refunded = 0;

    if (shouldRefund) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("wallet_balance")
        .eq("id", order.user_id)
        .maybeSingle();
      const current = Number((profile as any)?.wallet_balance || 0);
      refunded = Number(order.price || 0);

      await (supabaseAdmin as any)
        .from("profiles")
        .update({ wallet_balance: current + refunded })
        .eq("id", order.user_id);

      await (supabaseAdmin as any).from("wallet_transactions").insert({
        user_id: order.user_id,
        amount: refunded,
        type: "refund",
        status: "completed",
        description: `Refund for cancelled Order #${String(order.id).slice(0, 8)}`,
      });
    }

    const { error: updErr } = await (supabaseAdmin as any)
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    if (updErr) return JSON.stringify({ success: false, message: updErr.message });

    return JSON.stringify({ success: true, refunded });
  });
