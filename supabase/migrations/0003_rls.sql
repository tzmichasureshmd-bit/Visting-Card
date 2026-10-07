-- ═══════════════════════════════════════════════════════════════════════════
-- DV CARD — 0003 Row Level Security
--
-- Multi-tenancy (section 59) is enforced HERE, in the database, not in
-- application code. Every table is switched to RLS and given explicit policies.
-- Application code may still add checks, but it is not the security boundary:
-- a bug in a route handler cannot leak another tenant's rows because the anon
-- or user token simply does not satisfy the policy.
--
-- Public (unauthenticated) reachability is deliberately narrow: a visitor may
-- read a *published* card and its content, and may submit a lead or appointment
-- request. Everything else requires ownership, team membership, or admin.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Helpers ─────────────────────────────────────────────────────────────────

create or replace function public.current_user_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select auth.uid();
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_reseller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'reseller'
  );
$$;

-- The authenticated user owns this card, OR their team owns it, OR they are admin.
create or replace function public.can_manage_card(p_card_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (select 1 from public.cards where id = p_card_id and user_id = auth.uid())
    or exists (
      select 1 from public.cards c
      join public.teams t on t.id = c.team_id
      where c.id = p_card_id and t.owner_user_id = auth.uid()
    );
$$;

-- Readable by anyone. Subscription expiry is handled by the sweeper flipping
-- `cards.status` to 'suspended', so this stays a cheap indexed lookup.
create or replace function public.is_card_public(p_card_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cards
    where id = p_card_id and status = 'published' and deleted_at is null
  );
$$;

create or replace function public.can_manage_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (select 1 from public.teams where id = p_team_id and owner_user_id = auth.uid())
    or exists (
      select 1 from public.team_members m
      where m.team_id = p_team_id and m.user_id = auth.uid() and m.is_active
    );
$$;

-- A reseller may only act on customers they are actually assigned.
create or replace function public.reseller_manages(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.reseller_customers rc
      join public.resellers r on r.id = rc.reseller_id
      where rc.user_id = p_user_id
        and r.user_id = auth.uid()
        and r.status = 'approved'
    );
$$;

-- Stops a signed-in user granting themselves a role or un-suspending their own
-- account by writing to `profiles` directly (section 57).
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an administrator can change a user role.'
        using errcode = '42501';
    end if;
    if new.status is distinct from old.status then
      raise exception 'Only an administrator can change account status.'
        using errcode = '42501';
    end if;
    if new.referred_by is distinct from old.referred_by then
      raise exception 'Referral attribution is set at signup and cannot be changed.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();


-- ── Enable RLS everywhere ───────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','themes','cards','card_sections','social_links','business_hours',
    'payment_configs','custom_domains','services','products','catalogues',
    'catalogue_items','portfolio_items','gallery_items','videos','reviews',
    'testimonials','offers','leads','lead_notes','appointments','analytics_events',
    'qr_codes','plans','subscriptions','payments','coupons','coupon_redemptions',
    'referrals','referral_rewards','referral_wallets','payout_requests',
    'resellers','reseller_customers','teams','team_members','notifications',
    'audit_logs','platform_settings','referral_config'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- profiles
-- ═══════════════════════════════════════════════════════════════════════════

create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- A signed-in user may edit their own row; the trigger above blocks the
-- privilege columns.
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_delete_self on public.profiles
  for delete to authenticated
  using (id = auth.uid() or public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- Catalogue reference data (needed publicly to render pricing)
-- ═══════════════════════════════════════════════════════════════════════════

create policy themes_read_active on public.themes
  for select to anon, authenticated
  using (is_active or public.is_admin());

create policy themes_admin_write on public.themes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy plans_read_active on public.plans
  for select to anon, authenticated
  using (is_active or public.is_admin());

create policy plans_admin_write on public.plans
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy platform_settings_read on public.platform_settings
  for select to anon, authenticated
  using (true);

create policy platform_settings_admin_write on public.platform_settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Referral configuration is readable (the UI explains the current rate) but
-- only an admin may change it.
create policy referral_config_read on public.referral_config
  for select to anon, authenticated
  using (true);

create policy referral_config_admin_write on public.referral_config
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- cards + owned content
-- ═══════════════════════════════════════════════════════════════════════════

create policy cards_read on public.cards
  for select to anon, authenticated
  using (public.is_card_public(id) or public.can_manage_card(id));

create policy cards_insert on public.cards
  for insert to authenticated
  with check (user_id = auth.uid());

create policy cards_update on public.cards
  for update to authenticated
  using (public.can_manage_card(id))
  with check (public.can_manage_card(id));

create policy cards_delete on public.cards
  for delete to authenticated
  using (public.can_manage_card(id));

-- Content tables all follow the same three-rule pattern: publicly readable when
-- the parent card is published, writable only by someone who manages it.
do $$
declare t text;
begin
  foreach t in array array[
    'card_sections','social_links','business_hours','payment_configs',
    'services','products','catalogues','catalogue_items','portfolio_items',
    'gallery_items','videos','reviews','testimonials','offers','qr_codes',
    'custom_domains'
  ] loop
    execute format(
      'create policy %1$s_public_read on public.%1$I for select to anon, authenticated
         using (public.can_manage_card(card_id) or public.is_card_public(card_id))', t);

    execute format(
      'create policy %1$s_insert on public.%1$I for insert to authenticated
         with check (public.can_manage_card(card_id))', t);

    execute format(
      'create policy %1$s_update on public.%1$I for update to authenticated
         using (public.can_manage_card(card_id)) with check (public.can_manage_card(card_id))', t);

    execute format(
      'create policy %1$s_delete on public.%1$I for delete to authenticated
         using (public.can_manage_card(card_id))', t);
  end loop;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- Leads & appointments
-- ═══════════════════════════════════════════════════════════════════════════

-- Visitors submit these; RLS still requires the card to be published AND to have
-- the relevant capability switched on.
create policy leads_public_submit on public.leads
  for insert to anon, authenticated
  with check (
    public.is_card_public(card_id)
    and exists (
      select 1 from public.cards c
      where c.id = leads.card_id and c.open_to_enquiries
    )
  );

create policy leads_owner_read on public.leads
  for select to authenticated
  using (public.can_manage_card(card_id));

create policy leads_owner_write on public.leads
  for update to authenticated
  using (public.can_manage_card(card_id))
  with check (public.can_manage_card(card_id));

create policy leads_owner_delete on public.leads
  for delete to authenticated
  using (public.can_manage_card(card_id));

create policy lead_notes_owner_all on public.lead_notes
  for all to authenticated
  using (exists (
    select 1 from public.leads l where l.id = lead_notes.lead_id
      and public.can_manage_card(l.card_id)
  ))
  with check (exists (
    select 1 from public.leads l where l.id = lead_notes.lead_id
      and public.can_manage_card(l.card_id)
  ));

create policy appointments_public_submit on public.appointments
  for insert to anon, authenticated
  with check (
    public.is_card_public(card_id)
    and exists (
      select 1 from public.cards c
      where c.id = appointments.card_id and c.open_to_appointments
    )
  );

create policy appointments_owner_read on public.appointments
  for select to authenticated
  using (public.can_manage_card(card_id));

create policy appointments_owner_write on public.appointments
  for update to authenticated
  using (public.can_manage_card(card_id))
  with check (public.can_manage_card(card_id));

create policy appointments_owner_delete on public.appointments
  for delete to authenticated
  using (public.can_manage_card(card_id));


-- ═══════════════════════════════════════════════════════════════════════════
-- Analytics
-- ═══════════════════════════════════════════════════════════════════════════

-- Tracked by the public card itself, so inserts come from anonymous visitors.
create policy analytics_public_insert on public.analytics_events
  for insert to anon, authenticated
  with check (public.is_card_public(card_id));

create policy analytics_owner_read on public.analytics_events
  for select to authenticated
  using (public.can_manage_card(card_id));


-- ═══════════════════════════════════════════════════════════════════════════
-- Billing (owner-only; the payment webhook uses the service role)
-- ═══════════════════════════════════════════════════════════════════════════

create policy subscriptions_owner_read on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy payments_owner_read on public.payments
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy coupons_public_read on public.coupons
  for select to anon, authenticated
  using (is_active or public.is_admin());

create policy coupons_admin_write on public.coupons
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy coupon_redemptions_owner_read on public.coupon_redemptions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- Referrals, rewards, wallet, payouts
--
-- Rewards and balances are written ONLY by the SECURITY DEFINER functions in
-- 0002, so there are deliberately no INSERT/UPDATE policies here. A compromised
-- client cannot mint itself commission.
-- ═══════════════════════════════════════════════════════════════════════════

create policy referrals_own_read on public.referrals
  for select to authenticated
  using (referrer_id = auth.uid() or referred_user_id = auth.uid() or public.is_admin());

create policy referral_rewards_own_read on public.referral_rewards
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy referral_rewards_admin_approve on public.referral_rewards
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy referral_wallets_own_read on public.referral_wallets
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy payout_requests_own_read on public.payout_requests
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy payout_requests_own_create on public.payout_requests
  for insert to authenticated
  with check (user_id = auth.uid());

-- Admins transition payout state and record who paid.
create policy payout_requests_admin_update on public.payout_requests
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- Resellers
-- ═══════════════════════════════════════════════════════════════════════════

create policy resellers_own_read on public.resellers
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Self-application: a user may request reseller status. The row is created with
-- status 'pending' and cannot be self-approved (guard below).
create policy resellers_self_apply on public.resellers
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

create policy resellers_admin_update on public.resellers
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy reseller_customers_reseller_read on public.reseller_customers
  for select to authenticated
  using (public.reseller_manages(user_id) or public.is_admin());

create policy reseller_customers_reseller_write on public.reseller_customers
  for insert to authenticated
  with check (
    exists (
      select 1 from public.resellers r
      where r.id = reseller_customers.reseller_id
        and r.user_id = auth.uid()
        and r.status = 'approved'
        and r.can_create_customers
    )
  );

create policy reseller_customers_admin_write on public.reseller_customers
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- Teams
-- ═══════════════════════════════════════════════════════════════════════════

create policy teams_read on public.teams
  for select to authenticated
  using (public.can_manage_team(id));

create policy teams_insert on public.teams
  for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy teams_update on public.teams
  for update to authenticated
  using (public.can_manage_team(id)) with check (public.can_manage_team(id));

create policy teams_delete on public.teams
  for delete to authenticated
  using (owner_user_id = auth.uid() or public.is_admin());

create policy team_members_read on public.team_members
  for select to authenticated
  using (public.can_manage_team(team_id));

create policy team_members_insert on public.team_members
  for insert to authenticated
  with check (public.can_manage_team(team_id));

create policy team_members_update on public.team_members
  for update to authenticated
  using (public.can_manage_team(team_id)) with check (public.can_manage_team(team_id));

create policy team_members_delete on public.team_members
  for delete to authenticated
  using (public.can_manage_team(team_id));


-- ═══════════════════════════════════════════════════════════════════════════
-- Notifications & audit
-- ═══════════════════════════════════════════════════════════════════════════

create policy notifications_own_read on public.notifications
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy notifications_own_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Audit logs are append-only and admin-readable. No INSERT policy on purpose:
-- writers use the service role after an explicit authorization check.
create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated
  using (public.is_admin());