# Manual Services (Subscriptions) System + Icon Uploader

Add a second, separate product type alongside the API/provider services: manually fulfilled products (VPN, streaming subscriptions, AI tool subscriptions). These never go to a provider panel — the wallet is charged instantly and you deliver over WhatsApp.

## What you get

### 1. Manual categories & services (admin)
- New "Manual Services" section in the management panel where you create your own categories and products.
- Each manual service is fully hand-written by you: name, description (multi-line details), icon (upload your own image or Lucide name), fixed price, and status (active/inactive).
- Optional quantity/variant: default is a single fixed price per order (qty 1). You can also enable a quantity field if you want to sell multiples.
- Manual categories/services are kept in a distinct segment so they never mix with provider-imported services.

### 2. User side
- Create Order page gets two segments: "SMM Services" (existing) and "Subscriptions / Manual" (new).
- For a manual service the form asks for a WhatsApp number (not a link), plus optional note.
- On submit: balance is checked, price is deducted instantly, an order is created with status "processing / awaiting delivery". Nothing is sent to any provider.
- The order appears in My Orders with a "Manual delivery via WhatsApp" tag.

### 3. Admin fulfilment queue
- New page: Management → Manual Orders. Lists only manual orders with user, service, price, WhatsApp number, note, time.
- One-tap "Chat on WhatsApp" button (wa.me link), and actions: Mark Delivered / Cancel & Refund (refund returns money to the user's wallet and logs a transaction).

### 4. Icon uploader everywhere
- The existing services list (provider services) gets the same upload button that categories already have — pick an image from your device, it uploads to storage and is set as that service's icon.
- Also available inside the manual service editor and on manual categories.

## Technical notes

- Migration: add `service_type text not null default 'api'` to `services` and `service_categories` (values `api` | `manual`); add `fixed_price numeric`, `allow_quantity boolean default false` to `services`; add `order_type text not null default 'api'`, `contact_whatsapp text`, `note text` to `orders`. GRANTs + RLS policies mirrored from the existing tables (public read for active manual services, user-owned read/insert for orders, admin-only writes via `has_role`).
- Server functions in `src/lib/manual/manual.functions.ts`:
  - `listManualCatalog` (public read, active only, safe columns)
  - `createManualOrder` (`requireSupabaseAuth`): validates service, balance, atomically deducts wallet, inserts `wallet_transactions` row + order with `order_type='manual'`.
  - Admin: `adminListManualOrders`, `adminUpdateManualOrder` (deliver / cancel+refund), `adminSaveManualService`, `adminDeleteManualService` — all through the existing admin server-fn pattern with an admin role check.
- Order placement pipeline (`src/lib/providers/order.functions.ts`) is untouched; manual orders never enter it because they use a separate function and are filtered out of provider sync by `order_type`.
- UI files: new `src/routes/management.manual-services.tsx`, `src/routes/management.manual-orders.tsx`; edits to `_authenticated.create-order.tsx` (segment switcher + WhatsApp field), `_authenticated.orders.tsx` (manual badge), `management.services.index.tsx` (icon upload button reusing `uploadIconFile`).
- Reuses existing `icons` storage bucket and `src/lib/upload-icon.ts`; no visual redesign of existing pages, only the additions above.
