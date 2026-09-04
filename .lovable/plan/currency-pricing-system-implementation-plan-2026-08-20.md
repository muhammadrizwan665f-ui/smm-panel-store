# Currency & Pricing System Implementation Plan

Implement a flexible currency normalization and pricing system with USDT as the base internal currency, manually managed exchange rates, and detailed pricing audits.

## User Review Required

> [!IMPORTANT]
> The system will use USDT as the internal base currency. All provider rates will be converted to USDT first, then to the customer-facing currency (PKR/INR/USD/USDT).

- **Currency Management**: Admin can choose one active customer currency (PKR, INR, USD, USDT) and set its manual rate against 1 USDT.
- **Provider Normalization**: Each provider now has a mandatory currency (USDT, INR, etc.).
- **Pricing Logic**: `Provider Rate` -> `USDT Equivalent` -> `Customer Currency Cost` -> `Apply Profit` -> `Final Price`.
- **Auditability**: All imported services will store the exact conversion rates and costs used at the time of calculation.

## Proposed Changes

### Database Schema

#### `site_settings`
- Ensure the following keys exist:
  - `customer_currency`: The active currency for the frontend (default: 'PKR').
  - `usdt_rate`: Manual rate (e.g., 290 if PKR, 100 if INR).
  - `price_rounding`: 'none', '2_decimals', 'whole', 'nearest_5', 'nearest_10'.

#### `providers`
- Add `currency` column (default 'USDT') if not already robustly handled.

#### `services`
- Add/Ensure columns for pricing audit:
  - `provider_currency`: Original currency from provider.
  - `provider_rate`: Original rate from provider.
  - `usdt_rate_at_calculation`: The USDT conversion rate used.
  - `normalized_usdt_cost`: Provider rate converted to USDT.
  - `customer_currency`: Currency active at time of import.
  - `converted_cost`: Provider cost in customer currency.
  - `profit_type`: 'percentage' | 'fixed'.
  - `profit_value`: The markup value.
  - `customer_price`: Final calculated price.

### Backend Logic

#### `src/lib/settings.functions.ts`
- Functions to get/update currency settings and price rounding.

#### `src/lib/providers/import.functions.ts`
- Update `importServices` to use the new normalization flow.
- Implement normalization: `normalizeToUSDT(rate, providerCurrency)` and `convertToCustomer(usdtRate, targetCurrency, usdtExchangeRate)`.
- Apply profit markup.
- Apply rounding logic.
- Store audit fields in the `services` table.

#### `src/lib/providers/provider.functions.ts`
- Add `recalculateServicePrices` server function to allow bulk updating existing services when USDT rates change.

### Frontend (Management)

#### `src/routes/management.settings.currency.tsx`
- New UI to select Customer Currency and set the manual USDT rate.
- Add rounding selection.

#### `src/routes/management.providers.$id.services.tsx`
- Update the import modal to show the full calculation preview:
  - Provider Rate (Original) -> USDT Equivalent -> Customer Cost -> Profit -> Final Price.

#### `src/routes/management.services.index.tsx`
- Add "Recalculate Prices" bulk action.

### Frontend (User Panel)
- Update all service displays to show the symbol of the `customer_currency` set in `site_settings`.

## Verification Plan

### Automated Tests
- Create a test script to verify the 5 scenarios provided in the prompt:
  - Scenario 1: 0.037 USDT -> PKR (290) = 10.73 PKR.
  - Scenario 2: 0.037 USDT -> INR (100) = 3.70 INR.
  - Scenario 3: 3 INR -> INR = 3 INR cost.
  - Scenario 4: 100 PKR cost + 40% = 140 PKR.
  - Scenario 5: Verify that changing global rate doesn't change existing service prices until "Recalculate" is clicked.

### Manual Verification
- Change USDT rate in settings and verify no changes in existing services.
- Import a new service and check the `services` table for correct audit columns.
- View User Panel to ensure correct currency symbols are used.
