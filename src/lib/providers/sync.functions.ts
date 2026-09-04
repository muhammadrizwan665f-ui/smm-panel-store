import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Syncs the signed-in user's pending API orders with their providers. */
export const syncMyOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { syncPendingOrders } = await import("./sync.server");
      const res = await syncPendingOrders({ userId: context.userId as string, limit: 15 });
      return JSON.stringify({ success: true, data: res });
    } catch (e: any) {
      return JSON.stringify({ success: false, message: e?.message ?? "Sync failed" });
    }
  });

/** Admin-wide sync of all pending API orders. */
export const syncAllOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId as string,
      _role: "admin",
    });
    if (!isAdmin) return JSON.stringify({ success: false, message: "Forbidden" });

    try {
      const { syncPendingOrders } = await import("./sync.server");
      const res = await syncPendingOrders({ limit: 40 });
      return JSON.stringify({ success: true, data: res });
    } catch (e: any) {
      return JSON.stringify({ success: false, message: e?.message ?? "Sync failed" });
    }
  });
