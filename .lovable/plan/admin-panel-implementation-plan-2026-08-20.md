# Admin Panel Implementation Plan

Create a comprehensive admin interface for managing users, orders, services, and platform settings, secured with role-based access control.

## User Review Required

> [!IMPORTANT]
> - Admin access requires a user with the `admin` role in the `profiles` table.
> - The admin login will use the existing Supabase Auth system.
> - RLS policies will be updated to ensure only admins can access administrative data.

- Do you have an existing admin user, or should I provide a way to promote your first user to admin?
- Should the "Support" tickets be integrated with WhatsApp (as requested in the user panel) or a separate ticket system?

## Technical Details

### Database Schema Updates
- **New Tables**:
    - `providers`: SMM API provider details.
    - `provider_services`: Mapping internal services to provider IDs.
    - `payments`: Log of all deposit attempts and statuses.
    - `notifications`: System-wide notifications for users.
    - `support_tickets` & `support_messages`: Internal ticketing system.
    - `admin_activity_logs`: Tracking sensitive admin actions.
    - `site_settings`: General panel configuration (logo, name, etc.).
- **RLS Policies**:
    - Grant `authenticated` users with `admin` role full access to these tables.
    - Restricted access for normal `user` role.

### Authentication & Routing
- **Layout**: `src/routes/_admin.tsx` (pathless layout) to gate all `/admin/*` routes.
- **Guard**: `beforeLoad` check for authenticated session + `admin` role via `has_role` RPC.
- **Login**: `src/routes/admin.login.tsx` dedicated login page.
- **Sidebar**: Desktop sidebar and mobile bottom nav for admin navigation.

### Admin Pages
- **Dashboard**: Overview cards with real-time stats (Total Users, Orders, Revenue).
- **User Management**: List, details, block/unblock, and wallet adjustments (with transaction logs).
- **Service Management**: CRUD for services and categories, including provider mapping.
- **Order Management**: View all orders, change status, and process refunds.
- **Transactions & Payments**: Audit logs for all financial activity.
- **Reports**: Financial and growth analytics.
- **Settings**: Global site configuration.

### Implementation Steps
1. **Migrations**: Define and apply schema for new tables and RLS updates.
2. **Auth Layer**: Implement the `_admin` layout guard and admin login page.
3. **Core UI**: Build the admin layout with sidebar and responsive navigation.
4. **Management Pages**: Iteratively build out the CRUD interfaces for users, services, and orders.
5. **Logic**: Implement server functions for sensitive operations (wallet adjustments, refunds, status changes).
6. **Validation**: Ensure RLS and server-side checks correctly block non-admin users.
