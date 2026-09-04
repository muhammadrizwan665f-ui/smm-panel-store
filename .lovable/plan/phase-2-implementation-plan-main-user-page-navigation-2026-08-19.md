# Phase 2 Implementation Plan - Main User Page & Navigation

Refactoring the dashboard into the requested 3-column/3-action layout with mobile bottom navigation, and building the detailed sub-pages for New Order, Orders, Profile, etc.

## 1. Main Navigation & Layout (src/routes/authenticated.tsx)
- Re-design layout to match 3-column navigation: MENU (Left), CREATE ORDER (Center), MY ORDERS (Right).
- Update mobile bottom navigation to focus on these three primary actions.
- Remove standard admin sidebar; use a Menu drawer for the "MENU" action.

## 2. Dashboard Home (src/routes/authenticated.index.tsx)
- Transform the dashboard into the landing page after login.
- Prominent welcome message and wallet balance card.
- Direct links to the 3 main actions.

## 3. New Order Flow (src/routes/authenticated.new-order.tsx)
- Implement social media category selection (Instagram, TikTok, etc.).
- Build the "New Order Form" with fields: Platform, Service, Price calculation, Link, Quantity.
- Use mock service data for UI demonstration.

## 4. My Orders (src/routes/authenticated.orders.tsx)
- Implement status tabs: ACTIVE, COMPLETED, INCOMPLETE.
- Create responsive order cards showing ID, Service, Social Platform, Status, etc.

## 5. Menu & Sub-pages
- **Menu Drawer:** Update with links to Profile, Add Funds, Orders, Balance History, Support, Install App, Logout.
- **Profile (src/routes/authenticated.profile.tsx):** Display mobile, wallet balance, and password reset UI.
- **Add Funds (src/routes/authenticated.add-funds.tsx):** UI for adding balance with ₹ presets.
- **Balance History (src/routes/authenticated.balance-history.tsx):** List wallet transactions.
- **Support:** WhatsApp support link.
- **Install App:** PWA installation instructions.

## Technical Details
- Continue using Light SaaS theme (White/Blue/Purple/Pink).
- Maintain functional Supabase authentication.
- All database queries scoped to auth.uid().
