# COMPLETE SMM PROVIDER API MANAGEMENT SYSTEM

Upgrade the provider section to a professional SMM API management system, enabling configuration, balance checks, service fetching, and mapping.

## User Review Required

> [!IMPORTANT]
> The plan uses server functions for all API operations to ensure API keys are never exposed to the frontend.

- **Security**: API keys will be stored in the database but masked in the UI.
- **Provider Adapter**: Generic architecture to support standard SMM API protocols.
- **Workflow**: Configure Provider -> Test Connection -> Fetch Services -> Import/Map to Internal Services.

## Proposed Changes

### Database Schema
- **Providers**: Ensure fields for `api_key`, `balance`, `currency`, `last_sync`, etc.
- **Provider Services**: Store raw data from provider API for syncing and mapping.
- **Service Mapping**: Map internal services to specific provider service IDs.

### Backend (Server Functions)
- `src/lib/providers/provider.functions.ts`:
  - `addProvider`: Securely save provider details.
  - `testProviderConnection`: Ping provider API to verify credentials.
  - `fetchProviderServices`: Retrieve and store service catalog from provider.
  - `syncProviderServices`: Update existing mapped services and add new ones.

### UI / Frontend
- **Providers List (`/management/providers`)**:
  - Cards/Table showing connection status, balance, and sync stats.
  - "Add Provider" modal/form with secure input masking.
- **Provider Detail (`/management/providers/:id`)**:
  - Central control hub for a specific provider.
  - Tabs: Overview, Services, Logs, Settings.
- **Provider Services (`/management/providers/:id/services`)**:
  - Table showing all services available from the provider API.
  - Import functionality (Single, Selected, All).
- **Service Settings (`/management/services/:id`)**:
  - Mapping section: Internal Service <-> Provider <-> Provider Service ID.
  - Markup management: Fixed Price or Percentage Markup.

## Technical Details

### Provider API Adapter
```typescript
interface SmmProviderAdapter {
  getServices(): Promise<ProviderService[]>;
  getBalance(): Promise<{ balance: string; currency: string }>;
  addOrder(params: any): Promise<{ order: string }>;
  getOrderStatus(orderId: string): Promise<any>;
}
```

### Security Measures
- Masked API Key: `••••••••••••1234`
- Server-side request execution only.
- RLS policies to prevent unauthorized access to provider credentials.

### Sync Logic
- Matches by `provider_service_id`.
- Updates `provider_rate`, `min`, `max`.
- New services marked as "Not Imported".
