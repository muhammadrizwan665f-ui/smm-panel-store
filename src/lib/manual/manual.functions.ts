import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MANUAL_PUBLIC_COLUMNS =
  "id, category_id, name, description, fixed_price, allow_quantity, status, icon, created_at";

function ok(data: unknown) {
  return JSON.stringify({ success: true, data });
}
function fail(message: string) {
  return JSON.stringify({ success: false, message, data: null });
}

async function assertAdmin(context: any) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

/* ---------------- Public catalogue ---------------- */

export const listManualCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase: supabaseAdmin } = await import("@/integrations/supabase/client");

  const [{ data: cats }, { data: svcs }] = await Promise.all([
    supabaseAdmin
      .from("service_categories")
      .select("id, name, icon, display_order, status")
      .eq("service_type", "manual")
      .eq("status", "active")
      .order("display_order", { ascending: true }),
    supabaseAdmin
      .from("services")
      .select(MANUAL_PUBLIC_COLUMNS)
      .eq("service_type", "manual")
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  return ok({ categories: cats ?? [], services: svcs ?? [] });
});

/* ---------------- User order ---------------- */

export const createManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z
      .object({
        serviceId: z.string(),
        whatsapp: z.string().min(6),
        quantity: z.number().int().positive().optional(),
        note: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabase = (context as any)?.supabase;

    const { data: result, error } = await supabase.rpc("rpc_create_manual_order", {
      _service_id: data.serviceId,
      _whatsapp: data.whatsapp,
      _quantity: data.quantity ?? 1,
      _note: data.note ?? null,
    });

    if (error) return fail(error.message);

    return ok({ orderId: result.orderId, total: result.total });
  });

/* ---------------- Admin: catalogue management ---------------- */

export const adminListManualCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const [{ data: cats }, { data: svcs }] = await Promise.all([
      supabaseAdmin
        .from("service_categories")
        .select("*")
        .eq("service_type", "manual")
        .order("display_order", { ascending: true }),
      supabaseAdmin
        .from("services")
        .select("*")
        .eq("service_type", "manual")
        .order("created_at", { ascending: false }),
    ]);
    return ok({ categories: cats ?? [], services: svcs ?? [] });
  });

export const adminSaveManualCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z
      .object({
        id: z.string().optional(),
        name: z.string().min(1),
        icon: z.string().optional().nullable(),
        status: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const payload: any = {
      name: data.name,
      icon: data.icon || null,
      status: data.status ?? "active",
      service_type: "manual",
    };
    const { error } = data.id
      ? await supabaseAdmin.from("service_categories").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("service_categories").insert(payload);
    if (error) return fail(error.message);
    return ok(true);
  });

export const adminDeleteManualCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const { error } = await supabaseAdmin
      .from("service_categories")
      .delete()
      .eq("id", data.id)
      .eq("service_type", "manual");
    if (error) return fail(error.message);
    return ok(true);
  });

export const adminSaveManualService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z
      .object({
        id: z.string().optional(),
        category_id: z.string(),
        name: z.string().min(1),
        description: z.string().optional().nullable(),
        icon: z.string().optional().nullable(),
        fixed_price: z.number().nonnegative(),
        allow_quantity: z.boolean().optional(),
        status: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const payload: any = {
      category_id: data.category_id,
      name: data.name,
      description: data.description || null,
      icon: data.icon || null,
      fixed_price: data.fixed_price,
      allow_quantity: data.allow_quantity ?? false,
      status: data.status ?? "active",
      service_type: "manual",
      // legacy required columns on the shared services table
      price_per_1000: data.fixed_price,
      min_quantity: 1,
      max_quantity: 1000,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("services").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("services").insert(payload);
    if (error) return fail(error.message);
    return ok(true);
  });

export const adminDeleteManualService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const { error } = await supabaseAdmin
      .from("services")
      .delete()
      .eq("id", data.id)
      .eq("service_type", "manual");
    if (error) return fail(error.message);
    return ok(true);
  });

/* ---------------- Admin: fulfilment queue ---------------- */

export const adminListManualOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_type", "manual")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return fail(error.message);

    const rows = data ?? [];
    const ids = [...new Set(rows.map((r: any) => r.user_id).filter(Boolean))];
    const profiles: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, mobile_number")
        .in("id", ids);
      (profs ?? []).forEach((p: any) => {
        profiles[p.id] = p;
      });
    }
    return ok(rows.map((r: any) => ({ ...r, user: profiles[r.user_id] ?? null })));
  });

export const adminUpdateManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({ id: z.string(), action: z.enum(["deliver", "refund"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, price, status, service_name, order_type")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return fail(error.message);
    if (!order || (order as any).order_type !== "manual") return fail("Order not found");

    if (data.action === "deliver") {
      const { error: upErr } = await supabaseAdmin
        .from("orders")
        .update({ status: "completed" })
        .eq("id", order.id);
      if (upErr) return fail(upErr.message);
      return ok(true);
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      return fail("This order is already refunded.");
    }

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("wallet_balance")
      .eq("id", order.user_id)
      .single();
    if (profErr) return fail(profErr.message);

    const newBalance = Number(profile.wallet_balance || 0) + Number(order.price || 0);
    const { error: refErr } = await supabaseAdmin
      .from("profiles")
      .update({ wallet_balance: newBalance })
      .eq("id", order.user_id);
    if (refErr) return fail(refErr.message);

    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: order.user_id,
      amount: Number(order.price || 0),
      type: "refund",
      status: "completed",
      description: `Refund for manual order: ${order.service_name}`,
    });

    const { error: upErr } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    if (upErr) return fail(upErr.message);

    return ok(true);
  });
