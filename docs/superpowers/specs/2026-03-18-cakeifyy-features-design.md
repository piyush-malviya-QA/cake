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
- Populated at checkout time from `product.buyPrice`
- Persists the cost at time of sale — ensures profit calculations remain accurate if product buy prices change later
- Migration: `ALTER TABLE order_items ADD COLUMN buy_price numeric NOT NULL DEFAULT 0;`
- `OrderItem` TypeScript type gains `buyPrice: number`

---

## 2. Stock Alert Banner

### Behavior
- Sticky banner rendered in the dashboard layout, below the page header, above page content
- Reads all products from shared context; compares `qty` against the global threshold
- If any products are at or below threshold, banner is visible
- Items with `qty === 0` shown in **red** as "Out of stock"
- Items with `0 < qty <= threshold` shown in **amber** as low stock with current qty
- Example: `⚠ Low stock: Brownie (out of stock) · Chocolate Cake (2 left) · Vanilla Slice (4 left)`
- Dismissible per session via a close button (state in React, not persisted)
- Re-appears on page reload if products are still low

### Component
- `src/components/StockAlertBanner.tsx`
- Consumes products from shared data context
- Reads threshold from localStorage

---

## 3. Shared Data Context (Loading Fix)

### Problem
Each page mounts its own hooks and fetches from Supabase, causing a blank/empty flash on every navigation.

### Solution
Lift shared data into a single `DataProvider` context at the dashboard layout level.

### Scope
- `products`, `categories`, `orders`, `customers` — all fetched once on dashboard mount
- Existing hooks (`useProducts`, `useCategories`, `useOrders`, `useCustomers`) become thin wrappers that read from context instead of fetching independently
- Mutations (add/update/delete) update context state and trigger a background refetch to stay in sync
- New file: `src/features/data/DataProvider.tsx`
- `DataProvider` wraps children inside the dashboard layout

### Result
Navigation between Billing, Inventory, Customers, Orders, and Insights is instant after initial load.

---

## 4. Billing Screen Updates

### 4A. Out-of-Stock Products Visible
- Remove the `p.qty > 0` filter from `BillingModule` — all products are shown
- Products with `qty === 0` render greyed out (`opacity-50`, non-interactive cursor)
- An "Out of Stock" badge overlays the card
- Clicking an out-of-stock card does nothing

### 4B. Stock Indicator Styling
- Stock count on product cards: `text-[13px] font-semibold`
- Color coding:
  - `qty === 0` → red (`text-red-500`)
  - `qty <= threshold` → amber (`text-amber-500`)
  - `qty > threshold` → slate/muted (`text-slate-400`)

### 4C. Cart Out-of-Stock Tag
- If a cart item's `maxQty` drops to 0 (e.g., stock changes after it was added), show it greyed out with an "Out of Stock" tag in the cart
- Checkout is blocked while any out-of-stock item remains in cart; cashier must remove it first

---

## 5. Order History Updates

### 5A. Month Filter
- Dropdown at top of Orders page, defaulting to the current month (e.g., "March 2026")
- Options populated dynamically from actual order dates (only months with orders are shown, plus current month always included)
- Filters the order table and all stat cards

### 5B. Stats
- Existing stat cards: Total Orders, Revenue, Discounts Given — all filter by selected month
- New stat cards added:
  - **Buy Cost** — sum of `item.buyPrice × item.qty` for filtered orders
  - **Profit** — Revenue minus Buy Cost, colored green (positive) or red (negative)

---

## 6. Insights Screen

### Route
`/insights` — admin-only, added to sidebar nav with a `BarChart2` icon

### Month Selector
At top of page. Controls panels 1, 3, and 4. Defaults to current month.

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
- Derived entirely from existing `orders` + `order_items` data in shared context
- No new DB queries required beyond what's already fetched; may increase fetch limit from 100 to unlimited for insights accuracy

---

## 7. App Name Change

Change display name from "Sweet Delights Bakery" / "Sweet" to **"The Cakeifyy"** in:

| File | Change |
|---|---|
| `src/components/Sidebar.tsx` | Title line: `🎂 The Cakeifyy`, remove subtitle |
| `src/app/layout.tsx` | `<title>` / metadata title |
| `src/app/manifest.ts` | `name` and `short_name` fields |

---

## Implementation Order

1. Data model migration (add `buy_price` to `order_items`)
2. Shared data context (`DataProvider`) + update all hooks
3. App rename
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
