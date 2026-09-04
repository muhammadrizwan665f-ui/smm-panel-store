export interface ProviderService {
  service: string | number;
  name: string;
  category: string;
  rate: string | number;
  min: string | number;
  max: string | number;
  type?: string;
  desc?: string;
  dripfeed?: boolean;
  refill?: boolean;
  cancel?: boolean;
}

export interface ProviderOrderStatus {
  charge: string | number;
  start_count: string | number;
  status: string;
  remains: string | number;
  currency?: string;
}

export interface ProviderCapabilities {
  services: boolean;
  balance: boolean;
  addOrder: boolean;
  orderStatus: boolean;
  multiStatus: boolean;
  cancelOrder: boolean;
  refillOrder: boolean;
}

export interface SmmProviderAdapter {
  getCapabilities(): ProviderCapabilities;
  getServices(): Promise<ProviderService[]>;
  getBalance(): Promise<{ balance: string; currency: string }>;
  addOrder(params: {
    service: string;
    link: string;
    quantity: number;
    [key: string]: any;
  }): Promise<{ order: string | number; [key: string]: any }>;
  getOrderStatus(orderId: string): Promise<ProviderOrderStatus>;
  getOrdersStatus(orderIds: string[]): Promise<Record<string, ProviderOrderStatus>>;
  cancelOrder?(orderId: string): Promise<{ success: boolean; error?: string }>;
  refillOrder?(orderId: string): Promise<{ success: boolean; error?: string }>;
}
