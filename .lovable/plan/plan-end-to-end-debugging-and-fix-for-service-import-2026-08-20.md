# Plan: End-to-End Debugging and Fix for Service Import

Debug and fix the provider service fetch and import flow, ensuring real API requests work, mapping is correct, and database persistence is reliable.

## 1. Investigation & Logging
- Add detailed server-side logging to `src/lib/providers/generic-adapter.ts` and `src/lib/providers/provider.functions.ts` to capture the exact HTTP request (hostname, method, params) and raw response (status, content-type, body preview).
- Verify the provider configuration (API URL, key, version) retrieved from the database.

## 2. API Adapter Fixes
- Ensure `smmRequest` correctly handles various JSON structures and error responses.
- Update `getProviderServices` in `provider.functions.ts` to handle different list formats (array, `{services: []}`, `{data: []}`, etc.).
- Map fields accurately: `service`, `name`, `rate`, `min`, `max`, `category`.

## 3. Database Persistence Fixes
- Ensure `provider_services` upsert uses the correct conflict resolution (`provider_id`, `provider_service_id`).
- Verify that services are stored with the correct provider relationship.

## 4. UI/UX Enhancements for Debugging
- Update the "Fetch Services" button in `src/routes/management.providers.$id.services.tsx` to show the actual error message returned from the server.
- Ensure the loading state is correctly managed and cleared on error.

## 5. Import Logic Fixes
- Implement the "Import Selected" flow in `src/lib/providers/import.functions.ts` to create internal services with the specified category and profit markup.
- Ensure currency conversion (INR to PKR) is applied correctly based on global settings.

## Technical Details
- Files to modify:
  - `src/lib/providers/generic-adapter.ts`: Low-level transport and logging.
  - `src/lib/providers/provider.functions.ts`: `getProviderServices` logic and database upsert.
  - `src/lib/providers/import.functions.ts`: Service import and price calculation.
  - `src/routes/management.providers.$id.services.tsx`: Frontend error handling and state.
- Security: API keys will NEVER be logged or exposed to the frontend. Logs will only contain safe metadata.
