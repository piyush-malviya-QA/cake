# The Cakeifyy — Feature Design Spec
**Date:** 2026-03-18

## Overview

Six feature additions and one rename for The Cakeifyy POS app. All features build on the existing Next.js 15 + Supabase stack.

---

## 1. Data Model Changes

### 1A. Global Low-Stock Threshold
- A single integer stored in `localStorage` under the key `cakeifyy_low_stock_threshold`
- Default value: `5`
- Editable from a settings widget (accessible to admin users)
- No database schema changes required

### 1B. `OrderItem.buyPrice`
- New field `buy_price: number` added to the `order_items` table
- Migration: `ALTER TABLE order_items ADD COLUMN buy_price numeric NOT NULL DEFAULT 0;`
- `OrderItem` TypeScript type gains `buyPrice: number`
- `CartItem` TypeScript type gains `buyPrice: number` — populated when adding a product to cart from `product.buyPrice`
- In `BillingModule.addToCart`, `buyPrice: product.buyPrice` is added to the `CartItem`
- In `useOrders.createOrder`:
  - `itemsData` insert payload includes `buy_price: item.buyPrice` (snake_case for Supabase)
  - The in-memory `newOrder.items` is built by calling `snakeToCamel<OrderItem>(i)` on each `itemsData` entry (this already exists in the codebase at line 91). Since `itemsData` contains `buy_price`, `snakeToCamel` will convert it to `buyPrice` automatically — no extra mapping needed. The `OrderItem` type must be updated first for TypeScript to accept it.
- Persists the cost at time of sale — ensures profit calculations remain accurate if product buy prices change later
- On fetch, `useOrders` uses `select("*, order_items(*)")` with `*` — this automatically includes `buy_price`. The existing `snakeToCamel` utility converts `buy_price` → `buyPrice` on all fetched order items, so no additional mapping is needed.

---

## 2. Stock Alert Banner

### Behavior
- Sticky banner rendered in the dashboard layout, below the page header, above page content
- Reads all products via `useProducts()` (which post-refactor reads from `DataProvider` context)
- Compares each product's `qty` against the global threshold read from `localStorage`
- If any products are at or below threshold, banner is visible
- Items with `qty === 0` shown in **red** as "Out of stock"
- Items with `0 < qty <= threshold` shown in **amber** as low stock with current qty
- Example: `⚠ Low stock: Brownie (out of stock) · Chocolate Cake (2 left) · Vanilla Slice (4 left)`
- Dismissible per session via a close button (state in React, not persisted)
- Re-appears on page reload if products are still low

### Component
- `src/components/StockAlertBanner.tsx`
- **Depends on Section 3 (DataProvider) being implemented first** — calls `useProducts()` which post-refactor reads from shared context
- The `useProducts()` wrapper must return an empty array (not throw) when called outside a `DataProvider` context, to avoid runtime crashes during incremental rollout
- Reads threshold from `localStorage` key `cakeifyy_low_stock_threshold`

---

## 3. Shared Data Context (Loading Fix)

### Problem
Each page mounts its own hooks and fetches from Supabase, causing a blank/empty flash on every navigation.

### Solution
Lift shared data into a single `DataProvider` context at the dashboard layout level.

### Scope
- `products`, `categories`, `orders`, `customers` — all fetched once on dashboard mount
- New file: `src/features/data/DataProvider.tsx` — exports `DataProvider` and `useDataContext`
- Existing hooks (`useProducts`, `useCategories`, `useOrders`, `useCustomers`) become thin wrappers that read from and write to `DataProvider` context instead of fetching independently
- The current per-hook `fetch` callbacks are already `async` functions, so they return `Promise<void>` today. The real problem is independent fetch-on-mount per hook instance — not missing awaitability. The DataProvider refactor solves this by sharing a single fetch/state across all consumers.
- The context exposes a `refetch` function per data type (e.g., `refetchProducts: () => Promise<void>`). The `DataProvider` internal fetch functions must use `return fetchProducts()` (not just call it) when exposing via context, so callers can await them. The wrapper hooks must pass this through without wrapping in a new void function. This preserves `BillingModule.handleCheckout`'s `await refetchProducts()` behavior.
- All four wrapper hooks must return safe defaults (empty arrays, no-op functions) when called outside a `DataProvider` context to avoid runtime crashes
- Mutations (add/update/delete) update context state optimistically and call the awaitable refetch
- `DataProvider` wraps children inside the dashboard layout (`src/app/(dashboard)/layout.tsx`)

### Result
Navigation between Billing, Inventory, Customers, Orders, and Insights is instant after initial load.

---

## 4. Billing Screen Updates

### 4A. Out-of-Stock Products Visible
- Remove the `p.qty > 0` filter from `BillingModule` — all products are shown
- Products with `qty === 0` render greyed out (`opacity-50`, cursor-not-allowed)
- An "Out of Stock" badge overlays the card
- Click prevention is enforced in `ProductGrid` (UI layer): the `onClick` handler is not attached when `product.qty === 0`. This avoids creating a cart item with `maxQty: 0`, which would cause a confusing state where an item appears in the cart but is immediately flagged out-of-stock.

### 4B. Stock Indicator Styling
- Stock count on product cards: `text-[13px] font-semibold`
- Color coding:
  - `qty === 0` → red (`text-red-500`)
  - `qty <= threshold` → amber (`text-amber-500`)
  - `qty > threshold` → slate/muted (`text-slate-400`)
- Threshold read from `localStorage` key `cakeifyy_low_stock_threshold`

### 4C. Cart Out-of-Stock Tag
- If a cart item's `maxQty` drops to 0 (e.g., stock changes after it was added), show it greyed out with an "Out of Stock" tag in the cart
- Checkout is blocked while any out-of-stock item remains in cart; cashier must remove it first

---

## 5. Order History Updates

### 5A. Month Filter
- Dropdown at top of Orders page, defaulting to the current month (e.g., "March 2026")
- Options populated dynamically from actual order dates (only months with orders are shown, plus current month always included)
- Filters the order table and all stat cards
- **Note:** The shared `DataProvider` orders context is limited to the 100 most recent orders. The Orders page month filter and stats operate on this set. This is an intentional trade-off for app load speed; for full historical accuracy use the Insights screen.

### 5B. Stats
- Existing stat cards: Total Orders, Revenue, Discounts Given — all filter by selected month
- New stat cards added:
  - **Buy Cost** — sum of `item.buyPrice × item.qty` for filtered orders
  - **Profit** — Revenue minus Buy Cost, colored green (positive) or red (negative)
- `item.buyPrice` is available on all fetched `OrderItem` records after the migration and hook updates in Sections 1B and 3
- **Known limitation:** The `buy_price` column defaults to `0` for orders created before this migration. Buy Cost and Profit figures will show `0` for historical orders, making Profit appear inflated. The stat cards display `—` (dash) instead of a value when all items in the filtered set have `buyPrice === 0`, to avoid misleading data.

---

## 6. Insights Screen

### Route & Access Control
- New route: `src/app/(dashboard)/insights/page.tsx`
- Admin-only — page wraps content in `<RoleGuard allow="admin">` (existing pattern from `src/features/auth/RoleGuard.tsx`; prop is `allow`, not `role`)
- Added to sidebar nav with a `BarChart2` (lucide-react) icon
- `pageLabels` in `src/app/(dashboard)/layout.tsx` updated: `"/insights": "Insights"`

### Month Selector
- At top of page; controls panels 1, 3, and 4; defaults to current month

### Panel 1 — Daily Sales Chart
- Bar chart: X = day of month, Y = revenue
- Shows revenue per day for the selected month

### Panel 2 — Month-to-Month Summary
- Table + line chart: columns = Month, Revenue, Buy Cost, Profit
- Covers all months with data
- Automatically shows year-level aggregation when 12+ months of data exist

### Panel 3 — Category Breakdown
- Bar chart: X = category name, Y = revenue for selected month
- Clicking a bar selects the category and triggers Panel 4

### Panel 4 — Item Drill-down
- Appears when a category is selected
- Table: Product Name | Units Sold | Revenue | Profit
- Data scoped to selected month + selected category

### Chart Library
- **Recharts** — to be added as a dependency if not present

### Data
- Derived entirely from existing `orders` + `order_items` data
- The shared `DataProvider` fetch for `orders` keeps `.limit(100)` to keep the main app fast
- Insights uses a **separate, dedicated fetch** (inside `InsightsModule`) that removes the limit and fetches all orders — this does not affect the shared context used by other pages
- The `InsightsModule` fetches once on mount using the Supabase client directly, independent of the shared context

---

## 7. App Name Change

Change display name from "Sweet Delights Bakery" / "Sweet" to **"The Cakeifyy"** in:

| File | Change |
|---|---|
| `src/components/Sidebar.tsx` | Title line: `🎂 The Cakeifyy`, remove subtitle |
| `src/app/layout.tsx` | `<title>` / metadata title |
| `src/app/manifest.ts` | `name` and `short_name` fields |
| `src/lib/utils.ts` | `SHOP_NAME = "The Cakeifyy"` (used on receipts and elsewhere) |

---

## Implementation Order

1. Data model migration (add `buy_price` to `order_items`)
2. Shared data context (`DataProvider`) + update all hooks
3. App rename + `pageLabels` update for `/insights`
4. Stock alert banner
5. Billing screen updates
6. Order history month filter + profit stats
7. Insights screen

---

## Out of Scope

- Push notifications for low stock
- Per-product stock threshold overrides
- User-configurable chart date ranges beyond month/year
- Export to CSV/PDF
