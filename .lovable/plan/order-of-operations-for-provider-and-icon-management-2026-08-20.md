# Order of Operations for Provider and Icon Management

This plan stabilizes the provider management interface and completes the icon assignment system.

## User Review Required

- **Delete Verification:** Should service catalog entries linked to a provider be automatically disabled or deleted when a provider is removed? (Plan assumes disabling for data integrity).

## Proposed Changes

### Database & Backend
- **Provider Management Functions:**
    - Create `adminDeleteProvider` in `src/lib/admin/admin.functions.ts` to allow removing providers.
    - Create `adminUpdateProviderStatus` to toggle providers on/off.
- **Icon Management Functions:**
    - Create `adminBulkUpdateCategoryIcons` to set the same icon for all categories in one click if needed (per request "1 click me sb categories ko icoon mil jaye").
    - Enhance `adminSaveService` to handle bulk updates for services specifically by platform or keyword.

### Management UI
- **Provider Management:**
    - Update `src/routes/management.providers.index.tsx` to include "Delete" and "Toggle Status" actions on provider cards.
    - Add a "Deactivate All Services" safety check when deleting a provider.
- **Provider Settings:**
    - Update `src/routes/management.providers.$id.settings.tsx` to include the delete action prominently.
- **Icon Management System:**
    - Update `src/routes/management.categories.tsx` with a "Bulk Set Icon" tool that can apply an icon to all categories or selected ones.
    - Enhance the service catalog at `src/routes/management.services.index.tsx` with platform-based bulk icon assignment (e.g., "Set Instagram icons for all Instagram services").

## Technical Details
- **Provider Deletion:** Uses `supabaseAdmin` to perform a hard delete in the `providers` table.
- **Recursive Cleanup:** When a provider is deleted, its linked `provider_services` and public `services` should have their `status` set to `inactive` rather than hard deleted to prevent broken order history.
- **Icon Persistence:** Icons are stored as strings in `services.icon` and `service_categories.icon`.
- **Zod Validation:** All new server functions will use strict Zod validation for inputs.
