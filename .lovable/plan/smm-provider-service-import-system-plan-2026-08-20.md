# SMM Provider Service Import System Plan

This plan implements a production-quality service import system that allows fetching real-time services from providers, applying configurable markups with currency conversion (INR to PKR), and managing internal visibility.

## User-facing Changes
- **New Service Management UI**: A comprehensive interface at `/management/services` to manage all imported services.
- **Enhanced Provider Services View**: A robust listing at `/management/providers/:id/services` for browsing and selecting services to import.
- **Bulk Import Workflow**: Ability to select multiple services, choose categories, apply profit margins (fixed or percentage), and preview pricing before final import.
- **Visibility Control**: Services are imported as 'INACTIVE' by default, giving the administrator control over when they appear to customers.
- **Automatic Pricing**: Real-time conversion from INR provider rates to PKR customer prices based on global settings.

## Technical Details
- **Database Schema Updates**:
  - Add missing columns to `services` table for better provider mapping (`markup_type`, `markup_amount`, `provider_rate`, `provider_cost`).
  - Ensure `service_categories` table is robustly handled.
- **Server-side Logic (`src/lib/providers/import.functions.ts`)**:
  - Update `importServices` to support batch processing, category selection, and profit calculation.
  - Implement duplicate protection using `(provider_id, provider_service_id)` unique constraint.
- **Frontend Components**:
  - Create a "Bulk Import Preview" modal to show converted costs and final prices.
  - Implement search, filtering, and pagination for both provider-side and internal service lists.
  - Add "Fetch Services" triggers that communicate securely with the backend.

## Security
- API keys remain strictly server-side.
- All import and management operations are gated behind administrative authentication checks.
- Input validation using Zod on all server functions.
