# Sweet Delights Bakery POS — Restructure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure a single-file React bakery POS into a production-ready Next.js 15 app with Tailwind CSS, Supabase (auth + full DB), role-based access (admin/cashier), and PWA with full offline billing.

**Architecture:** Next.js App Router with route groups — `(auth)` for login, `(dashboard)` for protected pages. Feature modules in `src/features/` contain business logic and complex components. Thin page wrappers in `app/` import from features. Supabase handles auth and Postgres DB. IndexedDB provides offline cache + sync queue.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (@supabase/supabase-js, @supabase/ssr), lucide-react, idb (IndexedDB wrapper), @ducanh2912/next-pwa

**Spec:** `docs/superpowers/specs/2026-03-17-bakery-pos-restructure-design.md`

---

## File Map

### New files to create

**Config & root:**
- `package.json` — dependencies, scripts
- `next.config.ts` — Next.js config with PWA plugin
- `tailwind.config.ts` — Tailwind config with custom colors
- `tsconfig.json` — TypeScript config
- `postcss.config.mjs` — PostCSS for Tailwind
- `.env.local` — Supabase URL + anon key (template)
- `middleware.ts` — Next.js auth middleware

**App routes:**
- `app/layout.tsx` — Root layout: HTML shell, fonts, Tailwind globals
- `app/globals.css` — Tailwind directives + base styles
- `app/page.tsx` — Root redirect to /billing or /login
- `app/manifest.ts` — PWA web manifest
- `app/(auth)/layout.tsx` — Centered layout, no sidebar
- `app/(auth)/login/page.tsx` — Login page wrapper
- `app/(dashboard)/layout.tsx` — Sidebar + AuthProvider + RoleGuard
- `app/(dashboard)/billing/page.tsx` — BillingModule wrapper
- `app/(dashboard)/inventory/page.tsx` — InventoryModule wrapper (admin-gated)
- `app/(dashboard)/customers/page.tsx` — CustomersModule wrapper
- `app/(dashboard)/orders/page.tsx` — OrdersModule wrapper

**Types:**
- `src/types/index.ts` — Product, Category, Customer, Order, OrderItem, CartItem, Employee, Role

**Lib:**
- `src/lib/utils.ts` — uid, fmt, now, today, shop config constants, camelCase/snakeCase mappers
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server-side Supabase client (cookies)
- `src/lib/supabase/middleware.ts` — Supabase middleware helper (refresh session)
- `src/lib/sync/queue.ts` — IndexedDB offline sync queue
- `src/lib/sync/engine.ts` — Sync engine: detect online, flush queue
- `src/lib/sync/hooks.ts` — useOnlineStatus, useSyncStatus

**Hooks:**
- `src/hooks/useAuth.ts` — Login, logout, current user + role
- `src/hooks/useProducts.ts` — CRUD products via Supabase + offline cache
- `src/hooks/useCustomers.ts` — CRUD customers via Supabase + offline cache
- `src/hooks/useOrders.ts` — Create/read orders via Supabase + offline cache
- `src/hooks/useCategories.ts` — Read categories (+ admin CRUD)

**Shared UI components:**
- `src/components/ui/Button.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/StatCard.tsx`
- `src/components/SearchBar.tsx`
- `src/components/Sidebar.tsx`
- `src/components/SyncIndicator.tsx`

**Auth feature:**
- `src/features/auth/AuthProvider.tsx` — Session + role context
- `src/features/auth/LoginForm.tsx` — Email/password form
- `src/features/auth/RoleGuard.tsx` — Role-based conditional render

**Billing feature:**
- `src/features/billing/BillingModule.tsx` — Main POS layout
- `src/features/billing/Cart.tsx` — Cart panel + checkout + discounts
- `src/features/billing/ProductGrid.tsx` — Product selection cards
- `src/features/billing/CategoryTabs.tsx` — Category filter pills

**Inventory feature:**
- `src/features/inventory/InventoryModule.tsx` — Product table + stats
- `src/features/inventory/ProductForm.tsx` — Add/edit product form

**Customers feature:**
- `src/features/customers/CustomersModule.tsx` — Customer cards
- `src/features/customers/CustomerForm.tsx` — Add/edit customer form

**Orders feature:**
- `src/features/orders/OrdersModule.tsx` — Order history table
- `src/features/orders/ReceiptView.tsx` — Receipt display + print + WhatsApp

**Database:**
- `supabase/schema.sql` — Full schema: tables, RLS policies, RPC functions
- `supabase/seed.sql` — Seed categories + products

**PWA:**
- `public/icons/icon-192x192.png` — PWA icon
- `public/icons/icon-512x512.png` — PWA icon

### File to archive
- `app.jsx` → moved to `_archive/app.jsx` (preserved for reference, not imported)

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `app/globals.css`, `.env.local.example`
- Archive: `app.jsx` → `_archive/app.jsx`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Volumes/piyush/QA/cake
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias="@/*" --use-npm
```

Note: Since the directory already has `app.jsx`, move it first:
```bash
mkdir -p _archive
mv app.jsx _archive/app.jsx
```

Then run create-next-app. If it complains about non-empty directory, use `--yes` flag or clean up generated conflicts manually.

Note: `create-next-app` generates default `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, and `tailwind.config.ts`. These will be overwritten in subsequent steps/tasks — that's intentional. Ensure `tsconfig.json` maps `@/*` to `./src/*` (the `--src-dir` flag should handle this).

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react idb @ducanh2912/next-pwa
```

- [ ] **Step 3: Configure Tailwind with custom theme**

Update `tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4f46e5",
          light: "#818cf8",
          dark: "#1e1b4b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Set up globals.css**

Replace `app/globals.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-slate-100 text-slate-900 antialiased;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  }
}

/* Print styles for receipts */
@media print {
  body * { visibility: hidden; }
  .print-receipt, .print-receipt * { visibility: visible; }
  .print-receipt { position: absolute; left: 0; top: 0; }
}
```

- [ ] **Step 5: Create .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js dev server running on localhost:3000 with default page.

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind CSS"
```

---

## Task 2: TypeScript Types & Utility Functions

**Files:**
- Create: `src/types/index.ts`, `src/lib/utils.ts`

- [ ] **Step 1: Create types**

`src/types/index.ts`:
```ts
export type Role = "admin" | "cashier";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  catId: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  customerId: string | null;
  subtotal: number;
  discountAmt: number;
  total: number;
  createdBy: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  maxQty: number;
}
```

- [ ] **Step 2: Create utility functions**

`src/lib/utils.ts`:
```ts
export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmt = (n: number | string) =>
  "₹" + Number(n || 0).toFixed(2);

export const now = () => new Date().toISOString();

export const today = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Shop configuration (hardcoded for v1)
export const SHOP_NAME = "Sweet Delights Bakery";
export const SHOP_ADDRESS = "Shop Address Line 1";
export const SHOP_PHONE = "+91-XXXXXXXXXX";

// DB ↔ Frontend naming conversion
export function snakeToCamel<T extends Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result as T;
}

export function camelToSnake(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(
      /[A-Z]/g,
      (c) => "_" + c.toLowerCase()
    );
    result[snakeKey] = obj[key];
  }
  return result;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types src/lib/utils.ts
git commit -m "feat: add TypeScript types and utility functions"
```

---

## Task 3: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `middleware.ts`

- [ ] **Step 1: Create browser client**

`src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server client**

`src/lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create middleware helper**

`src/lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except if already on login)
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/billing";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 4: Create root middleware**

`middleware.ts` (project root):
```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase middleware.ts
git commit -m "feat: configure Supabase clients and auth middleware"
```

---

## Task 4: Database Schema & Seed Data

**Files:**
- Create: `supabase/schema.sql`, `supabase/seed.sql`

- [ ] **Step 1: Write schema SQL**

`supabase/schema.sql`:
```sql
-- ══════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════

create table employees (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'cashier')),
  created_at timestamptz default now()
);

create table categories (
  id text primary key,
  name text not null,
  icon text not null,
  sort_order int default 0
);

create table products (
  id text primary key,
  cat_id text references categories(id) on delete restrict,
  name text not null,
  buy_price numeric not null default 0,
  sell_price numeric not null default 0,
  qty int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table customers (
  id text primary key,
  name text not null,
  phone text not null,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table orders (
  id text primary key,
  customer_id text references customers(id),
  subtotal numeric not null,
  discount_amt numeric not null default 0,
  total numeric not null,
  created_by uuid references employees(id),
  created_at timestamptz default now()
);

create table order_items (
  id text primary key,
  order_id text references orders(id) on delete cascade,
  product_id text references products(id) on delete set null,
  name text not null,
  price numeric not null,
  qty int not null
);

-- ══════════════════════════════════════
-- RPC: Atomic stock decrement
-- ══════════════════════════════════════

create or replace function decrement_stock(p_id text, amount int)
returns int as $$
declare
  rows_affected int;
begin
  update products
  set qty = qty - amount, updated_at = now()
  where id = p_id and qty >= amount;

  get diagnostics rows_affected = row_count;
  return rows_affected;
end;
$$ language plpgsql;

-- RPC: Atomic checkout — decrements stock for all items or rolls back entirely
create or replace function checkout_decrement_stock(
  item_ids text[],
  item_amounts int[]
)
returns boolean as $$
declare
  i int;
  rows_affected int;
begin
  for i in 1..array_length(item_ids, 1) loop
    update products
    set qty = qty - item_amounts[i], updated_at = now()
    where id = item_ids[i] and qty >= item_amounts[i];

    get diagnostics rows_affected = row_count;
    if rows_affected = 0 then
      raise exception 'Insufficient stock for product %', item_ids[i];
    end if;
  end loop;
  return true;
end;
$$ language plpgsql;

-- ══════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════

alter table employees enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Helper: get current user's role
create or replace function get_user_role()
returns text as $$
  select role from employees where id = auth.uid();
$$ language sql security definer;

-- Employees: all authenticated can read (needed for "created by" lookups)
create policy "employees_select" on employees
  for select using (auth.uid() is not null);

-- Categories: all authenticated can read, admin can mutate
create policy "categories_select" on categories
  for select using (auth.uid() is not null);

create policy "categories_admin_insert" on categories
  for insert with check (get_user_role() = 'admin');

create policy "categories_admin_update" on categories
  for update using (get_user_role() = 'admin');

create policy "categories_admin_delete" on categories
  for delete using (get_user_role() = 'admin');

-- Products: all authenticated can read, admin can mutate
create policy "products_select" on products
  for select using (auth.uid() is not null);

create policy "products_admin_insert" on products
  for insert with check (get_user_role() = 'admin');

create policy "products_admin_update" on products
  for update using (get_user_role() = 'admin');

create policy "products_admin_delete" on products
  for delete using (get_user_role() = 'admin');

-- Customers: all authenticated can read and mutate
create policy "customers_select" on customers
  for select using (auth.uid() is not null);

create policy "customers_insert" on customers
  for insert with check (auth.uid() is not null);

create policy "customers_update" on customers
  for update using (auth.uid() is not null);

create policy "customers_delete" on customers
  for delete using (auth.uid() is not null);

-- Orders: all authenticated can read and insert, admin can delete
create policy "orders_select" on orders
  for select using (auth.uid() is not null);

create policy "orders_insert" on orders
  for insert with check (auth.uid() is not null);

create policy "orders_admin_delete" on orders
  for delete using (get_user_role() = 'admin');

-- Order items: all authenticated can read and insert, cascade handles delete
create policy "order_items_select" on order_items
  for select using (auth.uid() is not null);

create policy "order_items_insert" on order_items
  for insert with check (auth.uid() is not null);
```

- [ ] **Step 2: Write seed data**

`supabase/seed.sql`:
```sql
-- Seed categories
insert into categories (id, name, icon, sort_order) values
  ('cat_cake', 'Cakes', '🎂', 0),
  ('cat_pastry', 'Pastries', '🥐', 1),
  ('cat_icecream', 'Ice Cream', '🍦', 2),
  ('cat_decoration', 'Decorations', '🎀', 3),
  ('cat_other', 'Other Items', '📦', 4);

-- Seed products
insert into products (id, cat_id, name, buy_price, sell_price, qty) values
  ('prod_001', 'cat_cake', 'Black Forest Cake (1kg)', 350, 600, 8),
  ('prod_002', 'cat_cake', 'Butterscotch Cake (500g)', 200, 380, 12),
  ('prod_003', 'cat_cake', 'Red Velvet Cake (1kg)', 400, 700, 5),
  ('prod_004', 'cat_cake', 'Pineapple Cake (500g)', 180, 350, 10),
  ('prod_005', 'cat_pastry', 'Chocolate Éclair', 25, 50, 30),
  ('prod_006', 'cat_pastry', 'Veg Puff', 15, 35, 50),
  ('prod_007', 'cat_pastry', 'Chicken Sandwich', 30, 60, 20),
  ('prod_008', 'cat_icecream', 'Vanilla Scoop', 20, 50, 100),
  ('prod_009', 'cat_icecream', 'Butterscotch Cone', 25, 55, 60),
  ('prod_010', 'cat_decoration', 'Fondant Flowers (set)', 80, 180, 25),
  ('prod_011', 'cat_decoration', 'Edible Glitter (50g)', 60, 150, 40),
  ('prod_012', 'cat_other', 'Paper Cups (100pcs)', 45, 90, 200);
```

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema, RLS policies, and seed data"
```

Note: Run `schema.sql` then `seed.sql` in the Supabase SQL Editor dashboard to set up the database.

---

## Task 5: Shared UI Components

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Select.tsx`, `src/components/ui/StatCard.tsx`, `src/components/SearchBar.tsx`

- [ ] **Step 1: Create Button component**

`src/components/ui/Button.tsx`:
```tsx
"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "success" | "danger" | "ghost" | "whatsapp";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white border-transparent hover:bg-indigo-700",
  success: "bg-emerald-600 text-white border-transparent hover:bg-emerald-700",
  danger: "bg-red-600 text-white border-transparent hover:bg-red-700",
  ghost: "bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50",
  whatsapp: "bg-[#25D366] text-white border-transparent hover:bg-[#20bd5a]",
};

export default function Button({
  children,
  variant = "primary",
  small = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 rounded-lg border font-semibold
        cursor-pointer transition-all duration-150
        ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"}
        ${variantStyles[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create Modal component**

`src/components/ui/Modal.tsx`:
```tsx
"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, wide }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-xl w-full max-h-[90vh] overflow-auto shadow-2xl ${
          wide ? "max-w-[600px]" : "max-w-[440px]"
        }`}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
          <h3 className="m-0 text-[17px] font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-slate-400 p-1 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Input component**

`src/components/ui/Input.tsx`:
```tsx
"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="mb-3.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          w-full px-3 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-sm
          outline-none bg-slate-50 transition-colors duration-200
          focus:border-indigo-500 box-border
          ${className}
        `}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create Select component**

`src/components/ui/Select.tsx`:
```tsx
"use client";

import { SelectHTMLAttributes } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
}

export default function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <div className="mb-3.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`
          w-full px-3 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-sm
          outline-none bg-slate-50 box-border
          ${className}
        `}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 5: Create StatCard component**

`src/components/ui/StatCard.tsx`:
```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
}

export default function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-[10px] px-4 py-3.5 border border-slate-200">
      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
        {label}
      </div>
      <div className="text-[22px] font-extrabold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create SearchBar component**

`src/components/SearchBar.tsx`:
```tsx
"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        <Search size={18} />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2.5 px-3 pl-9 border-[1.5px] border-slate-200 rounded-lg text-sm outline-none bg-white box-border focus:border-indigo-500"
      />
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/
git commit -m "feat: add shared UI components (Button, Modal, Input, Select, StatCard, SearchBar)"
```

---

## Task 6: Auth Feature (AuthProvider, LoginForm, RoleGuard)

**Files:**
- Create: `src/features/auth/AuthProvider.tsx`, `src/features/auth/LoginForm.tsx`, `src/features/auth/RoleGuard.tsx`, `src/hooks/useAuth.ts`

- [ ] **Step 1: Create useAuth hook**

`src/hooks/useAuth.ts`:
```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/types";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function login(email: string, password: string) {
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return false;
    }
    setLoading(false);
    return true;
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function getRole(): Promise<Role | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("employees")
      .select("role")
      .eq("id", user.id)
      .single();
    return (data?.role as Role) ?? null;
  }

  return { login, logout, getRole, loading, error };
}
```

- [ ] **Step 2: Create AuthProvider**

`src/features/auth/AuthProvider.tsx`:
```tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/types";

interface AuthContext {
  userId: string | null;
  userName: string | null;
  role: Role | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
  userId: null,
  userName: null,
  role: null,
  loading: true,
  logout: async () => {},
});

export function useAuthContext() {
  return useContext(AuthCtx);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("employees")
          .select("name, role")
          .eq("id", user.id)
          .single();
        if (data) {
          setUserName(data.name);
          setRole(data.role as Role);
        }
      }
      setLoading(false);
    }
    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUserId(null);
        setUserName(null);
        setRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <AuthCtx.Provider value={{ userId, userName, role, loading, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
```

- [ ] **Step 3: Create RoleGuard**

`src/features/auth/RoleGuard.tsx`:
```tsx
"use client";

import { ReactNode } from "react";
import { useAuthContext } from "./AuthProvider";
import type { Role } from "@/types";

interface RoleGuardProps {
  allow: Role | Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({
  allow,
  children,
  fallback,
}: RoleGuardProps) {
  const { role, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-slate-400">
        Loading...
      </div>
    );
  }

  const allowed = Array.isArray(allow) ? allow : [allow];
  if (!role || !allowed.includes(role)) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center p-10 text-slate-400">
          You do not have access to this page.
        </div>
      )
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Create LoginForm**

`src/features/auth/LoginForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      router.push("/billing");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎂</div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Sweet Delights
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Sign in to your account
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />

      <Button
        type="submit"
        disabled={loading}
        className="w-full justify-center mt-2"
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAuth.ts src/features/auth/
git commit -m "feat: add auth system (AuthProvider, LoginForm, RoleGuard, useAuth hook)"
```

---

## Task 7: Sidebar & Sync Indicator

**Files:**
- Create: `src/components/Sidebar.tsx`, `src/components/SyncIndicator.tsx`

- [ ] **Step 1: Create SyncIndicator**

`src/components/SyncIndicator.tsx`:
```tsx
"use client";

interface SyncIndicatorProps {
  status: "synced" | "pending" | "offline";
  pendingCount?: number;
}

export default function SyncIndicator({
  status,
  pendingCount = 0,
}: SyncIndicatorProps) {
  const config = {
    synced: { dot: "bg-emerald-400", text: "Synced", textColor: "text-emerald-400" },
    pending: {
      dot: "bg-yellow-400",
      text: `${pendingCount} pending`,
      textColor: "text-yellow-400",
    },
    offline: { dot: "bg-red-400", text: "Offline", textColor: "text-red-400" },
  };

  const c = config[status];

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span className={c.textColor}>{c.text}</span>
    </div>
  );
}
```

- [ ] **Step 2: Create Sidebar**

`src/components/Sidebar.tsx`:
```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  FileText,
  Users,
  ClipboardList,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuthContext } from "@/features/auth/AuthProvider";
import SyncIndicator from "./SyncIndicator";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { id: "billing", label: "Billing / POS", href: "/billing", icon: <FileText size={20} /> },
  { id: "inventory", label: "Inventory", href: "/inventory", icon: <Package size={20} /> },
  { id: "customers", label: "Customers", href: "/customers", icon: <Users size={20} /> },
  { id: "orders", label: "Order History", href: "/orders", icon: <ClipboardList size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userName, role, logout } = useAuthContext();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-3 left-3 z-[1100] bg-indigo-600 border-none rounded-lg w-10 h-10 flex md:hidden items-center justify-center cursor-pointer text-white"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-[1040] md:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          w-[220px] bg-indigo-950 text-white flex flex-col
          fixed md:sticky top-0 h-screen z-[1050]
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="px-5 pt-5 pb-5 border-b border-white/10">
          <div className="text-[22px] font-extrabold">🎂 Sweet</div>
          <div className="text-xs text-indigo-300 mt-0.5">Delights Bakery</div>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
                className={`
                  flex items-center gap-2.5 w-full px-5 py-3 border-none text-sm text-left cursor-pointer
                  transition-all duration-150
                  ${active
                    ? "bg-indigo-500/30 text-white font-bold border-l-[3px] border-l-indigo-400"
                    : "bg-transparent text-indigo-200 font-medium border-l-[3px] border-l-transparent hover:bg-indigo-500/10"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User info & sync */}
        <div className="px-5 py-3 border-t border-white/10">
          {userName && (
            <div className="text-xs text-indigo-300 mb-2">
              {userName} <span className="text-indigo-500">({role})</span>
            </div>
          )}
          <SyncIndicator status="synced" />
          <button
            onClick={logout}
            className="mt-3 text-xs text-indigo-400 hover:text-white bg-transparent border-none cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx src/components/SyncIndicator.tsx
git commit -m "feat: add Sidebar with navigation and SyncIndicator"
```

---

## Task 8: App Layouts & Route Pages

**Files:**
- Create: `app/layout.tsx`, `app/page.tsx`, `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(dashboard)/layout.tsx`, `app/(dashboard)/billing/page.tsx`, `app/(dashboard)/inventory/page.tsx`, `app/(dashboard)/customers/page.tsx`, `app/(dashboard)/orders/page.tsx`

- [ ] **Step 1: Create root layout**

`app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sweet Delights Bakery",
  description: "Bakery POS & Inventory Management",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Create root page (redirect)**

`app/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? "/billing" : "/login");
}
```

- [ ] **Step 3: Create auth layout**

`app/(auth)/layout.tsx`:
```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create login page**

`app/(auth)/login/page.tsx`:
```tsx
import LoginForm from "@/features/auth/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 5: Create dashboard layout**

`app/(dashboard)/layout.tsx`:
```tsx
"use client";

import { usePathname } from "next/navigation";
import AuthProvider from "@/features/auth/AuthProvider";
import Sidebar from "@/components/Sidebar";

const pageLabels: Record<string, string> = {
  "/billing": "Billing / POS",
  "/inventory": "Inventory",
  "/customers": "Customers",
  "/orders": "Order History",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <div className="flex-1 p-5 md:px-6 overflow-auto max-w-[1200px] mx-auto w-full">
          <div className="mb-5 pl-12 md:pl-0">
            <h1 className="m-0 text-[22px] font-extrabold text-slate-800">
              {pageLabels[pathname] || "Dashboard"}
            </h1>
            <p className="mt-1 text-[13px] text-slate-400">{today}</p>
          </div>
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
```

- [ ] **Step 6: Create dashboard page stubs**

`app/(dashboard)/billing/page.tsx`:
```tsx
"use client";

import BillingModule from "@/features/billing/BillingModule";

export default function BillingPage() {
  return <BillingModule />;
}
```

`app/(dashboard)/inventory/page.tsx`:
```tsx
"use client";

import InventoryModule from "@/features/inventory/InventoryModule";
import RoleGuard from "@/features/auth/RoleGuard";

export default function InventoryPage() {
  return (
    <RoleGuard allow={["admin", "cashier"]}>
      <InventoryModule />
    </RoleGuard>
  );
}
```

`app/(dashboard)/customers/page.tsx`:
```tsx
"use client";

import CustomersModule from "@/features/customers/CustomersModule";

export default function CustomersPage() {
  return <CustomersModule />;
}
```

`app/(dashboard)/orders/page.tsx`:
```tsx
"use client";

import OrdersModule from "@/features/orders/OrdersModule";

export default function OrdersPage() {
  return <OrdersModule />;
}
```

- [ ] **Step 7: Commit**

```bash
git add app/
git commit -m "feat: add app layouts and route pages"
```

---

## Task 9: Data Hooks (useCategories, useProducts, useCustomers, useOrders)

**Files:**
- Create: `src/hooks/useCategories.ts`, `src/hooks/useProducts.ts`, `src/hooks/useCustomers.ts`, `src/hooks/useOrders.ts`

- [ ] **Step 1: Create useCategories**

`src/hooks/useCategories.ts`:
```ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { snakeToCamel, camelToSnake } from "@/lib/utils";
import type { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (!error && data) {
      setCategories(data.map((d) => snakeToCamel<Category>(d)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function addCategory(category: Omit<Category, "sortOrder">) {
    const maxSort = categories.reduce((m, c) => Math.max(m, c.sortOrder), -1);
    const { error } = await supabase
      .from("categories")
      .insert({ ...camelToSnake({ ...category, sortOrder: maxSort + 1 } as unknown as Record<string, unknown>) });
    if (!error) await fetch();
    return !error;
  }

  async function updateCategory(category: Category) {
    const { error } = await supabase
      .from("categories")
      .update(camelToSnake(category as unknown as Record<string, unknown>))
      .eq("id", category.id);
    if (!error) await fetch();
    return !error;
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) await fetch();
    return !error;
  }

  return { categories, loading, addCategory, updateCategory, deleteCategory, refetch: fetch };
}
```

- [ ] **Step 2: Create useProducts**

`src/hooks/useProducts.ts`:
```ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { snakeToCamel, camelToSnake, uid, now } from "@/lib/utils";
import type { Product } from "@/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (!error && data) {
      setProducts(data.map((d) => snakeToCamel<Product>(d)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function addProduct(
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) {
    const newProduct = {
      ...product,
      id: uid(),
      createdAt: now(),
      updatedAt: now(),
    };
    const { error } = await supabase
      .from("products")
      .insert(camelToSnake(newProduct as unknown as Record<string, unknown>));
    if (!error) {
      setProducts((prev) => [...prev, newProduct as Product]);
    }
    return !error;
  }

  async function updateProduct(product: Product) {
    const updated = { ...product, updatedAt: now() };
    const { error } = await supabase
      .from("products")
      .update(camelToSnake(updated as unknown as Record<string, unknown>))
      .eq("id", product.id);
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updated : p))
      );
    }
    return !error;
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
    return !error;
  }

  async function decrementStock(productId: string, amount: number) {
    const { data, error } = await supabase.rpc("decrement_stock", {
      p_id: productId,
      amount,
    });
    if (!error && data > 0) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, qty: p.qty - amount } : p
        )
      );
      return true;
    }
    return false;
  }

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    decrementStock,
    refetch: fetch,
  };
}
```

- [ ] **Step 3: Create useCustomers**

`src/hooks/useCustomers.ts`:
```ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { snakeToCamel, camelToSnake, uid, now } from "@/lib/utils";
import type { Customer } from "@/types";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name");
    if (!error && data) {
      setCustomers(data.map((d) => snakeToCamel<Customer>(d)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function addCustomer(
    customer: Pick<Customer, "name" | "phone" | "address">
  ) {
    const newCustomer = {
      ...customer,
      id: uid(),
      createdAt: now(),
      updatedAt: now(),
    };
    const { error } = await supabase
      .from("customers")
      .insert(camelToSnake(newCustomer as unknown as Record<string, unknown>));
    if (!error) {
      setCustomers((prev) => [...prev, newCustomer as Customer]);
    }
    return !error;
  }

  async function updateCustomer(customer: Customer) {
    const updated = { ...customer, updatedAt: now() };
    const { error } = await supabase
      .from("customers")
      .update(camelToSnake(updated as unknown as Record<string, unknown>))
      .eq("id", customer.id);
    if (!error) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? updated : c))
      );
    }
    return !error;
  }

  async function deleteCustomer(id: string) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (!error) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
    return !error;
  }

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetch,
  };
}
```

- [ ] **Step 4: Create useOrders**

`src/hooks/useOrders.ts`:
```ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { snakeToCamel, camelToSnake, uid, now } from "@/lib/utils";
import type { Order, OrderItem, CartItem } from "@/types";

interface CreateOrderInput {
  items: CartItem[];
  subtotal: number;
  discountAmt: number;
  total: number;
  customerId: string | null;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) {
      setOrders(
        data.map((d) => {
          const order = snakeToCamel<Order>(d);
          order.items = (d.order_items || []).map((oi: Record<string, unknown>) =>
            snakeToCamel<OrderItem>(oi)
          );
          return order;
        })
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function createOrder(input: CreateOrderInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const orderId = uid();
    const orderData = {
      id: orderId,
      customer_id: input.customerId,
      subtotal: input.subtotal,
      discount_amt: input.discountAmt,
      total: input.total,
      created_by: user.id,
      created_at: now(),
    };

    const { error: orderError } = await supabase
      .from("orders")
      .insert(orderData);
    if (orderError) return null;

    const itemsData = input.items.map((item) => ({
      id: uid(),
      order_id: orderId,
      product_id: item.productId,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsData);
    if (itemsError) return null;

    const newOrder: Order = {
      id: orderId,
      customerId: input.customerId,
      subtotal: input.subtotal,
      discountAmt: input.discountAmt,
      total: input.total,
      createdBy: user.id,
      createdAt: orderData.created_at,
      items: itemsData.map((i) => snakeToCamel<OrderItem>(i)),
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }

  async function deleteOrder(id: string) {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
    return !error;
  }

  return { orders, loading, createOrder, deleteOrder, refetch: fetch };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add data hooks for categories, products, customers, and orders"
```

---

## Task 10: Inventory Feature

**Files:**
- Create: `src/features/inventory/InventoryModule.tsx`, `src/features/inventory/ProductForm.tsx`

- [ ] **Step 1: Create ProductForm**

`src/features/inventory/ProductForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Product, Category } from "@/types";

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onSave: (data: {
    id?: string;
    name: string;
    catId: string;
    buyPrice: number;
    sellPrice: number;
    qty: number;
  }) => void;
  onCancel: () => void;
}

export default function ProductForm({
  product,
  categories,
  onSave,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [catId, setCatId] = useState(product?.catId || categories[0]?.id || "");
  const [buyPrice, setBuyPrice] = useState(product?.buyPrice?.toString() || "");
  const [sellPrice, setSellPrice] = useState(product?.sellPrice?.toString() || "");
  const [qty, setQty] = useState(product?.qty?.toString() || "");

  function handleSave() {
    if (!name.trim()) return alert("Product name is required");
    onSave({
      id: product?.id,
      name: name.trim(),
      catId,
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      qty: Number(qty),
    });
  }

  return (
    <div>
      <Input
        label="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Black Forest Cake (1kg)"
      />
      <Select
        label="Category"
        value={catId}
        onChange={(e) => setCatId(e.target.value)}
        options={categories.map((c) => ({
          value: c.id,
          label: `${c.icon} ${c.name}`,
        }))}
      />
      <div className="grid grid-cols-3 gap-2.5">
        <Input
          label="Buy Price (₹)"
          type="number"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          placeholder="0"
        />
        <Input
          label="Sell Price (₹)"
          type="number"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          placeholder="0"
        />
        <Input
          label="Quantity"
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="flex gap-2.5 mt-2.5 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>
          {product ? "Update" : "Add Product"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create InventoryModule**

`src/features/inventory/InventoryModule.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import SearchBar from "@/components/SearchBar";
import ProductForm from "./ProductForm";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { fmt } from "@/lib/utils";
import type { Product } from "@/types";

export default function InventoryModule() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const { role } = useAuthContext();
  const isAdmin = role === "admin";

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = products.filter(
    (p) =>
      (filterCat === "all" || p.catId === filterCat) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalInvestment = filtered.reduce((s, p) => s + p.buyPrice * p.qty, 0);
  const totalValue = filtered.reduce((s, p) => s + p.sellPrice * p.qty, 0);
  const totalProfit = totalValue - totalInvestment;

  async function handleSave(data: {
    id?: string;
    name: string;
    catId: string;
    buyPrice: number;
    sellPrice: number;
    qty: number;
  }) {
    if (data.id) {
      const existing = products.find((p) => p.id === data.id)!;
      await updateProduct({ ...existing, ...data });
    } else {
      await addProduct(data);
    }
    setShowForm(false);
    setEditProduct(null);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this product?")) {
      await deleteProduct(id);
    }
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 mb-5">
        <StatCard label="Total Items" value={filtered.length} color="#6366f1" />
        <StatCard label="Investment" value={fmt(totalInvestment)} color="#f59e0b" />
        <StatCard label="Sale Value" value={fmt(totalValue)} color="#3b82f6" />
        <StatCard
          label="Potential Profit"
          value={fmt(totalProfit)}
          color={totalProfit >= 0 ? "#059669" : "#dc2626"}
        />
      </div>

      {/* Toolbar */}
      <div className="flex gap-2.5 mb-4 flex-wrap items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-sm bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        {isAdmin && (
          <Button onClick={() => { setEditProduct(null); setShowForm(true); }}>
            <Plus size={18} /> Add Product
          </Button>
        )}
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-[10px] border border-slate-200 overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-50">
              {["Product", "Category", "Buy Price", "Sell Price", "Qty", "Profit/Unit", "Total Profit", ...(isAdmin ? ["Actions"] : [])].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3.5 py-2.5 text-left font-bold text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200 whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const cat = categories.find((c) => c.id === p.catId);
              const profitUnit = p.sellPrice - p.buyPrice;
              const totalP = profitUnit * p.qty;
              return (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-3.5 py-2.5 font-semibold text-slate-800">{p.name}</td>
                  <td className="px-3.5 py-2.5 text-slate-500">
                    {cat ? `${cat.icon} ${cat.name}` : "—"}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500">{fmt(p.buyPrice)}</td>
                  <td className="px-3.5 py-2.5 text-slate-800 font-semibold">{fmt(p.sellPrice)}</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        p.qty <= 5
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {p.qty}
                    </span>
                  </td>
                  <td
                    className={`px-3.5 py-2.5 font-semibold ${
                      profitUnit >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {fmt(profitUnit)}
                  </td>
                  <td
                    className={`px-3.5 py-2.5 font-bold ${
                      totalP >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {fmt(totalP)}
                  </td>
                  {isAdmin && (
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <button
                        onClick={() => { setEditProduct(p); setShowForm(true); }}
                        className="bg-transparent border-none cursor-pointer text-indigo-500 p-1 mr-1"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="bg-transparent border-none cursor-pointer text-red-600 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 8 : 7}
                  className="p-10 text-center text-slate-400"
                >
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditProduct(null); }}
        title={editProduct ? "Edit Product" : "Add Product"}
      >
        <ProductForm
          product={editProduct}
          categories={categories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditProduct(null); }}
        />
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/inventory/
git commit -m "feat: add Inventory module (product table, stats, CRUD)"
```

---

## Task 11: Customers Feature

**Files:**
- Create: `src/features/customers/CustomersModule.tsx`, `src/features/customers/CustomerForm.tsx`

- [ ] **Step 1: Create CustomerForm**

`src/features/customers/CustomerForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Customer } from "@/types";

interface CustomerFormProps {
  customer: Customer | null;
  onSave: (data: { id?: string; name: string; phone: string; address: string }) => void;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");

  function handleSave() {
    if (!name.trim() || !phone.trim()) return alert("Name and phone are required");
    onSave({ id: customer?.id, name: name.trim(), phone: phone.trim(), address: address.trim() });
  }

  return (
    <div>
      <Input label="Customer Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rajesh Kumar" />
      <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" />
      <Input label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. MG Road, Nagpur" />
      <div className="flex gap-2.5 mt-2.5 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>{customer ? "Update" : "Add Customer"}</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CustomersModule**

`src/features/customers/CustomersModule.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/SearchBar";
import CustomerForm from "./CustomerForm";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import { fmt } from "@/lib/utils";
import type { Customer } from "@/types";

export default function CustomersModule() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { orders } = useOrders();
  const [showForm, setShowForm] = useState(false);
  const [editCust, setEditCust] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  async function handleSave(data: { id?: string; name: string; phone: string; address: string }) {
    if (data.id) {
      const existing = customers.find((c) => c.id === data.id)!;
      await updateCustomer({ ...existing, ...data });
    } else {
      await addCustomer(data);
    }
    setShowForm(false);
    setEditCust(null);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this customer?")) {
      await deleteCustomer(id);
    }
  }

  return (
    <div>
      <div className="flex gap-2.5 mb-4 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
        <Button onClick={() => { setEditCust(null); setShowForm(true); }}>
          <Plus size={18} /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {filtered.map((c) => {
          const custOrders = orders.filter((o) => o.customerId === c.id);
          const totalSpent = custOrders.reduce((s, o) => s + o.total, 0);
          return (
            <div key={c.id} className="bg-white rounded-[10px] border border-slate-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[15px] font-bold text-slate-800">{c.name}</div>
                  <div className="text-[13px] text-slate-500 mt-0.5">📞 {c.phone}</div>
                  {c.address && (
                    <div className="text-xs text-slate-400 mt-0.5">📍 {c.address}</div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditCust(c); setShowForm(true); }}
                    className="bg-transparent border-none cursor-pointer text-indigo-500 p-1"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="bg-transparent border-none cursor-pointer text-red-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">ORDERS</div>
                  <div className="text-base font-extrabold text-indigo-600">{custOrders.length}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">TOTAL SPENT</div>
                  <div className="text-base font-extrabold text-emerald-600">{fmt(totalSpent)}</div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full p-10 text-center text-slate-400">
            No customers found
          </div>
        )}
      </div>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditCust(null); }}
        title={editCust ? "Edit Customer" : "Add Customer"}
      >
        <CustomerForm
          customer={editCust}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditCust(null); }}
        />
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/customers/
git commit -m "feat: add Customers module (cards, search, CRUD)"
```

---

## Task 12: Orders & Receipt Feature

**Files:**
- Create: `src/features/orders/OrdersModule.tsx`, `src/features/orders/ReceiptView.tsx`

- [ ] **Step 1: Create ReceiptView**

`src/features/orders/ReceiptView.tsx`:
```tsx
"use client";

import { useRef } from "react";
import { Printer, MessageCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { fmt, SHOP_NAME, SHOP_ADDRESS, SHOP_PHONE } from "@/lib/utils";
import type { Order, Customer } from "@/types";

interface ReceiptViewProps {
  order: Order;
  customers: Customer[];
}

export default function ReceiptView({ order, customers }: ReceiptViewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const customer = customers.find((c) => c.id === order.customerId);

  function generateReceiptText() {
    let text = `${SHOP_NAME}\n${"─".repeat(32)}\n`;
    text += `Bill #: ${order.id.toUpperCase()}\n`;
    text += `Date: ${new Date(order.createdAt).toLocaleString("en-IN")}\n`;
    if (customer) text += `Customer: ${customer.name}\n`;
    text += `${"─".repeat(32)}\n`;
    order.items.forEach((item) => {
      text += `${item.name}\n  ${item.qty} x ${fmt(item.price)} = ${fmt(item.price * item.qty)}\n`;
    });
    text += `${"─".repeat(32)}\n`;
    text += `Subtotal: ${fmt(order.subtotal)}\n`;
    if (order.discountAmt > 0) text += `Discount: -${fmt(order.discountAmt)}\n`;
    text += `TOTAL: ${fmt(order.total)}\n`;
    text += `${"─".repeat(32)}\nThank you! Visit again 🎂`;
    return text;
  }

  function printReceipt() {
    const printWindow = window.open("", "_blank", "width=302,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt</title>
      <style>
        @page { margin: 0; size: 80mm auto; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 4mm; line-height: 1.4; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; }
        .item-name { font-weight: bold; }
        .total-row { font-size: 16px; font-weight: bold; }
      </style></head><body>
        <div class="center bold" style="font-size:16px">${SHOP_NAME}</div>
        <div class="center" style="font-size:10px">${SHOP_ADDRESS}<br>Phone: ${SHOP_PHONE}</div>
        <div class="line"></div>
        <div class="row"><span>Bill #:</span><span>${order.id.toUpperCase().slice(0, 8)}</span></div>
        <div class="row"><span>Date:</span><span>${new Date(order.createdAt).toLocaleString("en-IN")}</span></div>
        ${customer ? `<div class="row"><span>Customer:</span><span>${customer.name}</span></div>` : ""}
        <div class="line"></div>
        ${order.items.map((item) => `
          <div class="item-name">${item.name}</div>
          <div class="row"><span>${item.qty} x ${fmt(item.price)}</span><span>${fmt(item.price * item.qty)}</span></div>
        `).join("")}
        <div class="line"></div>
        <div class="row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
        ${order.discountAmt > 0 ? `<div class="row"><span>Discount</span><span>-${fmt(order.discountAmt)}</span></div>` : ""}
        <div class="line"></div>
        <div class="row total-row"><span>TOTAL</span><span>${fmt(order.total)}</span></div>
        <div class="line"></div>
        <div class="center" style="margin-top:8px">Thank you! Visit again 🎂</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  function sendWhatsApp() {
    const phone = customer?.phone || "";
    const text = encodeURIComponent(generateReceiptText());
    const url = phone
      ? `https://wa.me/91${phone.replace(/\D/g, "")}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  return (
    <div>
      {/* Visual Receipt */}
      <div
        ref={receiptRef}
        className="bg-amber-50 border border-amber-200 rounded-[10px] p-5 font-mono text-[13px] max-w-[320px] mx-auto mb-4"
      >
        <div className="text-center font-extrabold text-base mb-1">{SHOP_NAME}</div>
        <div className="text-center text-[10px] text-stone-500 mb-2">
          {SHOP_ADDRESS} • Phone
        </div>
        <div className="border-t border-dashed border-stone-300 my-2" />
        <div className="flex justify-between text-[11px] text-stone-500">
          <span>Bill #{order.id.slice(0, 8).toUpperCase()}</span>
          <span>{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
        </div>
        {customer && <div className="text-xs mt-1">Customer: {customer.name}</div>}
        <div className="border-t border-dashed border-stone-300 my-2" />
        {order.items.map((item, i) => (
          <div key={i} className="mb-1">
            <div className="font-bold text-xs">{item.name}</div>
            <div className="flex justify-between text-xs text-stone-500">
              <span>{item.qty} × {fmt(item.price)}</span>
              <span>{fmt(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
        <div className="border-t border-dashed border-stone-300 my-2" />
        <div className="flex justify-between text-xs">
          <span>Subtotal</span>
          <span>{fmt(order.subtotal)}</span>
        </div>
        {order.discountAmt > 0 && (
          <div className="flex justify-between text-xs text-red-600">
            <span>Discount</span>
            <span>-{fmt(order.discountAmt)}</span>
          </div>
        )}
        <div className="border-t-2 border-stone-900 my-2" />
        <div className="flex justify-between text-lg font-extrabold">
          <span>TOTAL</span>
          <span>{fmt(order.total)}</span>
        </div>
        <div className="text-center text-[11px] text-stone-500 mt-2.5">
          Thank you! Visit again 🎂
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 justify-center flex-wrap">
        <Button variant="whatsapp" onClick={sendWhatsApp}>
          <MessageCircle size={18} /> Send WhatsApp
        </Button>
        <Button onClick={printReceipt}>
          <Printer size={18} /> Print Receipt
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create OrdersModule**

`src/features/orders/OrdersModule.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Printer, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import ReceiptView from "./ReceiptView";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { fmt } from "@/lib/utils";
import type { Order } from "@/types";

export default function OrdersModule() {
  const { orders, deleteOrder } = useOrders();
  const { customers } = useCustomers();
  const { role } = useAuthContext();
  const isAdmin = role === "admin";
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalDiscount = orders.reduce((s, o) => s + o.discountAmt, 0);

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 mb-5">
        <StatCard label="Total Orders" value={orders.length} color="#6366f1" />
        <StatCard label="Revenue" value={fmt(totalRevenue)} color="#059669" />
        <StatCard label="Discounts Given" value={fmt(totalDiscount)} color="#f59e0b" />
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-50">
              {["Order ID", "Date", "Customer", "Items", "Discount", "Total", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3.5 py-2.5 text-left font-bold text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200 whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const cust = customers.find((c) => c.id === o.customerId);
              return (
                <tr key={o.id} className="border-b border-slate-100">
                  <td className="px-3.5 py-2.5 font-mono text-xs text-slate-500">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500">
                    {new Date(o.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-800">
                    {cust?.name || "Walk-in"}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500">
                    {o.items.length} items
                  </td>
                  <td
                    className={`px-3.5 py-2.5 ${
                      o.discountAmt > 0 ? "text-red-600" : "text-slate-400"
                    }`}
                  >
                    {o.discountAmt > 0 ? `-${fmt(o.discountAmt)}` : "—"}
                  </td>
                  <td className="px-3.5 py-2.5 font-bold text-emerald-600">
                    {fmt(o.total)}
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <Button small variant="ghost" onClick={() => setShowReceipt(o)}>
                      <Printer size={14} /> View
                    </Button>
                    {isAdmin && (
                      <button
                        onClick={async () => {
                          if (confirm("Delete this order?")) await deleteOrder(o.id);
                        }}
                        className="bg-transparent border-none cursor-pointer text-red-600 p-1 ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-400">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!showReceipt}
        onClose={() => setShowReceipt(null)}
        title="Order Receipt"
        wide
      >
        {showReceipt && (
          <ReceiptView order={showReceipt} customers={customers} />
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/orders/
git commit -m "feat: add Orders module with receipt view, print, and WhatsApp sharing"
```

---

## Task 13: Billing / POS Feature

**Files:**
- Create: `src/features/billing/CategoryTabs.tsx`, `src/features/billing/ProductGrid.tsx`, `src/features/billing/Cart.tsx`, `src/features/billing/BillingModule.tsx`

- [ ] **Step 1: Create CategoryTabs**

`src/features/billing/CategoryTabs.tsx`:
```tsx
"use client";

import type { Category } from "@/types";

interface CategoryTabsProps {
  categories: Category[];
  active: string;
  onChange: (id: string) => void;
}

export default function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-1.5 mb-3.5 flex-wrap">
      <button
        onClick={() => onChange("all")}
        className={`px-4 py-2 rounded-full border-none cursor-pointer text-[13px] font-semibold transition-colors ${
          active === "all"
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`px-4 py-2 rounded-full border-none cursor-pointer text-[13px] font-semibold transition-colors ${
            active === c.id
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {c.icon} {c.name}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create ProductGrid**

`src/features/billing/ProductGrid.tsx`:
```tsx
"use client";

import { fmt } from "@/lib/utils";
import type { Product, Category, CartItem } from "@/types";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  onAdd: (product: Product) => void;
}

export default function ProductGrid({ products, categories, cart, onAdd }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="col-span-full p-10 text-center text-slate-400">
        No products available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
      {products.map((p) => {
        const inCart = cart.find((c) => c.productId === p.id);
        const cat = categories.find((c) => c.id === p.catId);
        return (
          <div
            key={p.id}
            onClick={() => onAdd(p)}
            className={`bg-white rounded-[10px] p-3.5 cursor-pointer transition-all relative ${
              inCart
                ? "border-2 border-indigo-600"
                : "border-[1.5px] border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-[28px] mb-1.5">{cat?.icon || "📦"}</div>
            <div className="text-[13px] font-semibold text-slate-800 leading-tight">
              {p.name}
            </div>
            <div className="text-base font-extrabold text-indigo-600 mt-1">
              {fmt(p.sellPrice)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Stock: {p.qty}</div>
            {inCart && (
              <div className="absolute top-2 right-2 bg-indigo-600 text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold">
                {inCart.qty}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create Cart**

`src/features/billing/Cart.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { fmt } from "@/lib/utils";
import type { CartItem, Customer } from "@/types";

interface CartProps {
  cart: CartItem[];
  customers: Customer[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: (customerId: string | null, discountAmt: number) => void;
}

export default function Cart({
  cart,
  customers,
  onUpdateQty,
  onRemove,
  onCheckout,
}: CartProps) {
  const [discount, setDiscount] = useState<string>("0");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [selCustomer, setSelCustomer] = useState("");

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt =
    discountType === "percent"
      ? subtotal * (Number(discount) / 100)
      : Number(discount);
  const total = Math.max(0, subtotal - discountAmt);

  function handleCheckout() {
    if (cart.length === 0) return alert("Cart is empty");
    onCheckout(selCustomer || null, discountAmt);
    setDiscount("0");
    setSelCustomer("");
  }

  return (
    <div className="bg-white rounded-[10px] border border-slate-200 p-4 flex flex-col">
      <h3 className="m-0 mb-3 text-[15px] font-bold text-slate-800">
        🛒 Cart ({cart.length})
      </h3>

      {/* Customer select */}
      <select
        value={selCustomer}
        onChange={(e) => setSelCustomer(e.target.value)}
        className="w-full px-2.5 py-2 border-[1.5px] border-slate-200 rounded-lg text-[13px] mb-3 bg-slate-50 box-border"
      >
        <option value="">Walk-in Customer</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.phone})
          </option>
        ))}
      </select>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto mb-3">
        {cart.length === 0 && (
          <div className="p-8 text-center text-slate-300 text-[13px]">
            Add items to cart
          </div>
        )}
        {cart.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-2 py-2 border-b border-slate-100"
          >
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-slate-800">
                {item.name}
              </div>
              <div className="text-xs text-slate-500">
                {fmt(item.price)} × {item.qty} = {fmt(item.price * item.qty)}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateQty(item.productId, -1)}
                className="bg-slate-100 border-none rounded-md w-[26px] h-[26px] cursor-pointer flex items-center justify-center"
              >
                <Minus size={14} />
              </button>
              <span className="text-[13px] font-bold min-w-[20px] text-center">
                {item.qty}
              </span>
              <button
                onClick={() => onUpdateQty(item.productId, 1)}
                className="bg-slate-100 border-none rounded-md w-[26px] h-[26px] cursor-pointer flex items-center justify-center"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={() => onRemove(item.productId)}
              className="bg-transparent border-none cursor-pointer text-red-600 p-0.5"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Discount */}
      <div className="flex gap-2 mb-2.5 items-end">
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">
            DISCOUNT
          </label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
            className="w-full px-2.5 py-2 border-[1.5px] border-slate-200 rounded-lg text-sm box-border"
          />
        </div>
        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")}
          className="px-2.5 py-2 border-[1.5px] border-slate-200 rounded-lg text-[13px]"
        >
          <option value="percent">%</option>
          <option value="flat">₹</option>
        </select>
      </div>

      {/* Totals */}
      <div className="border-t-2 border-slate-200 pt-2.5 mb-3">
        <div className="flex justify-between text-[13px] text-slate-500 mb-1">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        {discountAmt > 0 && (
          <div className="flex justify-between text-[13px] text-red-600 mb-1">
            <span>Discount</span>
            <span>-{fmt(discountAmt)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-extrabold text-slate-800">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
      </div>

      <Button
        variant="success"
        onClick={handleCheckout}
        disabled={cart.length === 0}
        className="w-full justify-center py-3 text-[15px]"
      >
        Checkout
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Create BillingModule**

`src/features/billing/BillingModule.tsx`:
```tsx
"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import Modal from "@/components/ui/Modal";
import CategoryTabs from "./CategoryTabs";
import ProductGrid from "./ProductGrid";
import Cart from "./Cart";
import ReceiptView from "@/features/orders/ReceiptView";
import { createClient } from "@/lib/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import type { Product, Order, CartItem } from "@/types";

export default function BillingModule() {
  const { products, refetch: refetchProducts } = useProducts();
  const { categories } = useCategories();
  const { customers } = useCustomers();
  const { createOrder } = useOrders();

  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);

  const available = products.filter(
    (p) =>
      p.qty > 0 &&
      (activeCat === "all" || p.catId === activeCat) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        if (existing.qty >= product.qty) return prev;
        return prev.map((c) =>
          c.productId === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.sellPrice,
          qty: 1,
          maxQty: product.qty,
        },
      ];
    });
  }

  function updateCartQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.productId !== productId) return c;
          const newQty = c.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > c.maxQty) return c;
          return { ...c, qty: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  async function handleCheckout(
    customerId: string | null,
    discountAmt: number
  ) {
    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const total = Math.max(0, subtotal - discountAmt);

    // Atomic stock decrement — all or nothing
    const supabase = createClient();
    const { error: stockError } = await supabase.rpc(
      "checkout_decrement_stock",
      {
        item_ids: cart.map((c) => c.productId),
        item_amounts: cart.map((c) => c.qty),
      }
    );
    if (stockError) {
      alert("Insufficient stock for one or more items. Please review your cart.");
      return;
    }

    // Refresh products to reflect decremented stock from DB
    await refetchProducts();

    // Create order
    const order = await createOrder({
      items: cart,
      subtotal,
      discountAmt,
      total,
      customerId,
    });

    if (order) {
      setCart([]);
      setShowReceipt(order);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 min-h-[500px]">
      {/* Left: Product Selection */}
      <div>
        <CategoryTabs
          categories={categories}
          active={activeCat}
          onChange={setActiveCat}
        />
        <div className="mb-3.5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
          />
        </div>
        <ProductGrid
          products={available}
          categories={categories}
          cart={cart}
          onAdd={addToCart}
        />
      </div>

      {/* Right: Cart */}
      <Cart
        cart={cart}
        customers={customers}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />

      {/* Receipt Modal */}
      <Modal
        open={!!showReceipt}
        onClose={() => setShowReceipt(null)}
        title="Order Complete!"
        wide
      >
        {showReceipt && (
          <ReceiptView order={showReceipt} customers={customers} />
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/features/billing/
git commit -m "feat: add Billing/POS module (product grid, cart, checkout)"
```

---

## Task 14: Offline Sync System

**Files:**
- Create: `src/lib/sync/queue.ts`, `src/lib/sync/engine.ts`, `src/lib/sync/hooks.ts`

- [ ] **Step 1: Create IndexedDB sync queue**

`src/lib/sync/queue.ts`:
```ts
import { openDB, type IDBPDatabase } from "idb";

interface SyncEntry {
  id?: number;
  table: string;
  operation: "insert" | "update" | "delete" | "rpc";
  payload: Record<string, unknown>;
  createdAt: string;
}

const DB_NAME = "sweet-delights-sync";
const DB_VERSION = 1;
const STORE_NAME = "sync_queue";
const CACHE_STORE = "data_cache";

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE);
      }
    },
  });
}

export async function enqueue(entry: Omit<SyncEntry, "id">) {
  const db = await getDB();
  await db.add(STORE_NAME, entry);
}

export async function dequeue(): Promise<SyncEntry[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function removeEntry(id: number) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function pendingCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}

// Data cache for offline reads
export async function setCache(key: string, data: unknown) {
  const db = await getDB();
  await db.put(CACHE_STORE, data, key);
}

export async function getCache<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(CACHE_STORE, key) as Promise<T | undefined>;
}
```

- [ ] **Step 2: Create sync engine**

`src/lib/sync/engine.ts`:
```ts
import { createClient } from "@/lib/supabase/client";
import { dequeue, removeEntry } from "./queue";

export async function flushSyncQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const supabase = createClient();
  const entries = await dequeue();
  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      let error = null;

      switch (entry.operation) {
        case "insert": {
          const result = await supabase
            .from(entry.table)
            .insert(entry.payload);
          error = result.error;
          break;
        }
        case "update": {
          const { id, ...rest } = entry.payload;
          const result = await supabase
            .from(entry.table)
            .update(rest)
            .eq("id", id);
          error = result.error;
          break;
        }
        case "delete": {
          const result = await supabase
            .from(entry.table)
            .delete()
            .eq("id", entry.payload.id);
          error = result.error;
          break;
        }
        case "rpc": {
          const { functionName, args } = entry.payload as {
            functionName: string;
            args: Record<string, unknown>;
          };
          const result = await supabase.rpc(functionName, args);
          error = result.error;
          break;
        }
      }

      if (error) {
        console.error(`Sync failed for entry ${entry.id}:`, error);
        failed++;
      } else {
        if (entry.id) await removeEntry(entry.id);
        synced++;
      }
    } catch (err) {
      console.error(`Sync exception for entry ${entry.id}:`, err);
      failed++;
    }
  }

  return { synced, failed };
}
```

- [ ] **Step 3: Create sync hooks**

`src/lib/sync/hooks.ts`:
```ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { pendingCount } from "./queue";
import { flushSyncQueue } from "./engine";

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

export function useSyncStatus() {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const checkPending = useCallback(async () => {
    const count = await pendingCount();
    setPending(count);
  }, []);

  // Check pending count periodically
  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [checkPending]);

  // Auto-flush when coming back online
  useEffect(() => {
    if (online && pending > 0 && !syncing) {
      setSyncing(true);
      flushSyncQueue().then(({ synced, failed }) => {
        setSyncing(false);
        checkPending();
        if (failed > 0) {
          console.warn(`Sync: ${synced} synced, ${failed} failed`);
        }
      });
    }
  }, [online, pending, syncing, checkPending]);

  const status: "synced" | "pending" | "offline" = !online
    ? "offline"
    : pending > 0
    ? "pending"
    : "synced";

  return { status, pending, syncing };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/sync/
git commit -m "feat: add offline sync system (IndexedDB queue, sync engine, status hooks)"
```

---

## Task 15: Wire Sync Into Sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Update Sidebar to use live sync status**

In `src/components/Sidebar.tsx`, replace the hardcoded `<SyncIndicator status="synced" />` with the real hook:

Add import at top:
```tsx
import { useSyncStatus } from "@/lib/sync/hooks";
```

Inside the component, add:
```tsx
const { status, pending } = useSyncStatus();
```

Replace the `<SyncIndicator>` line with:
```tsx
<SyncIndicator status={status} pendingCount={pending} />
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: wire live sync status into Sidebar indicator"
```

---

## Task 16: PWA Setup

**Files:**
- Create: `app/manifest.ts`, `public/icons/icon-192x192.png`, `public/icons/icon-512x512.png`
- Modify: `next.config.ts`

- [ ] **Step 1: Create PWA manifest**

`app/manifest.ts`:
```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sweet Delights Bakery",
    short_name: "Sweet Delights",
    description: "Bakery POS & Inventory Management",
    start_url: "/billing",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
```

- [ ] **Step 2: Configure next-pwa in next.config.ts**

`next.config.ts`:
```ts
import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
```

- [ ] **Step 3: Create placeholder PWA icons**

Generate simple placeholder PNG icons (192x192 and 512x512). For now, create them as simple colored squares using a canvas script or download from a generator. The user should replace these with actual bakery branding later.

```bash
mkdir -p public/icons
# Placeholder: use a simple 1-pixel PNG scaled up, or generate via canvas
# For now, create empty placeholder files that the user will replace
touch public/icons/icon-192x192.png
touch public/icons/icon-512x512.png
```

Note: These must be replaced with real PNG icons before production deployment. A simple approach is to use any online PWA icon generator with the bakery logo.

- [ ] **Step 4: Commit**

```bash
git add app/manifest.ts next.config.ts public/icons/
git commit -m "feat: add PWA support (manifest, service worker config, icons)"
```

---

## Task 17: Integration Test & Verify

- [ ] **Step 1: Set up Supabase project**

1. Create a project at supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/seed.sql` in SQL Editor
4. Create first admin user: Authentication → Users → Invite user → then insert into `employees` table via SQL Editor:
```sql
insert into employees (id, name, email, role)
values ('<user-uuid-from-auth>', 'Admin User', 'admin@example.com', 'admin');
```

- [ ] **Step 2: Configure .env.local**

Copy `.env.local.example` to `.env.local` and fill in Supabase URL + anon key from project settings.

- [ ] **Step 3: Start dev server and verify**

```bash
npm run dev
```

Verify:
1. Visit `localhost:3000` → redirects to `/login`
2. Login with admin credentials → redirects to `/billing`
3. Billing page shows products, can add to cart, checkout works
4. Inventory page shows products table with CRUD (admin)
5. Customers page shows customer cards with CRUD
6. Orders page shows order history with receipt view
7. Sidebar navigation works, mobile responsive
8. Logout works

- [ ] **Step 4: Test Cloudflare Tunnel**

```bash
cloudflared tunnel --url http://localhost:3000
```

Share the generated URL with the client for review.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Sweet Delights Bakery POS restructure"
```
