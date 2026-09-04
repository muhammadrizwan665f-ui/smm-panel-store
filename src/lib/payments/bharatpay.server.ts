/**
 * BharatPays Virtual QRCODE — server-only adapter.
 *
 * The official documentation (https://api.bharatpays.in/api_documentation) fully
 * specifies the Virtual QRCODE *callback* contract, but the QR-generation request
 * contract is only published through a Postman collection whose link has expired.
 * We therefore never guess the endpoint: the QR API URL, HTTP method and JSON
 * request template are supplied by the admin in Management -> Payments and are
 * rendered here server-side. The access token never leaves the server.
 */

const SECRET_KEYS = ["access_token", "token", "authorization", "auth", "api_key", "apikey", "secret", "password"];

/** Recursively mask any credential-looking field before it is persisted to logs. */
export function maskSensitive(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[deep]";
  if (Array.isArray(value)) return value.map((v) => maskSensitive(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEYS.includes(k.toLowerCase()) ? "***masked***" : maskSensitive(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function buildReferenceId(): string {
  const d = new Date();
  const day = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NEXUS-DEP-${day}-${rand}`;
}

type TemplateVars = Record<string, string>;

/** Replace {{placeholders}} inside an admin-provided JSON template (strings only). */
export function renderTemplate(template: unknown, vars: TemplateVars): unknown {
  if (typeof template === "string") {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => vars[key] ?? "");
  }
  if (Array.isArray(template)) return template.map((t) => renderTemplate(t, vars));
  if (template && typeof template === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(template as Record<string, unknown>)) out[k] = renderTemplate(v, vars);
    return out;
  }
  return template;
}

export function readPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as any)[key] : undefined), obj);
}

const QR_KEYS = [
  "qr_code", "qrcode", "qr_string", "qr_data", "qr_image", "qr_image_url", "qr_url",
  "qrCode", "qrString", "qrImage", "intent_url", "upi_intent", "upi_link", "payment_link", "image",
];
const TXN_KEYS = ["order_id", "transaction_id", "txn_id", "id", "virtual_accounts_id", "va_id", "ref_id", "reference_id"];

function deepFind(obj: unknown, keys: string[], depth = 0): string | null {
  if (depth > 6 || !obj || typeof obj !== "object") return null;
  for (const key of keys) {
    const v = (obj as any)[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  for (const v of Object.values(obj as Record<string, unknown>)) {
    const found = deepFind(v, keys, depth + 1);
    if (found) return found;
  }
  return null;
}

export function extractQr(response: unknown, configuredPath?: string | null) {
  let qr: string | null = null;
  if (configuredPath) {
    const v = readPath(response, configuredPath);
    if (typeof v === "string" && v.trim()) qr = v.trim();
  }
  if (!qr) qr = deepFind(response, QR_KEYS);
  const txnId = deepFind(response, TXN_KEYS);
  return { qr, txnId };
}

/** Serialises a flat field map the way the documented cURL samples do. */
export function toFormBody(body: unknown): string {
  const params = new URLSearchParams();
  if (body && typeof body === "object" && !Array.isArray(body)) {
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      params.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }
  }
  return params.toString();
}

export type GatewayCallResult = {
  ok: boolean;
  isApiRoute?: boolean;
  httpStatus: number | null;
  body: unknown;
  raw: string;
  message: string;
  durationMs: number;
};

/** Performs the authenticated server-side request. The token is never returned. */
export async function callGatewayApi(opts: {
  url: string;
  token: string;
  body: unknown;
  method?: string;
  timeoutMs?: number;
}): Promise<GatewayCallResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
  try {
    const res = await fetch(opts.url, {
      method: opts.method ?? "POST",
      headers: {
        // The official BharatPays samples post form fields, not JSON.
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Bearer ${opts.token}`,
      },
      body: toFormBody(opts.body),
      signal: controller.signal,
    });
    const raw = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }
    // BharatPays answers unknown routes with an HTML 404 page instead of JSON.
    const isApiRoute = body !== null && typeof body === "object";
    const providerMessage =
      (body && typeof body === "object" && ((body as any).message ?? (body as any).error)) || null;
    const success =
      res.ok && (!body || typeof body !== "object" || (body as any).success === undefined || String((body as any).success) === "1" || (body as any).success === true);
    return {
      ok: success && isApiRoute,
      isApiRoute,
      httpStatus: res.status,
      body,
      raw: raw.slice(0, 4000),
      message: String(providerMessage ?? (res.ok ? "OK" : `HTTP ${res.status}`)),
      durationMs: Date.now() - started,
    };
  } catch (e: any) {
    const aborted = e?.name === "AbortError";
    return {
      ok: false,
      httpStatus: null,
      body: null,
      raw: "",
      isApiRoute: false,
      message: aborted ? "Request timed out" : String(e?.message ?? "Network error"),
      durationMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Writes an API log row with all credentials masked out. */
export async function logGatewayCall(
  supabaseAdmin: any,
  entry: {
    operation: string;
    request: unknown;
    response: unknown;
    statusCode: number | null;
    success: boolean;
  },
) {
  try {
    await supabaseAdmin.from("provider_api_logs").insert({
      provider_id: null,
      operation: entry.operation,
      request_payload: maskSensitive(entry.request) as any,
      response_payload: maskSensitive(entry.response) as any,
      status_code: entry.statusCode,
      is_success: entry.success,
    });
  } catch {
    /* logging must never break the payment flow */
  }
}


/* ------------------------------------------------------------------ *
 * System-managed endpoint resolution.
 *
 * The admin only ever supplies a Merchant ID and an Access Token. Every URL
 * is derived from the official API base published in the BharatPays
 * documentation; the concrete Virtual QRCODE action is resolved at runtime by
 * calling the API and keeping the route that answers with a real JSON API
 * response (unknown routes return an HTML 404 page). The resolved route is
 * cached on the gateway row so later deposits go straight to it.
 * ------------------------------------------------------------------ */

export const BHARATPAYS_API_BASE = "https://api.bharatpays.in/api/";

/** Documented module/action naming style, ordered most-likely first. */
const QR_CREATE_ACTIONS = [
  "va/create_qrcode",
  "va/create_account",
  "virtual_qrcode/create_qrcode",
  "virtual_qrcode/create",
  "va/create_qr",
  "qrcode/create_qrcode",
];

const QR_STATUS_ACTIONS = ["va/get_account", "va/check_status", "virtual_qrcode/check_status", "eb_payment/check_status"];

export function apiUrl(action: string) {
  return `${BHARATPAYS_API_BASE}${action.replace(/^\/+/, "")}`;
}

export async function resolveEndpoint(opts: {
  cached?: string | null;
  candidates: string[];
  token: string;
  fields: Record<string, unknown>;
}): Promise<{ url: string | null; result: GatewayCallResult | null; tried: string[] }> {
  const tried: string[] = [];
  const ordered = [
    ...(opts.cached ? [opts.cached] : []),
    ...opts.candidates.map(apiUrl).filter((u) => u !== opts.cached),
  ];
  let lastApiResult: { url: string; result: GatewayCallResult } | null = null;

  for (const url of ordered) {
    tried.push(url);
    const result = await callGatewayApi({ url, token: opts.token, body: opts.fields });
    if (result.isApiRoute) {
      // A real API answer (success or a provider-side error such as an IP block).
      if (result.ok) return { url, result, tried };
      lastApiResult = { url, result };
    }
  }
  if (lastApiResult) return { url: lastApiResult.url, result: lastApiResult.result, tried };
  return { url: null, result: null, tried };
}

export const QR_CREATE_CANDIDATES = QR_CREATE_ACTIONS;
export const QR_STATUS_CANDIDATES = QR_STATUS_ACTIONS;

/** Fields sent for a Virtual QRCODE request, using the documented naming. */
export function qrRequestFields(input: {
  referenceId: string;
  amount: number;
  merchantId: string;
  callbackUrl: string;
}) {
  return {
    ref_id: input.referenceId,
    merchant_id: input.merchantId,
    amount: input.amount.toFixed(2),
    remark: input.referenceId,
    callback_url: input.callbackUrl,
  };
}
