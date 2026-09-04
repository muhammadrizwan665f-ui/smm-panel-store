# Update Provider System - Currency & Button Functionality

This plan addresses the requirement for a global provider currency configuration, fixing button states/reliability in the management panel, and ensuring production-quality provider interactions.

## User Review Required

> [!IMPORTANT]
> The plan uses `site_settings` to store global currency rates. 1 USDT = 290 PKR and 1 USDT = 100 INR will be the default configuration.

- **Currency Path**: `/management/settings/currency` will be created.
- **Conversion Logic**: A centralized utility will handle the 2.90 multiplier (INR -> PKR) across the app.
- **Button States**: Every action (Save, Test, Fetch, Balance) will implement explicit loading/success/error visuals.

## Proposed Changes

### Database & Backend
- Add global currency keys to `site_settings` (`provider_currency_inr_pkr`, `usdt_to_inr`, `usdt_to_pkr`).
- Implement `getCurrencySettings` and `updateCurrencySettings` server functions.
- Update `ProviderAdapterFactory` and adapters to handle currency metadata if needed, though primary logic will be in the management service.

### Management Settings
- Create `src/routes/management.settings.currency.tsx` for global configuration.
- Implement the requested dashboard for USDT -> INR, USDT -> PKR, and derived INR -> PKR.

### Provider Management (`/management/providers`)
- **Button Overhaul**:
    - Update `AddProvider` modal with robust loading states and error handling.
    - Update `Test Connection` to distinguish between Test Mode and Real API.
    - Mask API keys in UI (e.g., `••••••••1234`).
- **Provider Cards**:
    - Display Configuration status, API Version, Connection status, and Sync history.
    - Fix the "Check Balance" button to return to idle state on error.

### Service Import Logic
- Refactor `src/lib/providers/import.functions.ts` and `src/lib/providers/provider.functions.ts` to use the global INR -> PKR conversion factor instead of per-service inputs.

## Technical Details
- **Currency Multiplier**: Calculated as `usdt_to_pkr / usdt_to_inr`.
- **Button States**: Use a `status` state (`idle | loading | success | error`) for all async buttons.
- **Security**: Ensure `api_key` is never returned in full in the `listProviders` call; only a partial masked string if needed for UI, or just a boolean indicator.

## Verification Plan
### Automated Tests
- Run a Playwright script to:
    1. Navigate to Settings -> Currency, save values, and verify persistence.
    2. Create a "TEST PROVIDER", verify it appears in the list.
    3. Click "Test Connection" and verify success message.
    4. Delete the "TEST PROVIDER".

### Manual Verification
- Check responsiveness of the mobile bottom nav vs desktop sidebar.
- Verify error toasts appear when API calls fail (e.g., invalid URL).
