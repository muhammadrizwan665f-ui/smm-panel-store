import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Current user's referral code, referrals list and paid commissions. */
export const getMyReferral = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const userId = context.userId as string;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, referral_code")
      .eq("id", userId)
      .maybeSingle();

    let code = (profile as any)?.referral_code as string | null | undefined;
    if (!code) {
      const generated = `REF-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
      await supabaseAdmin.from("profiles").update({ referral_code: generated } as any).eq("id", userId);
      code = generated;
    }

    const { data: referrals } = await supabaseAdmin
      .from("profiles")
      .select("id, mobile_number, created_at")
      .eq("referred_by" as any, userId)
      .order("created_at", { ascending: false })
      .limit(200);

    const { data: commissions } = await supabaseAdmin
      .from("referral_commissions" as any)
      .select("id, amount, note, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    const earnings = (commissions ?? []).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);

    return JSON.stringify({
      code,
      referrals: referrals ?? [],
      commissions: commissions ?? [],
      totalReferrals: (referrals ?? []).length,
      totalEarnings: earnings,
    });
  });

/** Admin: all referrals + commissions overview. */
export const adminListReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return JSON.stringify({ success: false, message: "Forbidden", data: [] });

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, mobile_number, referral_code, referred_by, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    const { data: commissions } = await supabaseAdmin
      .from("referral_commissions" as any)
      .select("id, referrer_id, referred_id, amount, note, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const byId: Record<string, any> = {};
    (profiles ?? []).forEach((p: any) => { byId[p.id] = p; });

    const rows = (profiles ?? [])
      .filter((p: any) => p.referred_by)
      .map((p: any) => ({
        referred_id: p.id,
        referred_mobile: p.mobile_number,
        joined_at: p.created_at,
        referrer_id: p.referred_by,
        referrer_mobile: byId[p.referred_by]?.mobile_number ?? "-",
        paid: (commissions ?? [])
          .filter((c: any) => c.referred_id === p.id)
          .reduce((s: number, c: any) => s + Number(c.amount || 0), 0),
      }));

    return JSON.stringify({
      success: true,
      data: {
        rows,
        commissions: (commissions ?? []).map((c: any) => ({
          ...c,
          referrer_mobile: byId[c.referrer_id]?.mobile_number ?? "-",
          referred_mobile: c.referred_id ? byId[c.referred_id]?.mobile_number ?? "-" : "-",
        })),
      },
    });
  });

/** Admin: pay a manual commission (credits the referrer's wallet). */
export const adminPayCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z
      .object({
        referrerId: z.string().uuid(),
        referredId: z.string().uuid().optional(),
        amount: z.number().positive().max(1_000_000),
        note: z.string().max(300).optional(),
        creditWallet: z.boolean().optional(),
      })
      .parse(d?.data ?? d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return JSON.stringify({ success: false, message: "Forbidden" });

    const supabaseAdmin = (context as any)?.supabase;

    const { error } = await supabaseAdmin.from("referral_commissions" as any).insert({
      referrer_id: data.referrerId,
      referred_id: data.referredId ?? null,
      amount: data.amount,
      note: data.note ?? "Manual referral commission",
    } as any);
    if (error) return JSON.stringify({ success: false, message: error.message });

    if (data.creditWallet !== false) {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("wallet_balance")
        .eq("id", data.referrerId)
        .maybeSingle();
      const newBalance = Number(prof?.wallet_balance || 0) + data.amount;
      await supabaseAdmin.from("profiles").update({ wallet_balance: newBalance }).eq("id", data.referrerId);
      await supabaseAdmin.from("wallet_transactions").insert({
        user_id: data.referrerId,
        amount: data.amount,
        type: "credit",
        status: "completed",
        description: data.note || "Referral commission",
      });
    }

    return JSON.stringify({ success: true });
  });

/** Attach a referrer to the signed-in user (once, at signup). */
export const attachReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ code: z.string().min(3).max(40) }).parse(d?.data ?? d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const userId = context.userId as string;

    const { data: me } = await supabaseAdmin
      .from("profiles")
      .select("id, referred_by")
      .eq("id", userId)
      .maybeSingle();
    if (!me || (me as any).referred_by) return JSON.stringify({ success: false });

    const { data: referrer } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code" as any, data.code.trim().toUpperCase())
      .maybeSingle();
    if (!referrer || referrer.id === userId) return JSON.stringify({ success: false });

    await supabaseAdmin.from("profiles").update({ referred_by: referrer.id } as any).eq("id", userId);
    return JSON.stringify({ success: true });
  });
