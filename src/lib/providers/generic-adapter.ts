import { SmmProviderAdapter, ProviderService, ProviderOrderStatus, ProviderCapabilities } from "./adapter";

/**
 * Shared low-level transport for standard SMM panel APIs (v2 / v3 / v4 / latest).
 * Standard SMM API contract: POST application/x-www-form-urlencoded with
 * key + action (+ extra params). Returns parsed JSON, or throws an Error whose
 * message contains the REAL failure reason (status, content-type, body preview).
 */
export async function smmRequest(
  version: string,
  apiUrl: string,
  apiKey: string,
  action: string,
  params: Record<string, any> = {},
): Promise<any> {
  const safeParams = { ...Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ) };
  const body = new URLSearchParams({ key: apiKey, action, ...safeParams });
  const bodyString = body.toString();

  let host = apiUrl;
  try { host = new URL(apiUrl).host; } catch { /* ignore */ }
  console.log(`[SMM ${version}] POST host=${host} action=${action} at=${new Date().toISOString()}`);

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; SMM-Panel-Client/1.0)',
      },
      body: body.toString(),
    });
  } catch (e: any) {
    throw new Error(`Network error contacting ${host}: ${e?.message || String(e)}`);
  }

  const contentType = response.headers.get('content-type') || 'unknown';
  const text = await response.text();
  console.log(`[SMM ${version}] response host=${host} action=${action} status=${response.status} contentType=${contentType} bytes=${text.length}`);
  
  // Log a safe preview of the response for debugging (excluding sensitive data)
  console.log(`[SMM ${version}] response preview: ${text.slice(0, 500)}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} from ${host} (action=${action}, content-type=${contentType}): ${text.slice(0, 300)}`);
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Provider ${host} returned non-JSON (${contentType}, HTTP ${response.status}): ${text.slice(0, 300)}`);
  }

  if (data && typeof data === 'object' && !Array.isArray(data) && data.error) {
    throw new Error(`Provider error (${host}, action=${action}): ${typeof data.error === 'string' ? data.error : JSON.stringify(data.error)}`);
  }

  return data;
}

export class V2SmmAdapter implements SmmProviderAdapter {
  private version = 'v2';
  constructor(private apiUrl: string, private apiKey: string) {}

  getCapabilities(): ProviderCapabilities {
    return {
      services: true,
      balance: true,
      addOrder: true,
      orderStatus: true,
      multiStatus: false,
      cancelOrder: false,
      refillOrder: false
    };
  }

  private async fetchApi(action: string, params: Record<string, any> = {}) {
    return smmRequest(this.version, this.apiUrl, this.apiKey, action, params);
  }

  async getServices(): Promise<ProviderService[]> { return this.fetchApi('services'); }
  async getBalance(): Promise<{ balance: string; currency: string }> { return this.fetchApi('balance'); }
  async addOrder(params: any): Promise<{ order: string }> { return this.fetchApi('add', params); }
  async getOrderStatus(orderId: string): Promise<ProviderOrderStatus> { return this.fetchApi('status', { order: orderId }); }
  async getOrdersStatus(orderIds: string[]): Promise<Record<string, ProviderOrderStatus>> {
    throw new Error("Multi-status not supported in v2");
  }
}

export class V3SmmAdapter implements SmmProviderAdapter {
  private version = 'v3';
  constructor(private apiUrl: string, private apiKey: string) {}
  getCapabilities(): ProviderCapabilities {
    return {
      services: true,
      balance: true,
      addOrder: true,
      orderStatus: true,
      multiStatus: true,
      cancelOrder: true,
      refillOrder: true
    };
  }
  private async fetchApi(action: string, params: Record<string, any> = {}) {
    return smmRequest(this.version, this.apiUrl, this.apiKey, action, params);
  }
  async getServices(): Promise<ProviderService[]> { return this.fetchApi('services'); }
  async getBalance(): Promise<{ balance: string; currency: string }> { return this.fetchApi('balance'); }
  async addOrder(params: any): Promise<{ order: string }> { return this.fetchApi('add', params); }
  async getOrderStatus(orderId: string): Promise<ProviderOrderStatus> { return this.fetchApi('status', { order: orderId }); }
  async getOrdersStatus(orderIds: string[]): Promise<Record<string, ProviderOrderStatus>> {
    return this.fetchApi('status', { orders: orderIds.join(',') });
  }
  async cancelOrder(orderId: string) { return this.fetchApi('cancel', { order: orderId }); }
  async refillOrder(orderId: string) { return this.fetchApi('refill', { order: orderId }); }
}

export class V4SmmAdapter implements SmmProviderAdapter {
  private version = 'v4';
  constructor(private apiUrl: string, private apiKey: string) {}
  getCapabilities(): ProviderCapabilities {
    return {
      services: true,
      balance: true,
      addOrder: true,
      orderStatus: true,
      multiStatus: true,
      cancelOrder: true,
      refillOrder: true
    };
  }
  private async fetchApi(action: string, params: Record<string, any> = {}) {
    return smmRequest(this.version, this.apiUrl, this.apiKey, action, params);
  }
  async getServices(): Promise<ProviderService[]> { return this.fetchApi('services'); }
  async getBalance(): Promise<{ balance: string; currency: string }> { return this.fetchApi('balance'); }
  async addOrder(params: any): Promise<{ order: string }> { return this.fetchApi('add', params); }
  async getOrderStatus(orderId: string): Promise<ProviderOrderStatus> { return this.fetchApi('status', { order: orderId }); }
  async getOrdersStatus(orderIds: string[]): Promise<Record<string, ProviderOrderStatus>> {
    return this.fetchApi('status', { orders: orderIds.join(',') });
  }
  async cancelOrder(orderId: string) { return this.fetchApi('cancel', { order: orderId }); }
  async refillOrder(orderId: string) { return this.fetchApi('refill', { order: orderId }); }
}

export class ProviderAdapterFactory {
  static getAdapter(version: string, apiUrl: string, apiKey: string): SmmProviderAdapter {
    switch (version?.toLowerCase()) {
      case 'v2': return new V2SmmAdapter(apiUrl, apiKey);
      case 'v3': return new V3SmmAdapter(apiUrl, apiKey);
      case 'v4':
      case 'latest': return new V4SmmAdapter(apiUrl, apiKey);
      default:
        // Default to v2 for backward compatibility if version is not specified
        return new V2SmmAdapter(apiUrl, apiKey);
    }
  }
}
