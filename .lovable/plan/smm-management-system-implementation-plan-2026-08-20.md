# SMM Management System Implementation Plan

Transform the `/management` route into a full SMM service management and order-control panel integrated with a generic provider API architecture.

## 1. Database Schema Extensions
- **Update `services`**: Add `provider_id`, `provider_service_id`, `provider_rate`, `customer_rate`, `min_quantity`, `max_quantity`, `status` (active/inactive).
- **Update `orders`**: Add `provider_cost`, `estimated_profit`, `provider_status`, `provider_response`.
- **New `provider_api_logs`**: Track server-side requests/responses (masked keys).
- **Seed initial data**: Ensure default categories and initial site settings.

## 2. Generic Provider Integration Layer
- **Architecture**: Create a `src/lib/providers/` directory.
  - `adapter.ts`: Generic interface for SMM providers.
  - `registry.ts`: Register and retrieve provider implementations.
- **Server Functions**:
  - `provider.functions.ts`: Securely handle API calls (balance, services, status) using Supabase secrets for keys.
  - No API keys in the frontend; all communication proxied through server functions.

## 3. Management UI Transformation
- **Dashboard (`/management/index.tsx`)**: SMM-specific stats (Profit, Revenue, Provider Cost) and recent order activity.
- **Provider Management (`/management/providers.tsx`)**: CRUD for providers, balance checks, and status monitoring.
- **Service Management (`/management/services.tsx`)**: Control customer catalog, set markups (Fixed or Percentage), and map to provider services.
- **Provider Service Import (`/management/providers/services.tsx`)**: Browse provider API services and import them into the internal catalog.
- **Order Management (`/management/orders.tsx`)**: Detailed view with internal vs. provider status, profit tracking, and manual status overrides.

## 4. Business Logic: Secure Order Flow
- **Server Function `createOrder`**:
  1. Validate user balance.
  2. Create internal order record (status 'Pending').
  3. Deduct wallet balance (atomic transaction).
  4. Call Provider API via adapter.
  5. Update order with `provider_order_id` and cost.
  6. Handle failure: Refund wallet if provider call fails immediately.
- **Background Sync**: Logic for periodic status updates from providers to update internal order states.

## 5. Security & Access Control
- **RBAC**: Enforce `admin` role checks on all `/management/*` routes and server functions.
- **PII/Secrets**: Mask API keys in logs and management UI; never send full keys to the browser.
- **User Panel Connection**: Refactor `new-order.tsx` to pull from the new `services` table structure.

## Technical Details
- **Framework**: TanStack Start (React 19, Vite 7).
- **Database**: Supabase (PostgreSQL) with RLS.
- **State Management**: TanStack Query for data fetching.
- **Styling**: Tailwind CSS v4 (Light theme: White, Blue, Purple, Pink).
- **Icons**: Lucide React.
