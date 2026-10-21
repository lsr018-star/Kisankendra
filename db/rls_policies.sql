-- Kisankendra row-level security (RLS) example policies for Supabase/Postgres.
--
-- Model: the API/server is the primary enforcement point (every route checks
-- the session role and shop tenancy). These policies are defence-in-depth for
-- direct database access (e.g. Supabase client with the user's JWT).
--
-- Convention: the caller's identity is exposed through Postgres settings set
-- by the server per transaction, or through auth claims on Supabase:
--   app.user_id  (uuid)   - the logged-in user
--   app.role     (text)   - farmer | shop_owner | shop_staff | admin
--   app.shop_id  (uuid)   - the shop the caller belongs to (shop roles)
-- Helper functions read them with current_setting(..., true).

create or replace function app_user_id() returns uuid
  language sql stable as $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

create or replace function app_role() returns text
  language sql stable as $$ select nullif(current_setting('app.role', true), '') $$;

create or replace function app_shop_id() returns uuid
  language sql stable as $$ select nullif(current_setting('app.shop_id', true), '')::uuid $$;

-- ------------------------------------------------------------- customers
alter table customers enable row level security;

-- A shop sees and edits only its own customers. Admin sees all. Farmers never
-- read the CRM table directly.
create policy customers_shop_isolation on customers
  using (
    app_role() = 'admin'
    or (app_role() in ('shop_owner', 'shop_staff') and shop_id = app_shop_id())
  )
  with check (
    app_role() = 'admin'
    or (app_role() in ('shop_owner', 'shop_staff') and shop_id = app_shop_id())
  );

-- --------------------------------------------------------------- inventory
alter table shop_inventory enable row level security;

-- Inventory rows are readable by their shop; selling prices are public via
-- the catalogue view, but cost_paise must be protected by column privileges:
--   revoke select (cost_paise) on shop_inventory from shop_staff_role;
-- The policy below scopes rows; combine with column grants per role.
create policy inventory_shop_isolation on shop_inventory
  using (
    app_role() = 'admin'
    or shop_id = app_shop_id()
    or app_role() = 'farmer'  -- farmers read price/stock through a public view, not cost
  )
  with check (
    app_role() = 'admin'
    or (app_role() = 'shop_owner' and shop_id = app_shop_id())
  );

-- ----------------------------------------------------------------- orders
alter table orders enable row level security;

-- Farmers see only their own orders. A shop sees only orders assigned to it.
-- Admin sees everything.
create policy orders_visibility on orders
  using (
    app_role() = 'admin'
    or (app_role() = 'farmer' and farmer_id = app_user_id())
    or (app_role() in ('shop_owner', 'shop_staff') and shop_id = app_shop_id())
  )
  with check (
    app_role() = 'admin'
    or (app_role() = 'farmer' and farmer_id = app_user_id())
    or (app_role() in ('shop_owner', 'shop_staff') and shop_id = app_shop_id())
  );

alter table order_items enable row level security;
create policy order_items_follow_order on order_items
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (
          app_role() = 'admin'
          or (app_role() = 'farmer' and o.farmer_id = app_user_id())
          or (app_role() in ('shop_owner', 'shop_staff') and o.shop_id = app_shop_id())
        )
    )
  );

alter table order_status_history enable row level security;
create policy history_follow_order on order_status_history
  using (
    exists (
      select 1 from orders o
      where o.id = order_status_history.order_id
        and (
          app_role() = 'admin'
          or (app_role() = 'farmer' and o.farmer_id = app_user_id())
          or (app_role() in ('shop_owner', 'shop_staff') and o.shop_id = app_shop_id())
        )
    )
  );

-- ------------------------------------------------------------------ shops
alter table shops enable row level security;

-- Shop directory basics are public (name, villages, status) so the
-- storefront can render service areas; licence numbers stay admin/shop only
-- (they live in shop_licences with its own policy).
create policy shops_public_read on shops
  for select using (true);

create policy shops_admin_write on shops
  for all using (app_role() = 'admin' or id = app_shop_id())
  with check (app_role() = 'admin' or id = app_shop_id());

alter table shop_licences enable row level security;
create policy licences_private on shop_licences
  using (app_role() = 'admin' or shop_id = app_shop_id())
  with check (app_role() = 'admin');

-- -------------------------------------------------------- support & system
alter table support_tickets enable row level security;
create policy tickets_visibility on support_tickets
  using (
    app_role() = 'admin'
    or (app_role() = 'farmer' and farmer_id = app_user_id())
  )
  with check (
    app_role() = 'admin'
    or (app_role() = 'farmer' and farmer_id = app_user_id())
    or app_role() is null  -- public Solution Box submissions via the server API
  );

alter table audit_logs enable row level security;
create policy audit_admin_only on audit_logs
  using (app_role() = 'admin')
  with check (app_role() = 'admin');

alter table reminders enable row level security;
create policy reminders_shop_isolation on reminders
  using (app_role() = 'admin' or shop_id = app_shop_id())
  with check (app_role() = 'admin' or shop_id = app_shop_id());

-- Catalogue and disease library are public reference data.
alter table products enable row level security;
create policy products_public_read on products for select using (active = true or app_role() = 'admin');
create policy products_admin_write on products for all using (app_role() = 'admin') with check (app_role() = 'admin');

alter table disease_library enable row level security;
create policy diseases_public_read on disease_library for select using (true);
create policy diseases_admin_write on disease_library for all using (app_role() = 'admin') with check (app_role() = 'admin');
