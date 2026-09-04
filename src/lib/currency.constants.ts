/**
 * Global currency configuration constants.
 * This is the single source of truth for currency conversion rates.
 */

export const DEFAULT_EXCHANGE_RATE = 280;
export const DEFAULT_CUSTOMER_CURRENCY = 'PKR';
export const DEFAULT_PRICE_ROUNDING = '2_decimals';

/**
 * Single source of truth for converting a USDT-denominated amount into base currency.
 *
 * Every place in the app that needs to turn a provider-quoted USDT value
 * (balance, cost, service price, etc.) into the base value we show to
 * customers/admins MUST go through this function instead of hardcoding
 * a multiplier.
 */
export function convertUsdtToBase(
  amountUsdt: number,
  rate?: number | string | null,
  currency?: string | null,
): number {
  // If the currency passed is USDT or USD (assumed 1:1 for simplicity), return amount as is
  if (currency && (String(currency).toUpperCase() === 'USDT' || String(currency).toUpperCase() === 'USD')) {
    return Number(amountUsdt) || 0;
  }
  
  const parsedRate = typeof rate === 'string' ? parseFloat(rate) : rate;
  const effectiveRate = parsedRate && !Number.isNaN(parsedRate) && parsedRate > 0
    ? parsedRate
    : DEFAULT_EXCHANGE_RATE;
    
  return (Number(amountUsdt) || 0) * effectiveRate;
}

/**
 * Gets the symbol for a given currency code.
 */
export function getCurrencySymbol(code: string, fallbackMap: Record<string, string> = {}): string {
  const defaults: Record<string, string> = {
    'PKR': 'Rs.',
    'USD': '$',
    'USDT': '₮',
    'EUR': '€',
    'GBP': '£'
  };
  
  return fallbackMap[code] || defaults[code] || code;
}
