-- Kisankendra production schema (PostgreSQL 14+ / Supabase)
-- Normalised schema for the marketplace + partner-shop ERP/CRM.
-- The Phase 1 development runtime uses a JSON store with identical
-- collection names (see README "Data layer"); this file is the production
-- target and the source of truth for table/column naming.
--
-- Conventions: UUID primary keys, timestamptz timestamps, money in integer
-- paise (amount_paise), soft references avoided — real foreign keys.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------- users
create table if not exists roles (
  id text primary key,               -- farmer | shop_owner | shop_staff | admin
  description text not null default ''
);

create table if not exists permissions (
  id text primary key,               -- orders | customers | inventory | finance
  description text not null default ''
);

create table if not exists role_permissions (
  role_id text not null references roles(id),
  permission_id text not null references permissions(id),
  primary key (role_id, permission_id)
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role_id text not null references roles(id),
  name text not null,
  email citext unique,
  mobile text not null unique,
  password_hash text not null,
  language text not null default 'en' check (language in ('en','hi')),
  village text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  avatar_url text,
  preferred_contact text not null default 'call',
  notes text not null default ''
);

create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists idx_sessions_user on sessions(user_id);

create table if not exists delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  customer_id uuid,
  label text not null default 'Home',
  name text not null,
  mobile text not null,
  village text not null,
  address_line text not null,
  delivery_type text not null default 'home' check (delivery_type in ('home','field')),
  instructions text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- shops
create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text not null,
  mobile text not null,
  email text,
  address text not null default '',
  villages text[] not null default '{}',
  status text not null default 'Pending'
    check (status in ('Pending','Under Review','Approved','Suspended','Rejected')),
  tax_details text not null default '',
  delivery_capable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shop_staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);
create index if not exists idx_shop_staff_shop on shop_staff(shop_id);

create table if not exists shop_licences (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  licence_type text not null check (licence_type in ('pesticide','fertilizer')),
  licence_number text not null,
  expiry_date date,
  verified boolean not null default false,
  verified_by uuid references users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_licences_shop on shop_licences(shop_id);

-- ------------------------------------------------------------- customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  customer_code text not null,
  name text not null,
  mobile text not null,
  village text not null default '',
  linked_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  unique (shop_id, customer_code),
  unique (shop_id, mobile)
);
create index if not exists idx_customers_shop on customers(shop_id);
create index if not exists idx_customers_mobile on customers(mobile);

create table if not exists customer_consent (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  channel text not null default 'marketing',
  consented boolean not null default false,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references users(id)
);

create table if not exists customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  note text not null,
  author_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------- catalogue
create table if not exists categories (
  id text primary key,               -- Pesticides | Fertilizers
  label_en text not null,
  label_hi text not null default ''
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  category_id text not null references categories(id),
  sku text not null unique,
  description text not null default '',
  label_info text not null default '',
  warnings text not null default '',
  crops text[] not null default '{}',
  pack_sizes jsonb not null default '[]',  -- [{size, price_paise}]
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_brand on products(brand);

-- -------------------------------------------------------------- inventory
create table if not exists shop_inventory (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  product_id uuid not null references products(id),
  pack_size text not null,
  sku text not null,
  batch text not null default '',
  expiry_date date,
  cost_paise integer not null default 0,        -- confidential: owner/finance only
  price_paise integer not null default 0,
  stock integer not null default 0 check (stock >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, product_id, pack_size, batch)
);
create index if not exists idx_inventory_shop on shop_inventory(shop_id);
create index if not exists idx_inventory_product on shop_inventory(product_id);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  inventory_id uuid not null references shop_inventory(id) on delete cascade,
  product_id uuid not null references products(id),
  delta integer not null,
  reason text not null,
  actor_id uuid references users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_movements_shop on stock_movements(shop_id);

-- ---------------------------------------------------------------- orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  farmer_id uuid references users(id),
  customer_id uuid references customers(id),
  shop_id uuid references shops(id),
  source text not null default 'platform' check (source in ('platform','manual')),
  status text not null default 'Unassigned'
    check (status in ('Pending','Accepted','Processing','Ready for Dispatch',
                      'Out for Delivery','Delivered','Cancelled','Returned','Unassigned')),
  customer_name text not null,
  mobile text not null,
  village text not null,
  address_line text not null default '',
  delivery_type text not null default 'home' check (delivery_type in ('home','field')),
  instructions text,
  items_total_paise integer not null default 0,
  delivery_fee_paise integer not null default 0,
  tax_paise integer not null default 0,
  total_paise integer not null default 0,
  supply_total_paise integer not null default 0,
  commission_paise integer not null default 0,
  payment_method text not null default 'COD' check (payment_method in ('COD','Manual','Gateway')),
  payment_status text not null default 'Pending'
    check (payment_status in ('Pending','Confirmed','Paid','Refunded','Failed')),
  unassigned_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_shop on orders(shop_id);
create index if not exists idx_orders_farmer on orders(farmer_id);
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_status on orders(status);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,
  pack_size text not null,
  qty integer not null check (qty > 0),
  price_paise integer not null,
  cost_paise integer,
  line_total_paise integer not null
);
create index if not exists idx_items_order on order_items(order_id);

create table if not exists order_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  shop_id uuid not null references shops(id),
  status text not null default 'Assigned' check (status in ('Assigned','Accepted','Rejected')),
  score integer not null default 0,
  reason text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_assignments_order on order_assignments(order_id);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  actor_id uuid references users(id),
  actor_role text not null default '',
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_history_order on order_status_history(order_id);

create table if not exists delivery_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  event text not null,                -- dispatched | out_for_delivery | delivered | failed | returned
  note text,
  actor_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------- money & billing
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method text not null,
  status text not null default 'Pending',
  amount_paise integer not null,
  gateway_ref text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  payment_id uuid references payments(id),
  amount_paise integer not null,
  reason text not null default '',
  status text not null default 'Requested',
  processed_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id),
  period_start date not null,
  period_end date not null,
  gross_paise integer not null default 0,
  commission_paise integer not null default 0,
  net_payable_paise integer not null default 0,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

create table if not exists platform_config (
  key text primary key,               -- commission_pct | delivery_fee_paise | tax_pct | refund_note | low_stock_threshold
  value jsonb not null
);

create table if not exists shop_commercial_terms (
  shop_id uuid primary key references shops(id) on delete cascade,
  commission_pct numeric not null,
  settlement_cycle_days integer not null default 7,
  terms_note text not null default ''
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  plan text not null,
  price_paise integer not null default 0,
  status text not null default 'Trial',
  started_at timestamptz not null default now(),
  renews_at timestamptz
);

-- --------------------------------------------------------------- support
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'solution' check (type in ('solution','support','crop')),
  farmer_id uuid references users(id),
  name text not null,
  mobile text not null,
  crop text,
  stage text,
  village text,
  symptoms text,
  description text not null,
  image_url text,
  status text not null default 'Open' check (status in ('Open','In Progress','Closed')),
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crop_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  expert_user_id uuid references users(id),
  resolution_note text,
  resolved_at timestamptz
);

create table if not exists disease_library (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  disease text not null,
  symptoms text not null,
  causes text not null,
  prevention text not null,
  source_note text not null default 'Curated reference information; not a definitive diagnosis.',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- system
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  text text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  type text not null default 'service',
  text text not null,
  due_date date not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  actor_role text not null default '',
  action text not null,
  entity text not null,
  entity_id text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_entity on audit_logs(entity, entity_id);
