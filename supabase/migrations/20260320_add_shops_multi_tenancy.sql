-- ══════════════════════════════════════
-- 1. Create shops table
-- ══════════════════════════════════════

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  created_at timestamptz default now()
);

-- Insert default shop
insert into shops (id, name, address, phone) values
  ('00000000-0000-0000-0000-000000000001', 'The Cakeifyy', 'Shop Address Line 1', '+91-XXXXXXXXXX')
on conflict (id) do nothing;

-- ══════════════════════════════════════
-- 2. Add shop_id columns
-- ══════════════════════════════════════

alter table employees add column if not exists shop_id uuid references shops(id);
alter table categories add column if not exists shop_id uuid references shops(id);
alter table products add column if not exists shop_id uuid references shops(id);
alter table customers add column if not exists shop_id uuid references shops(id);
alter table orders add column if not exists shop_id uuid references shops(id);

-- ══════════════════════════════════════
-- 3. Backfill existing rows to default shop
-- ══════════════════════════════════════

update employees set shop_id = '00000000-0000-0000-0000-000000000001' where shop_id is null;
update categories set shop_id = '00000000-0000-0000-0000-000000000001' where shop_id is null;
update products set shop_id = '00000000-0000-0000-0000-000000000001' where shop_id is null;
update customers set shop_id = '00000000-0000-0000-0000-000000000001' where shop_id is null;
update orders set shop_id = '00000000-0000-0000-0000-000000000001' where shop_id is null;

-- ══════════════════════════════════════
-- 4. Make shop_id NOT NULL now that all rows are backfilled
-- ══════════════════════════════════════

alter table employees alter column shop_id set not null;
alter table categories alter column shop_id set not null;
alter table products alter column shop_id set not null;
alter table customers alter column shop_id set not null;
alter table orders alter column shop_id set not null;

-- ══════════════════════════════════════
-- 5. Indexes for RLS performance
-- ══════════════════════════════════════

create index if not exists idx_employees_shop_id on employees(shop_id);
create index if not exists idx_categories_shop_id on categories(shop_id);
create index if not exists idx_products_shop_id on products(shop_id);
create index if not exists idx_customers_shop_id on customers(shop_id);
create index if not exists idx_orders_shop_id on orders(shop_id);

-- ══════════════════════════════════════
-- 6. Helper functions
-- ══════════════════════════════════════

create or replace function get_user_shop_id()
returns uuid as $$
  select shop_id from employees where id = auth.uid();
$$ language sql security definer;

-- ══════════════════════════════════════
-- 7. Auto-populate shop_id trigger
-- ══════════════════════════════════════

create or replace function set_shop_id()
returns trigger as $$
begin
  if new.shop_id is null then
    new.shop_id := get_user_shop_id();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_categories_shop_id on categories;
create trigger trg_categories_shop_id before insert on categories
  for each row execute function set_shop_id();

drop trigger if exists trg_products_shop_id on products;
create trigger trg_products_shop_id before insert on products
  for each row execute function set_shop_id();

drop trigger if exists trg_customers_shop_id on customers;
create trigger trg_customers_shop_id before insert on customers
  for each row execute function set_shop_id();

drop trigger if exists trg_orders_shop_id on orders;
create trigger trg_orders_shop_id before insert on orders
  for each row execute function set_shop_id();

-- ══════════════════════════════════════
-- 8. Enable RLS on shops
-- ══════════════════════════════════════

alter table shops enable row level security;

create policy "shops_select" on shops
  for select using (id = get_user_shop_id());

create policy "shops_admin_update" on shops
  for update using (get_user_role() = 'admin' and id = get_user_shop_id());

-- ══════════════════════════════════════
-- 9. Drop old RLS policies and create new shop-scoped ones
-- ══════════════════════════════════════

-- Employees
drop policy if exists "employees_select" on employees;
create policy "employees_select" on employees
  for select using (shop_id = get_user_shop_id());

-- Categories
drop policy if exists "categories_select" on categories;
create policy "categories_select" on categories
  for select using (shop_id = get_user_shop_id());

drop policy if exists "categories_admin_insert" on categories;
create policy "categories_admin_insert" on categories
  for insert with check (get_user_role() = 'admin' and (shop_id is null or shop_id = get_user_shop_id()));

drop policy if exists "categories_admin_update" on categories;
create policy "categories_admin_update" on categories
  for update using (get_user_role() = 'admin' and shop_id = get_user_shop_id());

drop policy if exists "categories_admin_delete" on categories;
create policy "categories_admin_delete" on categories
  for delete using (get_user_role() = 'admin' and shop_id = get_user_shop_id());

-- Products
drop policy if exists "products_select" on products;
create policy "products_select" on products
  for select using (shop_id = get_user_shop_id());

drop policy if exists "products_admin_insert" on products;
create policy "products_admin_insert" on products
  for insert with check (get_user_role() = 'admin' and (shop_id is null or shop_id = get_user_shop_id()));

drop policy if exists "products_admin_update" on products;
create policy "products_admin_update" on products
  for update using (get_user_role() = 'admin' and shop_id = get_user_shop_id());

drop policy if exists "products_admin_delete" on products;
create policy "products_admin_delete" on products
  for delete using (get_user_role() = 'admin' and shop_id = get_user_shop_id());

-- Customers
drop policy if exists "customers_select" on customers;
create policy "customers_select" on customers
  for select using (shop_id = get_user_shop_id());

drop policy if exists "customers_insert" on customers;
create policy "customers_insert" on customers
  for insert with check (shop_id is null or shop_id = get_user_shop_id());

drop policy if exists "customers_update" on customers;
create policy "customers_update" on customers
  for update using (shop_id = get_user_shop_id());

drop policy if exists "customers_delete" on customers;
create policy "customers_delete" on customers
  for delete using (shop_id = get_user_shop_id());

-- Orders
drop policy if exists "orders_select" on orders;
create policy "orders_select" on orders
  for select using (shop_id = get_user_shop_id());

drop policy if exists "orders_insert" on orders;
create policy "orders_insert" on orders
  for insert with check (shop_id is null or shop_id = get_user_shop_id());

drop policy if exists "orders_admin_delete" on orders;
create policy "orders_admin_delete" on orders
  for delete using (get_user_role() = 'admin' and shop_id = get_user_shop_id());

-- Order items
drop policy if exists "order_items_select" on order_items;
create policy "order_items_select" on order_items
  for select using (exists (select 1 from orders where id = order_id and shop_id = get_user_shop_id()));

drop policy if exists "order_items_insert" on order_items;
create policy "order_items_insert" on order_items
  for insert with check (exists (select 1 from orders where id = order_id and shop_id = get_user_shop_id()));

-- ══════════════════════════════════════
-- 10. Audit log table
-- ══════════════════════════════════════

create table if not exists audit_log (
  id bigint generated always as identity primary key,
  shop_id uuid not null references shops(id),
  user_id uuid references employees(id),
  user_name text not null,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audit_log_shop_id on audit_log(shop_id);
create index if not exists idx_audit_log_created_at on audit_log(created_at desc);

alter table audit_log enable row level security;

create policy "audit_log_select" on audit_log
  for select using (shop_id = get_user_shop_id());

create policy "audit_log_insert" on audit_log
  for insert with check (shop_id = get_user_shop_id());
