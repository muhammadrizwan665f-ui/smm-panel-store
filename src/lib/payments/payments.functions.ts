import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestUrl } from "@tanstack/react-start/server";

function ok(data: unknown) {
  return JSON.stringify({ success: true, data });
}
function fail(message: string) {
  return JSON.stringify({ success: false, message, data: null });
}

/** The callback URL is always system-generated from the deployment origin. */
function callbackUrlFor(_gateway: unknown) {
  let origin = "";
  try {
    origin = new URL(getRequestUrl()).origin;
  } catch {
    origin = "";
  }
  return `${origin}/api/public/payments/bharatpay/callback`;
}

async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: String(context.userId),
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

const gatewaySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  provider: z.string().default("bharatpay"),
  type: z.enum(["auto", "manual"]).default("auto"),
  qr_image_url: z.string().nullable().optional(),
  merchant_id: z.string().nullable().optional(),
  access_token: z.string().nullable().optional(),
  api_url: z.string().nullable().optional(),
  account_number: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  mobile_number: z.string().nullable().optional(),
  fee_percent: z.number().min(0).max(100).default(0),
  bonus_percent: z.number().min(0).max(100).default(0),
  bonus_start_amount: z.number().min(0).default(0),
  expiry_minutes: z.number().int().min(1).max(1440).default(30),
  instructions: z.string().nullable().optional(),
  min_amount: z.number().nonnegative().default(100),
  max_amount: z.number().positive().default(100000),
  auto_verify: z.boolean().default(true),
  status: z.enum(["active", "inactive"]).default("active"),
});


/* ---------------- ADMIN ---------------- */

export const adminListGateways = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const { data, error } = await supabaseAdmin
      .from("payment_gateways")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);
    // The access token must never reach the browser — only report whether one is stored.
    const safe = (data ?? []).map(({ access_token, ...rest }: any) => ({
      ...rest,
      has_access_token: !!access_token,
    }));
    return ok(safe);
  });

export const adminSaveGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => gatewaySchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const { id, access_token, ...rest } = data;

    const payload: Record<string, unknown> = { ...rest };
    // Blank token on edit = keep the stored one. The token never leaves the server.
    if (access_token && access_token.trim()) {
      payload['access_token'] = access_token.trim();
      payload['qr_api_url'] = null; // credentials changed -> re-resolve the endpoint
    } else if (!id) payload['access_token'] = null;

    const { error } = id
      ? await supabaseAdmin
          .from("payment_gateways")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", id)
      : await supabaseAdmin.from("payment_gateways").insert(payload);
    if (error) return fail(error.message);
    return ok(true);
  });


export const adminDeleteGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const { error } = await supabaseAdmin.from("payment_gateways").delete().eq("id", data.id);
    if (error) return fail(error.message);
    return ok(true);
  });

export const adminListDeposits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ status: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    let q = supabaseAdmin
      .from("deposit_requests")
      .select("*, gateway:payment_gateways(name, provider)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data?.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) return fail(error.message);

    const userIds = [...new Set((rows ?? []).map((r: any) => r.user_id))];
    let profiles: any[] = [];
    if (userIds.length) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("id, mobile_number, wallet_balance")
        .in("id", userIds);
      profiles = p ?? [];
    }
    const enriched = (rows ?? []).map((r: any) => ({
      ...r,
      profile: profiles.find((p) => p.id === r.user_id) ?? null,
    }));
    return ok(enriched);
  });

async function creditWallet(supabaseAdmin: any, userId: string, amount: number, description: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("wallet_balance")
    .eq("id", userId)
    .maybeSingle();
  const current = Number(profile?.wallet_balance ?? 0);
  const next = current + Number(amount);
  await supabaseAdmin.from("profiles").update({ wallet_balance: next }).eq("id", userId);
  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: userId,
    amount,
    type: "credit",
    status: "completed",
    description,
  });
  return next;
}

export const adminReviewDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({ id: z.string(), action: z.enum(["approve", "reject"]), note: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const { data: dep, error } = await supabaseAdmin
      .from("deposit_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return fail(error.message);
    if (!dep) return fail("Deposit request not found");
    if (dep.status !== "pending") return fail(`Already ${dep.status}`);

    if (data.action === "approve") {
      await creditWallet(supabaseAdmin, dep.user_id, Number(dep.amount), `Deposit approved (UTR ${dep.utr})`);
      await supabaseAdmin.from("payments").insert({
        user_id: dep.user_id,
        amount: dep.amount,
        method: "qr",
        status: "completed",
        gateway_transaction_id: dep.utr,
        reference: dep.id,
      });
    }

    await supabaseAdmin
      .from("deposit_requests")
      .update({
        status: data.action === "approve" ? "approved" : "rejected",
        admin_note: data.note ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    return ok(true);
  });

/* ---------------- USER ---------------- */

export const listActiveGateways = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const { data, error } = await supabaseAdmin
      .from("payment_gateways")
      .select(
        "id, name, provider, type, qr_image_url, instructions, min_amount, max_amount, fee_percent, bonus_percent, bonus_start_amount, expiry_minutes, merchant_id, access_token, account_number, iban, mobile_number",
      )
      .eq("status", "active")
      .order("display_order", { ascending: true });

    if (error) return fail(error.message);
    // Live QR is available whenever the merchant credentials are stored server-side.
    return ok(
      (data ?? []).map(({ access_token, merchant_id, ...g }: any) => ({
        ...g,
        qr_enabled: (!!access_token && !!merchant_id) || g.type === 'manual',
      })),
    );

  });

export const listMyDeposits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("deposit_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return fail(error.message);
    return ok(data ?? []);
  });

/* ---------------- BHARATPAYS VIRTUAL QRCODE ---------------- */

/**
 * Creates a pending deposit + asks BharatPays for a Virtual QR.
 * The QR endpoint / request body come from the admin gateway configuration,
 * so nothing about the provider contract is guessed here.
 */
export const createQrDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({ gatewayId: z.string().uuid(), amount: z.number().positive().max(1000000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const bp = await import("@/lib/payments/bharatpay.server");

    const { data: gateway } = await supabaseAdmin
      .from("payment_gateways")
      .select("*")
      .eq("id", data.gatewayId)
      .eq("status", "active")
      .maybeSingle();
    if (!gateway) return fail("Payment method unavailable");

    const amount = Math.round(data.amount * 100) / 100;
    if (amount < Number(gateway.min_amount) || amount > Number(gateway.max_amount)) {
      return fail(`Amount must be between ${gateway.min_amount} and ${gateway.max_amount}`);
    }
    const gatewayType = gateway.type === "manual" ? "manual" : "auto";
    if (gatewayType === "auto" && (!gateway.access_token || !gateway.merchant_id)) {
      return fail("This payment method is not configured yet. Please contact support.");
    }
    if (
      gatewayType === "manual" &&
      !gateway.qr_image_url &&
      !gateway.account_number &&
      !gateway.iban &&
      !gateway.mobile_number
    ) {
      return fail("This payment method is not configured yet. Please contact support.");
    }

    const referenceId = bp.buildReferenceId();
    const expiryMinutes = Number(gateway.expiry_minutes ?? 30);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60_000).toISOString();

    const { data: deposit, error: insertError } = await supabaseAdmin
      .from("deposit_requests")
      .insert({
        user_id: String(context.userId),
        gateway_id: gateway.id,
        amount,
        currency: "PKR",
        reference_id: referenceId,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("*")
      .single();
    if (insertError) return fail(insertError.message);

    if (gatewayType === "manual") {
      return ok({
        depositId: deposit.id,
        referenceId,
        amount,
        expiresAt,
        instructions: gateway.instructions ?? null,
        type: "manual",
      });
    }

    const callbackUrl = callbackUrlFor(gateway);
    const fields = bp.qrRequestFields({
      referenceId,
      amount,
      merchantId: String(gateway.merchant_id),
      callbackUrl,
    });

    const resolved = await bp.resolveEndpoint({
      cached: gateway.qr_api_url,
      candidates: bp.QR_CREATE_CANDIDATES,
      token: String(gateway.access_token),
      fields,
    });
    const result =
      resolved.result ??
      ({ ok: false, httpStatus: null, body: null, raw: "", message: "BharatPays Virtual QRCODE endpoint did not respond", durationMs: 0 } as any);

    if (resolved.url && result.isApiRoute && resolved.url !== gateway.qr_api_url) {
      await supabaseAdmin.from("payment_gateways").update({ qr_api_url: resolved.url }).eq("id", gateway.id);
    }

    await bp.logGatewayCall(supabaseAdmin, {
      operation: "bharatpay:qr_create",
      request: { endpoint: resolved.url, reference_id: referenceId, amount, fields },
      response: { status: result.httpStatus, body: result.body ?? result.raw, ms: result.durationMs },
      statusCode: result.httpStatus,
      success: result.ok,
    });

    if (!result.ok) {
      await supabaseAdmin
        .from("deposit_requests")
        .update({ status: "failed", admin_note: `QR generation failed: ${result.message}` })
        .eq("id", deposit.id);
      return fail(`Could not generate payment QR: ${result.message}`);
    }

    const { qr, txnId } = bp.extractQr(result.body, null);
    if (!qr) {
      await supabaseAdmin
        .from("deposit_requests")
        .update({ status: "failed", admin_note: "Gateway response contained no QR data" })
        .eq("id", deposit.id);
      return fail("Gateway did not return a QR code. Please contact support.");
    }

    await supabaseAdmin
      .from("deposit_requests")
      .update({ qr_payload: qr, gateway_transaction_id: txnId ?? null })
      .eq("id", deposit.id);

    return ok({
      depositId: deposit.id,
      referenceId,
      amount,
      qr,
      expiresAt,
      instructions: gateway.instructions ?? null,
      type: gateway.type || "auto",
    });
  });

export const submitManualPaymentProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({ depositId: z.string().uuid(), utr: z.string().trim().min(3).max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const { data: deposit, error: lookupError } = await supabaseAdmin
      .from("deposit_requests")
      .select("id, gateway_id, status")
      .eq("id", data.depositId)
      .eq("user_id", String(context.userId))
      .maybeSingle();
    if (lookupError) return fail(lookupError.message);
    if (!deposit) return fail("Deposit request not found");
    if (deposit.status !== "pending") return fail(`Deposit is already ${deposit.status}`);

    const { data: gateway } = await supabaseAdmin
      .from("payment_gateways")
      .select("type")
      .eq("id", deposit.gateway_id)
      .maybeSingle();
    if (gateway?.type !== "manual") return fail("Payment proof is only accepted for manual payment methods");

    const { error } = await supabaseAdmin
      .from("deposit_requests")
      .update({ utr: data.utr, status: "pending" })
      .eq("id", deposit.id);
    if (error) return fail(error.message);
    return ok(true);
  });

/**
 * Status polling fallback. Reads our own record and, when a verification API URL
 * is configured, asks the gateway. Crediting only ever happens through the
 * locked, idempotent database routine.
 */
export const getDepositStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ depositId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const bp = await import("@/lib/payments/bharatpay.server");

    const { data: dep } = await supabaseAdmin
      .from("deposit_requests")
      .select("*")
      .eq("id", data.depositId)
      .eq("user_id", String(context.userId))
      .maybeSingle();
    if (!dep) return fail("Deposit not found");

    if (dep.status === "pending" && dep.expires_at && new Date(dep.expires_at) < new Date()) {
      await supabaseAdmin.from("deposit_requests").update({ status: "expired" }).eq("id", dep.id);
      return ok({ status: "expired", amount: Number(dep.amount), referenceId: dep.reference_id });
    }

    if (dep.status === "pending") {
      const { data: gateway } = await supabaseAdmin
        .from("payment_gateways")
        .select("*")
        .eq("id", dep.gateway_id)
        .maybeSingle();

      if (gateway?.auto_verify && gateway?.access_token) {
        const statusFields = {
          ref_id: dep.reference_id,
          order_id: dep.gateway_transaction_id ?? dep.reference_id,
          merchant_id: gateway.merchant_id ?? undefined,
        };
        const statusResolved = await bp.resolveEndpoint({
          cached: gateway.api_url,
          candidates: bp.QR_STATUS_CANDIDATES,
          token: String(gateway.access_token),
          fields: statusFields,
        });
        if (statusResolved.url && statusResolved.url !== gateway.api_url) {
          await supabaseAdmin.from("payment_gateways").update({ api_url: statusResolved.url }).eq("id", gateway.id);
        }
        const result =
          statusResolved.result ??
          ({ ok: false, httpStatus: null, body: null, raw: "", message: "No status endpoint responded", durationMs: 0 } as any);

        await bp.logGatewayCall(supabaseAdmin, {
          operation: "bharatpay:status_check",
          request: { endpoint: statusResolved.url, reference_id: dep.reference_id },
          response: { status: result.httpStatus, body: result.body ?? result.raw, ms: result.durationMs },
          statusCode: result.httpStatus,
          success: result.ok,
        });

        const payload: any = (result.body as any)?.data ?? result.body ?? {};
        const remoteStatus = payload?.status ? String(payload.status).toUpperCase() : null;
        if (result.ok && remoteStatus) {
          await supabaseAdmin.rpc("process_bharatpay_callback", {
            p_gateway_id: gateway.id,
            p_reference: dep.reference_id,
            p_txn_id: payload.id ? String(payload.id) : dep.gateway_transaction_id,
            p_amount: payload.amount === undefined ? null : Number(payload.amount),
            p_status: remoteStatus,
            p_bank_ref: payload.bank_ref_id ? String(payload.bank_ref_id) : null,
            p_payment_mode: payload.payment_mode ? String(payload.payment_mode) : null,
            p_vpa: payload.vpa ? String(payload.vpa) : null,
            p_va_id: payload.virtual_accounts_id ? String(payload.virtual_accounts_id) : null,
            p_payload: bp.maskSensitive(result.body) as any,
          });
        }
      }
    }

    const { data: fresh } = await supabaseAdmin
      .from("deposit_requests")
      .select("status, amount, reference_id, bank_ref_id, payment_mode, admin_note")
      .eq("id", data.depositId)
      .maybeSingle();

    return ok({
      status: fresh?.status ?? dep.status,
      amount: Number(fresh?.amount ?? dep.amount),
      referenceId: fresh?.reference_id ?? dep.reference_id,
      bankRefId: fresh?.bank_ref_id ?? null,
      paymentMode: fresh?.payment_mode ?? null,
      note: fresh?.admin_note ?? null,
    });
  });

export const cancelDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ depositId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const { error } = await supabaseAdmin
      .from("deposit_requests")
      .update({ status: "cancelled", processed_at: new Date().toISOString() })
      .eq("id", data.depositId)
      .eq("user_id", String(context.userId))
      .eq("status", "pending");
    if (error) return fail(error.message);
    return ok(true);
  });

/**
 * Real server-side authenticated call against the BharatPays API using only the
 * stored Merchant ID + Access Token. The token is never echoed back.
 */
export const adminTestGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = (context as any)?.supabase;
    const bp = await import("@/lib/payments/bharatpay.server");

    const { data: gateway } = await supabaseAdmin
      .from("payment_gateways")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!gateway) return fail("Payment method not found");
    if (!gateway.access_token) return fail("No access token stored for this payment method");
    if (!gateway.merchant_id) return fail("No merchant ID stored for this payment method");

    const reference = bp.buildReferenceId();
    const fields = bp.qrRequestFields({
      referenceId: reference,
      amount: 1,
      merchantId: String(gateway.merchant_id),
      callbackUrl: callbackUrlFor(gateway),
    });

    const resolved = await bp.resolveEndpoint({
      cached: gateway.qr_api_url,
      candidates: bp.QR_CREATE_CANDIDATES,
      token: String(gateway.access_token),
      fields,
    });

    const result = resolved.result;

    await bp.logGatewayCall(supabaseAdmin, {
      operation: "bharatpay:test_connection",
      request: { endpoint: resolved.url, fields },
      response: { status: result?.httpStatus ?? null, body: result?.body ?? result?.raw ?? null },
      statusCode: result?.httpStatus ?? null,
      success: !!result?.ok,
    });

    if (!result) {
      return fail("BharatPays did not answer on any Virtual QRCODE route. Ask BharatPays support to confirm your Virtual QRCODE service is enabled.");
    }

    if (resolved.url && resolved.url !== gateway.qr_api_url) {
      await supabaseAdmin.from("payment_gateways").update({ qr_api_url: resolved.url }).eq("id", gateway.id);
    }

    const providerMessage = result.message;
    if (!result.ok) {
      return fail(`BharatPays replied: ${providerMessage}`);
    }
    const { qr } = bp.extractQr(result.body, null);
    return ok({
      message: qr
        ? `Credentials OK — BharatPays returned a live QR (${result.durationMs}ms)`
        : `Credentials accepted by BharatPays: ${providerMessage}`,
    });
  });
