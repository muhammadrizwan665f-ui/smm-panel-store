# Plan: Fix Registration, Provider Currencies, and Service Fetch

The goal is to stabilize the account creation process, ensure the currency system supports all requested options (PKR/INR/USDT) for both providers and the site, and fix the recurring "Service Fetch" issue.

## User-facing changes
- **Registration**: Reliable account creation using mobile numbers.
- **Provider Management**: Ability to select PKR, INR, or USDT when adding a provider.
- **Balance & Services**: Real-time balance fetching and fixed service synchronization.
- **Pricing**: Accurate calculations based on the chosen global currency (PKR/INR/USDT).

## Technical details

### 1. Registration Fix
- Update `src/components/auth/RegisterForm.tsx` to handle the `mobile_number` field more robustly and ensure immediate session hydration after signup.
- Verify `profiles` table triggers to ensure a profile is created correctly for new users with `mobile_number`.

### 2. Flexible Provider Currencies
- **Database**: Add/Ensure `currency` column in `providers` table supports 'PKR', 'INR', 'USDT'.
- **Management UI**: Update `src/routes/management.providers.index.tsx` to include PKR and USDT in the currency dropdown.
- **Normalization Logic**: Update `src/lib/providers/import.functions.ts` to handle:
  - If Provider = PKR, convert PKR -> USDT (via global rate).
  - If Provider = INR, convert INR -> USDT (via global rate).
  - Then convert USDT -> Customer Currency (PKR/INR/USDT).

### 3. Service Fetch & Balance
- **Adapter Debugging**: Check `src/lib/providers/generic-adapter.ts` for response parsing issues.
- **Backend**: Ensure `getProviderServices` correctly maps rates based on the provider's specifically configured currency.
- **Balance Logic**: Ensure `getProviderBalance` updates the `providers` table with the exact balance fetched from the API.

### 4. Global Currency Settings
- Update `src/routes/management.settings.currency.tsx` to allow selecting any of the three currencies (PKR/INR/USDT) as the site's primary customer currency.
- Update all authenticated routes to use the dynamic symbol based on this setting.

## Dependencies
- Lovable Cloud (Supabase) for RLS and table structure.
- `site_settings` table for global rates.
