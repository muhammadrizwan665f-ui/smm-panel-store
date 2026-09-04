import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function ok(data: unknown) {
  return JSON.stringify({ success: true, data });
}
function fail(message: string) {
  return JSON.stringify({ success: false, message, data: [] });
}

export const adminGetProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { id: string })
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    const { data: row, error } = await supabaseAdmin
      .from("providers")
      .select("id, name, api_url, api_version, currency, status, balance, notes, last_sync, last_balance_check, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return fail(error.message);
    return ok(row);
  });

export const adminListProviderServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => (d ?? {}) as { providerId?: string; search?: string; limit?: number })
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    let q = supabaseAdmin
      .from("provider_services")
      .select("*, provider:providers(id, name, currency)")
      .order("name", { ascending: true })
      .limit(data?.limit ?? 500);
    if (data?.providerId) q = q.eq("provider_id", data.providerId);
    if (data?.search) q = q.ilike("name", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) return fail(error.message);
    return ok(rows ?? []);
  });

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabaseAdmin = await adminClient();
    const { data, error } = await supabaseAdmin
      .from("service_categories")
      .select("*")
      .eq("service_type", "api")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) return fail(error.message);
    return ok(data ?? []);
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { id?: string; name: string; icon?: string; status?: string })
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    const payload = { name: data.name, icon: data.icon ?? null, status: data.status ?? "active" };
    const { error } = data.id
      ? await supabaseAdmin.from("service_categories").update(payload as any).eq("id", data.id)
      : await supabaseAdmin.from("service_categories").insert(payload as any);
    if (error) return fail(error.message);
    return ok(true);
  });

export const adminSaveService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { id: string; icon?: string; status?: string; name?: string; category_id?: string; discount_percent?: number })
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    const { id, ...payload } = data;
    const { error } = await supabaseAdmin.from("services").update(payload).eq("id", id);
    if (error) return fail(error.message);
    return ok(true);
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { id: string })
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    const { error } = await supabaseAdmin.from("service_categories").delete().eq("id", data.id);
    if (error) return fail(error.message);
    return ok(true);
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabaseAdmin = await adminClient();
    
    // 1. Fetch profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, mobile_number, wallet_balance, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
      
    if (profileError) return fail(profileError.message);
    if (!profiles) return ok([]);

    // 2. Fetch auth user emails using service role
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    const emailMap: Record<string, string> = {};
    if (!authError && authUsers?.users) {
      authUsers.users.forEach(u => {
        if (u.email) emailMap[u.id] = u.email;
      });
    }

    // 3. Merge
    const merged = profiles.map(p => ({
      ...p,
      email: emailMap[p.id] || null
    }));

    return ok(merged);
  });

export const adminImpersonateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ userId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    
    // Safety check: is the targeted user a real user?
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (userError || !user?.user) return fail("User not found");

    // Generate a magic link / recovery link that we can extract tokens from
    // or just generate a login link. generateLink is the most flexible.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.user.email!,
    });

    if (linkError) return fail(linkError.message);

    // Extract tokens from the generated URL
    const url = new URL(linkData.properties.action_link);
    const hash = url.hash.substring(1); // remove #
    const params = new URLSearchParams(hash);
    
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (!access_token || !refresh_token) {
      return fail("Failed to generate impersonation tokens");
    }

    return ok({ access_token, refresh_token });
  });

export const adminListTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabaseAdmin = await adminClient();
    const { data, error } = await supabaseAdmin
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return fail(error.message);
    const rows = data ?? [];
    const ids = [...new Set(rows.map((r: any) => r.user_id).filter(Boolean))];
    let profiles: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, mobile_number").in("id", ids);
      (profs ?? []).forEach((p: any) => { profiles[p.id] = p; });
    }
    return ok(rows.map((r: any) => ({ ...r, profile: profiles[r.user_id] ?? null })));
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabaseAdmin = await adminClient();
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, service:services(name)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return fail(error.message);
    const rows = data ?? [];
    const ids = [...new Set(rows.map((r: any) => r.user_id).filter(Boolean))];
    let profiles: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, mobile_number").in("id", ids);
      (profs ?? []).forEach((p: any) => { profiles[p.id] = p; });
    }
    return ok(rows.map((r: any) => ({ ...r, user: profiles[r.user_id] ?? null })));
  });

export const adminListApiLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabaseAdmin = await adminClient();
    const { data, error } = await supabaseAdmin
      .from("provider_api_logs")
      .select("id, operation, status_code, is_success, created_at, provider:providers(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return fail(error.message);
    return ok(data ?? []);
  });

export const adminGetReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabaseAdmin = await adminClient();
    const counts = async (table: string) => {
      const { count, error } = await (supabaseAdmin.from(table as any) as any).select("*", { count: "exact", head: true });
      if (error) throw new Error(`${table}: ${error.message}`);
      return count ?? 0;
    };
    try {
      const [users, services, providerServices, providers, orders, categories] = await Promise.all([
        counts("profiles"),
        counts("services"),
        counts("provider_services"),
        counts("providers"),
        counts("orders"),
        counts("service_categories"),
      ]);
      const { data: orderRows, error } = await supabaseAdmin
        .from("orders")
        .select("price, provider_cost, status")
        .limit(2000);
      if (error) throw new Error(error.message);
      const revenue = (orderRows ?? []).reduce((s, o: any) => s + Number(o.price || 0), 0);
      const cost = (orderRows ?? []).reduce((s, o: any) => s + Number(o.provider_cost || 0), 0);
      return ok({ users, services, providerServices, providers, orders, categories, revenue, cost, profit: revenue - cost });
    } catch (e: any) {
      return fail(e.message);
    }
  });

export const adminGetMapping = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabaseAdmin = await adminClient();
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("id, name, status, provider_service_id, provider:providers(id, name), category:service_categories(id, name)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return fail(error.message);
    return ok(data ?? []);
  });

export const adminListSiteSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabaseAdmin = await adminClient();
    const { data, error } = await supabaseAdmin.from("site_settings").select("*").order("key");
    if (error) return fail(error.message);
    return ok(data ?? []);
  });

export const adminDeleteProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    
    // 1. Deactivate all services linked to this provider first for safety
    await (supabaseAdmin
      .from('services')
      .update({ status: 'inactive' } as any) as any)
      .eq(('provider_id' as any), data.id);
      
    // 2. Delete the provider
    const { error } = await supabaseAdmin
      .from("providers")
      .delete()
      .eq("id", data.id);
      
    if (error) return fail(error.message);
    return ok(true);
  });

export const adminUpdateProviderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ id: z.string(), status: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    
    const { error } = await supabaseAdmin
      .from("providers")
      .update({ status: data.status })
      .eq(('id' as any), data.id);
      
    // If provider is deactivated, deactivate its services too
    if (data.status === 'inactive') {
      await (supabaseAdmin
        .from('services')
        .update({ status: 'inactive' } as any) as any)
        .eq(('provider_id' as any), data.id);
    }
    
    if (error) return fail(error.message);
    return ok(true);
  });

export const adminBulkUpdateCategoryIcons = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ icon: z.string(), categoryIds: z.array(z.string()).optional() }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    
    let query = supabaseAdmin.from("service_categories").update({ icon: data.icon });
    
    if (data.categoryIds && data.categoryIds.length > 0) {
      query = query.in("id", data.categoryIds);
    } else {
      // If no IDs provided, update all active categories
      query = query.eq("status", "active");
    }
    
    const { error } = await query;
    if (error) return fail(error.message);
    return ok(true);
  });

export const adminAdjustWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ userId: z.string(), amount: z.number(), type: z.enum(['add', 'cut']), description: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("wallet_balance")
      .eq("id", data.userId)
      .single();
      
    if (fetchError) return fail(fetchError.message);
    
    const currentBalance = Number(profile.wallet_balance || 0);
    const adjustment = data.type === 'add' ? data.amount : -data.amount;
    const newBalance = currentBalance + adjustment;
    
    if (newBalance < 0 && data.type === 'cut') {
      return fail("Insufficient balance to deduct this amount.");
    }
    
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ wallet_balance: newBalance })
      .eq("id", data.userId);
      
    if (updateError) return fail(updateError.message);
    
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: data.userId,
      amount: adjustment,
      type: data.type === 'add' ? 'deposit' : 'manual_adjustment',
      status: 'completed',
      description: data.description || `Admin ${data.type} adjustment`
    });
    
    return ok({ newBalance });
  });


