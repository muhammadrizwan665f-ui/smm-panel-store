# Plan - Stabilize Branding and Multi-Currency Pricing

The goal is to ensure branding changes (name, logo, favicon) are applied globally across the panel (including the home page) and that pricing calculations are accurate based on a single source of truth for exchange rates.

## User Review Required

> [!IMPORTANT]
> - I will set a new exchange rate of `105` (INR/PKR to USDT) as requested by your previous messages, but I will make sure this is fetched from `site_settings` rather than hardcoded in components.
> - If your provider rates are in PKR or INR, please ensure the provider currency is set correctly in Management -> Providers so the system knows whether to multiply or divide.

## Proposed Changes

### Branding & Identity
- **Global Layout & SEO**: Update `src/routes/__root.tsx` to use the dynamic `brand_name` from branding settings for the HTML `<title>` and metadata.
- **Home/Login Page**: Update `src/routes/index.tsx` (if it has UI) and `src/components/auth/LoginForm.tsx` to display the dynamic `brand_name` and `logo_url`.
- **Management Layout**: Ensure the admin panel sidebar/header reflects the branding.

### Multi-Currency & Pricing Logic
- **Single Source of Truth**: Update `src/lib/currency.constants.ts` to fetch the exchange rate from `site_settings` whenever possible, and ensure a consistent fallback.
- **Provider Services Normalization**: Fix `src/lib/providers/import.functions.ts` to correctly handle conversions when the provider currency is not USDT.
- **UI Consistency**: 
    - Fix `src/routes/management.provider-services.tsx` and `src/routes/management.providers.index.tsx` where the exchange rate `105` was hardcoded instead of using `currencySettings`.
    - Ensure all price displays use the `currentSymbol` and calculated rate from settings.

### Service Sync & Price Calculation
- **Server Function Refactor**: Update `recalculateServicePrices` in `src/lib/providers/provider.functions.ts` to use the current `usdt_to_inr` (or `usdt_rate`) from `site_settings`.
- **Import Logic**: Ensure `importServices` applies the same logic consistently.

## Technical Details
- The database `site_settings` table will be used to store `brand_name`, `logo_url`, `favicon_url`, `usdt_rate`, `currency_symbol`, and `currency_code`.
- The `src/lib/currency.constants.ts` will be the primary utility for front-end conversions.
- The `src/lib/providers/import.functions.ts` handles the server-side normalization during service imports.
