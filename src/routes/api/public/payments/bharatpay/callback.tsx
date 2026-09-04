/**
 * BharatPays Virtual QRCODE callback receiver.
 *
 * Official contract (https://api.bharatpays.in/api_documentation -> "Virtual QRCODE"):
 *   Authorization: Bearer <your access token>
 *   {
 *     "success": 1,
 *     "message": "Virtual Payment Received.",
 *     "data": {
 *       "type": "va_transaction", "id": "...", "status": "SUCCESS|PENDING|FAILED",
 *       "amount": "100.00", "bank_ref_id": "...", "payment_mode": "IMPS",
 *       "vpa": "...", "virtual_accounts_id": "...", "remark": "...", "created_at": "..."
 *     }
 *   }
 *
 * Wallet credit happens exclusively inside the locked, idempotent database
 * routine process_bharatpay_callback().
 */
import { createFileRoute } from "@tanstack/react-router";
import { logGatewayCall, maskSensitive } from "@/lib/payments/bharatpay.server";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/payments/bharatpay/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const admin = supabaseAdmin as any;

        const rawBody = await request.text();
        let payload: any = null;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          await logGatewayCall(admin, {
            operation: "bharatpay:callback",
            request: { raw: rawBody.slice(0, 1000) },
            response: { error: "invalid_json" },
            statusCode: 400,
            success: false,
          });
          return Response.json({ success: 0, message: "Invalid JSON" }, { status: 400 });
        }

        const header = request.headers.get("authorization") ?? "";
        const presented = header.replace(/^Bearer\s+/i, "").trim();

        const { data: gateways } = await admin
          .from("payment_gateways")
          .select("id, access_token, provider, status")
          .eq("provider", "bharatpay");

        const gateway = (gateways ?? []).find(
          (g: any) => g.access_token && presented && timingSafeEqual(String(g.access_token), presented),
        );

        if (!gateway) {
          await logGatewayCall(admin, {
            operation: "bharatpay:callback",
            request: maskSensitive(payload),
            response: { error: "unauthorized" },
            statusCode: 401,
            success: false,
          });
          return Response.json({ success: 0, message: "Unauthorized" }, { status: 401 });
        }

        const d = payload?.data ?? payload ?? {};
        if (d.type && String(d.type) !== "va_transaction") {
          return Response.json({ success: 1, message: "Ignored (not a virtual account transaction)" });
        }

        const amountRaw = d.amount;
        const amount = amountRaw === undefined || amountRaw === null || amountRaw === "" ? null : Number(amountRaw);
        if (amount !== null && !Number.isFinite(amount)) {
          return Response.json({ success: 0, message: "Invalid amount" }, { status: 400 });
        }

        const reference =
          (d.reference_id ?? d.ref_id ?? d.remark ?? d.order_id ?? null) === null
            ? null
            : String(d.reference_id ?? d.ref_id ?? d.remark ?? d.order_id);

        const { data: result, error } = await admin.rpc("process_bharatpay_callback", {
          p_gateway_id: gateway.id,
          p_reference: reference,
          p_txn_id: d.id ? String(d.id) : null,
          p_amount: amount,
          p_status: d.status ? String(d.status) : null,
          p_bank_ref: d.bank_ref_id ? String(d.bank_ref_id) : null,
          p_payment_mode: d.payment_mode ? String(d.payment_mode) : null,
          p_vpa: d.vpa ? String(d.vpa) : null,
          p_va_id: d.virtual_accounts_id ? String(d.virtual_accounts_id) : null,
          p_payload: maskSensitive(payload) as any,
        });

        await logGatewayCall(admin, {
          operation: "bharatpay:callback",
          request: maskSensitive(payload),
          response: error ? { error: error.message } : result,
          statusCode: error ? 500 : 200,
          success: !error && !!result?.ok,
        });

        if (error) return Response.json({ success: 0, message: "Processing error" }, { status: 500 });

        return Response.json({
          success: result?.ok ? 1 : 0,
          message: String(result?.code ?? "processed"),
        });
      },
      GET: async () =>
        Response.json({ success: 1, message: "BharatPays Virtual QRCODE callback endpoint is live" }),
    },
  },
});
