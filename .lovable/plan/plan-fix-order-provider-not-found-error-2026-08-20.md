# Plan: Fix Order/Provider Not Found Error

The error `Order or provider not found` is occurring because the server functions are using an outdated table name `smm_providers_v5` and a potentially problematic custom RPC `execute_raw_sql_v2` for basic joins. I will refactor these functions to use standard Supabase client methods and correct the table names.

## Technical Details

- Replace all occurrences of `smm_providers_v5` with `providers`.
- Replace `execute_raw_sql_v2` calls with standard Supabase `.from().select()` queries in `src/lib/providers/order.functions.ts`.
- Ensure data is correctly flattened or accessed after the refactor to maintain compatibility with existing logic.

## Steps

1. **Refactor `placeOrder`**: Switch to standard Supabase query and fix table name.
2. **Refactor `getOrderStatus`**: Switch to standard Supabase query and fix table name.
3. **Refactor `placeProviderOrder`**: Switch to standard Supabase query and fix table name.
4. **Refactor `syncOrderStatusInternal`**: Switch to standard Supabase query and fix table name.
5. **Verify Fix**: Ensure orders can be placed and providers are correctly identified.
