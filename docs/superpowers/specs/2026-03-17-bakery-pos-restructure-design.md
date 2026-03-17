# Sweet Delights Bakery POS — Restructure Design

## Overview

Restructure a single-file React bakery POS app (`app.jsx`, ~790 lines) into a production-ready Next.js application with Tailwind CSS, Supabase (auth + database), role-based access, and PWA with full offline billing support.

## Current State

Single `app.jsx` file containing:
- Inventory management (CRUD products, categories, stats)
- Billing/POS (cart, checkout, discounts, customer selection)
- Customer management (CRUD with order history)
- Order history (view past orders, receipts)
- Receipt system (print, WhatsApp sharing)
- Shared UI components (Modal, Input, Select, Btn)
- localStorage persistence via custom `useStore` hook
- Inline styles, inline SVG icons

## Tech Stack

| Layer | Current | New |
|-------|---------|-----|
| Framework | Raw React | Next.js 15 (App Router) |
| Styling | Inline styles | Tailwind CSS |
| Data | localStorage | Supabase (Postgres) |
| Auth | None | Supabase Auth (email+password) |
| Icons | Inline SVG | lucide-react |
| Offline | N/A | PWA + IndexedDB sync queue |
| Language | JSX | TypeScript (.tsx) |

## Project Structure

```
cake/
├── app/
│   ├── layout.tsx              → Root layout: font, Tailwind, Supabase provider
│   ├── page.tsx                → Redirect to /billing or /login
│   ├── manifest.ts             → PWA manifest
│   ├── (auth)/
│   │   ├── layout.tsx          → Centered auth layout (no sidebar)
│   │   └── login/page.tsx      → Login form
│   └── (dashboard)/
│       ├── layout.tsx          → Sidebar + auth guard + role context
│       ├── billing/page.tsx    → BillingModule wrapper
│       ├── inventory/page.tsx  → InventoryModule wrapper (admin only)
│       ├── customers/page.tsx  → CustomersModule wrapper
│       └── orders/page.tsx     → OrdersModule wrapper
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── RoleGuard.tsx
│   │   ├── billing/
│   │   │   ├── BillingModule.tsx
│   │   │   ├── Cart.tsx            → Cart panel + checkout logic + discount controls
│   │   │   ├── ProductGrid.tsx
│   │   │   └── CategoryTabs.tsx
│   │   ├── inventory/
│   │   │   ├── InventoryModule.tsx
│   │   │   └── ProductForm.tsx
│   │   ├── customers/
│   │   │   ├── CustomersModule.tsx
│   │   │   └── CustomerForm.tsx
│   │   └── orders/
│   │       ├── OrdersModule.tsx
│   │       └── ReceiptView.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Button.tsx
│   │   │   └── StatCard.tsx
│   │   ├── Sidebar.tsx
│   │   └── SearchBar.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── sync/
│   │   │   ├── queue.ts       → IndexedDB offline queue
│   │   │   ├── engine.ts      → Sync engine: flush when online
│   │   │   └── hooks.ts       → useOnlineStatus, useSyncStatus
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useProducts.ts
│   │   ├── useOrders.ts
│   │   ├── useCustomers.ts
│   │   └── useAuth.ts
│   └── types/
│       └── index.ts
├── public/
│   └── icons/                  → PWA icons
├── middleware.ts                → Next.js route protection
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

## Database Schema

### employees
Extends Supabase `auth.users`. Stores role.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References auth.users(id) |
| name | text | |
| email | text (unique) | |
| role | text | 'admin' or 'cashier' |
| created_at | timestamptz | |

### categories

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | e.g. "cat_cake" |
| name | text | |
| icon | text | Emoji |
| sort_order | int | Derived from original array index (0-based) during seed |

Categories are read-only in the current app. The admin "manage categories" permission is a new feature addition — admin can add/edit/delete categories, cashier cannot.

### products

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | |
| cat_id | text (FK) | References categories |
| name | text | |
| buy_price | numeric | |
| sell_price | numeric | |
| qty | int | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### customers

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | |
| name | text | |
| phone | text | |
| address | text (nullable) | |
| created_at | timestamptz | |
| updated_at | timestamptz | Needed for offline sync conflict resolution |

### orders

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | |
| customer_id | text (FK, nullable) | References customers |
| subtotal | numeric | |
| discount_amt | numeric | Computed discount amount (type/value intentionally not stored — only the final amount matters for receipts) |
| total | numeric | |
| created_by | uuid (FK) | References employees |
| created_at | timestamptz | |

Orders are immutable after creation — no edits, only hard deletes (admin only).

### order_items

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | |
| order_id | text (FK) | References orders, cascade delete |
| product_id | text (FK, nullable) | References products, ON DELETE SET NULL. Snapshots preserve data for historical orders. |
| name | text | Snapshot at time of sale |
| price | numeric | Snapshot at time of sale |
| qty | int | |

### Row Level Security

- All authenticated employees: read all tables
- Admin only: insert/update/delete products and categories
- Both roles: create orders and customers
- Admin only: delete orders
- Cashier role: `InventoryModule` conditionally hides Add/Edit/Delete buttons via `RoleGuard` (RLS enforces at DB level too)

## Auth Flow

1. User visits app → Next.js middleware checks Supabase session
2. No session → redirect to `/login`
3. Login: `supabase.auth.signInWithPassword()` → fetch employee record (role)
4. Redirect to `/billing`
5. `AuthProvider` wraps dashboard, exposes `{ user, role, loading }`
6. `RoleGuard` component gates admin-only features
7. No self-registration. Admin invites employees via `auth.admin.inviteUserByEmail()`. First admin seeded via Supabase dashboard.

### Role Permissions

| Feature | Admin | Cashier |
|---------|-------|---------|
| Billing / POS | Yes | Yes |
| View orders | Yes | Yes |
| Manage customers | Yes | Yes |
| View inventory | Yes | Read-only |
| Add/edit/delete products | Yes | No |
| Manage categories | Yes | No |
| Delete orders | Yes | No |

## Offline & PWA Strategy

### PWA
- `next-pwa` for service worker generation
- App manifest: bakery branding, theme color `#4f46e5`
- Installable on mobile/desktop

### Offline Data Flow

1. **Online:** Hooks read/write Supabase directly. Data cached in IndexedDB.
2. **Offline:** Reads from IndexedDB cache. Writes go to IndexedDB sync queue.
3. **Back online:** Sync engine flushes queue in order. Last-write-wins on conflict. Failed items retry.

### Cached Offline
- Full product catalog + categories
- Customer list
- Recent orders (last 100)
- App shell + static assets

### Online Required
- First login
- Admin operations (invite employee)

### Sync Indicator
- Sidebar footer pill: green "Synced" / yellow "N pending" / red "Offline"

## Naming Conventions

- Database: `snake_case` (Postgres convention) — `cat_id`, `buy_price`, `sell_price`
- Frontend/TypeScript: `camelCase` — `catId`, `buyPrice`, `sellPrice`
- Transformation: Use a thin mapping utility in data hooks to convert between DB and frontend formats

## Data Migration

This is a fresh start on Supabase. The current app has no real users — it's a local prototype with localStorage seed data. Migration strategy:

1. **Seed script** (`supabase/seed.sql`): Inserts the 5 default categories and 12 default products from the current `DEFAULT_CATEGORIES` and `DEFAULT_PRODUCTS` arrays
2. **No localStorage migration**: Since this is moving from prototype to production, there's no existing production data to migrate. The old `app.jsx` localStorage keys (`cakeshop_products`, `cakeshop_customers`, `cakeshop_orders`) are abandoned
3. **First admin**: Created manually via Supabase dashboard (insert into auth.users + employees table)

## Stock Deduction & Concurrency

Stock deduction during checkout uses a Supabase RPC function for atomic decrement:

```sql
create function decrement_stock(p_id text, amount int)
returns void as $$
  update products set qty = qty - amount, updated_at = now()
  where id = p_id and qty >= amount;
$$ language sql;
```

This prevents overselling when multiple cashiers check out the same product concurrently. If `qty < amount`, the update silently affects 0 rows — the hook checks this and surfaces an "insufficient stock" error.

For offline checkout, the sync engine calls this RPC when flushing. If stock was exhausted while offline, the sync fails for that item and the admin is notified.

## Receipt Features

`ReceiptView.tsx` includes:
- Visual receipt display (styled like a thermal print)
- **Print**: Opens a print window formatted for 80mm thermal printers
- **WhatsApp sharing** (online only): Generates receipt text, opens `wa.me` link with customer phone pre-filled
- Both features carried over from the original app unchanged

## Shop Configuration

Shop name ("Sweet Delights Bakery"), address, and phone number remain hardcoded constants in `src/lib/utils.ts` for v1. A `shop_settings` table is deferred to future scope.

## Styling Approach

- All inline styles → Tailwind utility classes
- Color mapping: primary `indigo-600`, success `emerald-600`, danger `red-600`, sidebar `indigo-950`
- Icons: `lucide-react` (same icon set, cleaner imports)
- Responsive: Tailwind `md:` breakpoints for sidebar collapse
- No component library — custom UI components styled with Tailwind
- Visual appearance stays the same as current app
