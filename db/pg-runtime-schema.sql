-- Kisankendra — PostgreSQL runtime schema for the application data layer
-- (lib/pg.ts). Applied automatically on boot when DATABASE_URL is set, and
-- manually by scripts/apply-schema.mjs.
--
-- Design: one table per application collection. Each row keeps the full
-- record as JSONB (`doc`) with the record id as the primary key; shop-scoped
-- tables also expose `shop_id` as a generated column so Row Level Security
-- can enforce tenant isolation at the database layer (defense in depth —
-- the application enforces tenancy server-side as well).
--
-- This complements db/schema.sql + db/rls_policies.sql (the normalised
-- production schema). Both are applied to the same database; see
-- docs/CHANGE-GUIDE.md for the migration path from this bridge to the
-- fully normalised tables.

create table if not exists kk_meta (
  key text primary key,
  doc jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists users (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists shops (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists products (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists diseases (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists tickets (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists stock_movements (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists notifications (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists audit_logs (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists reminders (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists sessions (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists assignments (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists status_history (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());
create table if not exists plans (id text primary key, doc jsonb not null, updated_at timestamptz not null default now());

create table if not exists inventory (
  id text primary key, doc jsonb not null, updated_at timestamptz not null default now(),
  shop_id text generated always as (doc->>'shopId') stored
);
create table if not exists customers (
  id text primary key, doc jsonb not null, updated_at timestamptz not null default now(),
  shop_id text generated always as (doc->>'shopId') stored
);
create table if not exists orders (
  id text primary key, doc jsonb not null, updated_at timestamptz not null default now(),
  shop_id text generated always as (doc->>'shopId') stored
);
create table if not exists subscriptions (
  id text primary key, doc jsonb not null, updated_at timestamptz not null default now(),
  shop_id text generated always as (doc->>'shopId') stored
);
create table if not exists billing_records (
  id text primary key, doc jsonb not null, updated_at timestamptz not null default now(),
  shop_id text generated always as (doc->>'shopId') stored
);
create table if not exists payments (
  id text primary key, doc jsonb not null, updated_at timestamptz not null default now(),
  shop_id text generated always as (doc->>'shopId') stored
);
create table if not exists refunds (
  id text primary key, doc jsonb not null, updated_at timestamptz not null default now(),
  shop_id text generated always as (doc->>'shopId') stored
);
create table if not exists settlements (
  id text primary key, doc jsonb not null, updated_at timestamptz not null default now(),
  shop_id text generated always as (doc->>'shopId') stored
);

create index if not exists idx_orders_shop on orders (shop_id);
create index if not exists idx_inventory_shop on inventory (shop_id);
create index if not exists idx_customers_shop on customers (shop_id);
create index if not exists idx_payments_shop on payments (shop_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (tenant isolation at the database layer)
--
-- The application role `kk_runtime` sees a shop-scoped row only when the
-- session sets app.current_shop to that shop, or app.bypass_rls = 'on'
-- (set by the app's connection pool for its own service queries — the app
-- still enforces tenancy in code on every request). Any other session
-- (reports, support tools, a future per-shop login) is confined to its shop.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'kk_runtime') then
    create role kk_runtime login password 'kk_runtime_dev_only';
  end if;
end $$;

grant select, insert, update, delete on all tables in schema public to kk_runtime;

alter table inventory enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table subscriptions enable row level security;
alter table billing_records enable row level security;
alter table payments enable row level security;
alter table refunds enable row level security;
alter table settlements enable row level security;

drop policy if exists tenant_isolation on inventory;
drop policy if exists tenant_isolation on customers;
drop policy if exists tenant_isolation on orders;
drop policy if exists tenant_isolation on subscriptions;
drop policy if exists tenant_isolation on billing_records;
drop policy if exists tenant_isolation on payments;
drop policy if exists tenant_isolation on refunds;
drop policy if exists tenant_isolation on settlements;

create policy tenant_isolation on inventory for all to kk_runtime
  using (current_setting('app.bypass_rls', true) = 'on' or shop_id = current_setting('app.current_shop', true));
create policy tenant_isolation on customers for all to kk_runtime
  using (current_setting('app.bypass_rls', true) = 'on' or shop_id = current_setting('app.current_shop', true));
create policy tenant_isolation on orders for all to kk_runtime
  using (current_setting('app.bypass_rls', true) = 'on' or shop_id = current_setting('app.current_shop', true));
create policy tenant_isolation on subscriptions for all to kk_runtime
  using (current_setting('app.bypass_rls', true) = 'on' or shop_id = current_setting('app.current_shop', true));
create policy tenant_isolation on billing_records for all to kk_runtime
  using (current_setting('app.bypass_rls', true) = 'on' or shop_id = current_setting('app.current_shop', true));
create policy tenant_isolation on payments for all to kk_runtime
  using (current_setting('app.bypass_rls', true) = 'on' or shop_id = current_setting('app.current_shop', true));
create policy tenant_isolation on refunds for all to kk_runtime
  using (current_setting('app.bypass_rls', true) = 'on' or shop_id = current_setting('app.current_shop', true));
create policy tenant_isolation on settlements for all to kk_runtime
  using (current_setting('app.bypass_rls', true) = 'on' or shop_id = current_setting('app.current_shop', true));
