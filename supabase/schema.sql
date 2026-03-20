-- ══════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════

create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  created_at timestamptz default now()
);

create table employees (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'cashier')),
  shop_id uuid not null references shops(id),
  created_at timestamptz default now()
);

create table categories (
  id text primary key,
  name text not null,
  icon text not null,
  sort_order int default 0,
  shop_id uuid not null references shops(id)
);

create table products (
  id text primary key,
  cat_id text references categories(id) on delete restrict,
  name text not null,
  buy_price numeric not null default 0,
  sell_price numeric not null default 0,
  qty int not null default 0,
  shop_id uuid not null references shops(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table customers (
  id text primary key,
  name text not null,
  phone text not null,
  address text,
  shop_id uuid not null references shops(id),
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
  shop_id uuid not null references shops(id),
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

create table audit_log (
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

-- Indexes on shop_id for RLS performance
create index idx_employees_shop_id on employees(shop_id);
create index idx_categories_shop_id on categories(shop_id);
create index idx_products_shop_id on products(shop_id);
create index idx_customers_shop_id on customers(shop_id);
create index idx_orders_shop_id on orders(shop_id);
create index idx_audit_log_shop_id on audit_log(shop_id);
create index idx_audit_log_created_at on audit_log(created_at desc);

-- ══════════════════════════════════════
-- RPC: Atomic stock decrement (single item)
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
-- HELPER FUNCTIONS
-- ══════════════════════════════════════

-- Get current user's role
create or replace function get_user_role()
returns text as $$
  select role from employees where id = auth.uid();
$$ language sql security definer;

-- Get current user's shop_id
create or replace function get_user_shop_id()
returns uuid as $$
  select shop_id from employees where id = auth.uid();
$$ language sql security definer;

-- ══════════════════════════════════════
-- AUTO-POPULATE shop_id ON INSERT
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

create trigger trg_categories_shop_id before insert on categories
  for each row execute function set_shop_id();

create trigger trg_products_shop_id before insert on products
  for each row execute function set_shop_id();

create trigger trg_customers_shop_id before insert on customers
  for each row execute function set_shop_id();

create trigger trg_orders_shop_id before insert on orders
  for each row execute function set_shop_id();

-- ══════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════

alter table shops enable row level security;
alter table employees enable row level security;
alter table audit_log enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Shops: authenticated users can read their own shop
create policy "shops_select" on shops
  for select using (id = get_user_shop_id());

create policy "shops_admin_update" on shops
  for update using (get_user_role() = 'admin' and id = get_user_shop_id());

-- Audit log: same shop can read, authenticated can insert
create policy "audit_log_select" on audit_log
  for select using (shop_id = get_user_shop_id());

create policy "audit_log_insert" on audit_log
  for insert with check (shop_id = get_user_shop_id());

-- Employees: can read employees in same shop
create policy "employees_select" on employees
  for select using (shop_id = get_user_shop_id());

-- Categories: same shop can read, admin can mutate
create policy "categories_select" on categories
  for select using (shop_id = get_user_shop_id());

create policy "categories_admin_insert" on categories
  for insert with check (get_user_role() = 'admin' and (shop_id is null or shop_id = get_user_shop_id()));

create policy "categories_admin_update" on categories
  for update using (get_user_role() = 'admin' and shop_id = get_user_shop_id());

create policy "categories_admin_delete" on categories
  for delete using (get_user_role() = 'admin' and shop_id = get_user_shop_id());

-- Products: same shop can read, admin can mutate
create policy "products_select" on products
  for select using (shop_id = get_user_shop_id());

create policy "products_admin_insert" on products
  for insert with check (get_user_role() = 'admin' and (shop_id is null or shop_id = get_user_shop_id()));

create policy "products_admin_update" on products
  for update using (get_user_role() = 'admin' and shop_id = get_user_shop_id());

create policy "products_admin_delete" on products
  for delete using (get_user_role() = 'admin' and shop_id = get_user_shop_id());

-- Customers: same shop can read and mutate
create policy "customers_select" on customers
  for select using (shop_id = get_user_shop_id());

create policy "customers_insert" on customers
  for insert with check (shop_id is null or shop_id = get_user_shop_id());

create policy "customers_update" on customers
  for update using (shop_id = get_user_shop_id());

create policy "customers_delete" on customers
  for delete using (shop_id = get_user_shop_id());

-- Orders: same shop can read and insert, admin can delete
create policy "orders_select" on orders
  for select using (shop_id = get_user_shop_id());

create policy "orders_insert" on orders
  for insert with check (shop_id is null or shop_id = get_user_shop_id());

create policy "orders_admin_delete" on orders
  for delete using (get_user_role() = 'admin' and shop_id = get_user_shop_id());

-- Order items: scoped through parent order's shop
create policy "order_items_select" on order_items
  for select using (exists (select 1 from orders where id = order_id and shop_id = get_user_shop_id()));

create policy "order_items_insert" on order_items
  for insert with check (exists (select 1 from orders where id = order_id and shop_id = get_user_shop_id()));
