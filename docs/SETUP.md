# Sweet Delights Bakery POS — Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm installed
- Cloudflare tunnel (`brew install cloudflared`) — for sharing with clients

## 1. Install Dependencies

```bash
npm install
```

## 2. Environment Variables

Create `.env.local` in the project root (if not already present):

```
NEXT_PUBLIC_SUPABASE_URL=https://cacoengsqadzjinxciex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_lq8Uy-MLNw5WtzXkHL2-Tw_Rnof1Y4-
```

## 3. Database Setup (First Time Only)

The database is already set up on Supabase. If you ever need to reset it:

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/schema.sql` — creates tables, RPC functions, RLS policies
3. Run `supabase/seed.sql` — inserts categories and sample products

To create a new admin user:

```bash
node supabase/create-admin.mjs <service_role_key> "email@example.com" "Password123" "Name"
```

Find the service role key at: Supabase Dashboard → Settings → API → `service_role`

## 4. Start the Dev Server

```bash
npm run dev
```

App runs at **http://localhost:3000**

## 5. Share via Cloudflare Tunnel

To get a public URL for client review:

```bash
cloudflared tunnel --url http://localhost:3000
```

Wait a few seconds — it will output a URL like:

```
https://random-words.trycloudflare.com
```

Share that URL with your client. The tunnel stays active as long as the command is running. Press `Ctrl+C` to stop.

## 6. Stop Everything

- Dev server: `Ctrl+C` in the terminal running `npm run dev`
- Tunnel: `Ctrl+C` in the terminal running `cloudflared tunnel`

Or kill both from any terminal:

```bash
pkill -f "next dev"
pkill -f "cloudflared tunnel"
```

## Login Credentials

| Email | Password | Role |
|---|---|---|
| admin@sweetdelights.com | Admin@123 | Admin |

## Creating Additional Users

Use the create-admin script with different role values. To create a cashier, edit the script or run SQL directly:

```sql
-- First create the auth user in Supabase Dashboard → Authentication → Users → Add User
-- Then link them as an employee:
INSERT INTO employees (id, name, email, role)
VALUES ('<uuid-from-auth>', 'Cashier Name', 'cashier@email.com', 'cashier');
```

## Project Structure

```
src/
  app/                  → Next.js pages and layouts
    (auth)/             → Login page
    (dashboard)/        → Protected pages (billing, inventory, customers, orders)
  features/             → Feature modules with business logic
    auth/               → Auth provider, login form, role guard
    billing/            → POS module (product grid, cart, checkout)
    inventory/          → Product management
    customers/          → Customer management
    orders/             → Order history, receipts
  components/           → Shared UI components
  hooks/                → Data hooks (useProducts, useOrders, etc.)
  lib/
    supabase/           → Supabase client config
    sync/               → Offline sync (IndexedDB queue + engine)
    utils.ts            → Helpers, formatters, shop config
  types/                → TypeScript types
supabase/
  schema.sql            → Database schema
  seed.sql              → Seed data
  create-admin.mjs      → Admin user creation script
```
