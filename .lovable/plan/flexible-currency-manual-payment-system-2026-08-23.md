# Flexible Currency & Manual Payment System

The goal is to move from a hardcoded INR-based system to a flexible multi-currency system (e.g., PKR, INR, USD) that can be fully managed from the admin panel. Additionally, we'll implement support for manual payment methods (Transfer type) featuring QR codes, account details, and copy/download actions.

## User Improvements
- Users will see the site in their preferred currency (e.g., PKR symbol and prices).
- New manual payment flow: Choose a method, view QR/details, pay, and then wait for admin approval (or submit UTR if required).
- Copy buttons for account numbers/IBANs and download buttons for QR codes.

## Technical Details

### 1. Currency System Refactor
- **`src/lib/currency.constants.ts`**: 
    - Rename `convertUsdtToInr` to `convertUsdtToBase`.
    - Update `USDT_TO_INR_RATE` to a generic `DEFAULT_EXCHANGE_RATE`.
    - Introduce a `getSymbol(currencyCode)` helper.
- **`src/routes/_authenticated.tsx`**: Replace hardcoded `currencySymbols` with a dynamic lookup using site settings.
- **`src/routes/management.settings.currency.tsx`**: Add fields for `currency_symbol` and `currency_code` (allowing arbitrary strings like "PKR" or "Rs.").
- **`src/lib/providers/provider.functions.ts`**: Update normalization logic to use the configured base currency exchange rate instead of hardcoded 105.

### 2. Manual Payment Methods
- **Database Schema (`payment_gateways`)**:
    - Add `type` column (`'auto'` | `'manual'`).
    - Add `account_number`, `iban`, `mobile_number` columns.
    - `qr_image_url` already exists, we will use it for manual QR uploads.
- **`src/routes/management.payments.tsx`**: 
    - Add UI to select Gateway Type.
    - Add input fields for Account Number, IBAN, and Mobile Number for 'manual' gateways.
    - Allow uploading a QR image specifically for manual gateways.
- **`src/routes/_authenticated.add-funds.tsx`**:
    - Update payment flow to detect gateway type.
    - If `manual`: Render a `ManualPaymentDetails` component showing Account Number/IBAN/Mobile with copy buttons and the QR image with a download button.
    - Include a "Submit Payment Proof" (UTR/Screenshot ID) field for manual methods.

### 3. Price Recalculation
- Update `recalculateServicePrices` to strictly use the active `site_settings` values.

## Safety & Security
- Keep all RLS policies intact.
- Ensure only admins can see/edit gateway credentials or manual bank details.
- Validate all manual payment submissions to prevent spam.
