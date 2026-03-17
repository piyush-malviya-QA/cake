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

-- Employees: all authenticated can read
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

-- Order items: all authenticated can read and insert
create policy "order_items_select" on order_items
  for select using (auth.uid() is not null);

create policy "order_items_insert" on order_items
  for insert with check (auth.uid() is not null);
