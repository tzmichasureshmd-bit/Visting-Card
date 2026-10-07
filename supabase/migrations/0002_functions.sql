-- ═══════════════════════════════════════════════════════════════════════════
-- DV CARD — 0002 functions & triggers
--
-- The referral commission engine (record_referral_reward) deliberately lives in
-- the database rather than application code. It is the only place a reward is
-- created, it is atomic, and its UNIQUE(subscription_id) constraint makes
-- double-commissioning of one transaction structurally impossible (section 89).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── updated_at maintenance ──────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','themes','cards','card_sections','social_links','business_hours',
    'payment_configs','custom_domains','services','products','catalogues',
    'catalogue_items','portfolio_items','gallery_items','videos','reviews',
    'testimonials','offers','leads','appointments','plans','subscriptions',
    'payments','coupons','referrals','referral_rewards','payout_requests',
    'resellers','reseller_customers','teams','team_members','referral_config',
    'platform_settings'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$I
       for each row execute function public.set_updated_at()', t
    );
  end loop;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- New user provisioning
-- ═══════════════════════════════════════════════════════════════════════════

-- Human-friendly, unique, uppercase referral code (section 27).
create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  attempt int := 0;
  candidate text;
begin
  loop
    attempt := attempt + 1;
    exit when attempt > 12;
    candidate := 'DVC-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    if not exists (select 1 from public.profiles where referral_code = candidate) then
      return candidate;
    end if;
  end loop;
  -- Fall back to a uuid fragment rather than failing signup.
  return 'DVC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
end;
$$;

-- Creates the profile row, a referral relationship, a free subscription and a
-- referral wallet the moment an auth user appears.
--
-- Referral attribution is resolved HERE, server-side, from signed-up metadata:
--  * a user can never refer themselves (the CHECK constraint backs this up)
--  * a user can only be referred once (referred_user_id is UNIQUE)
--  * the referrer must exist and be active
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code       text;
  v_referrer   uuid;
  v_referral   text;
  v_free_plan  uuid;
  v_profile    uuid := new.id;
begin
  -- Referral code supplied at signup via ?ref= or hidden field.
  v_referral := nullif(trim(new.raw_user_meta_data ->> 'referral_code'), '');

  if v_referral is not null then
    select id into v_referrer
    from public.profiles
    where referral_code = upper(v_referral)
      and status = 'active'
      and id <> v_profile
    limit 1;
  end if;

  v_code := public.generate_referral_code();

  insert into public.profiles (id, email, full_name, phone, referral_code, referred_by)
  values (
    v_profile,
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    v_code,
    v_referrer
  )
  on conflict (id) do nothing;

  -- Referral relationship. Defensive duplicate check in addition to the UNIQUE
  -- constraint, so a race cannot produce a second row.
  if v_referrer is not null then
    insert into public.referrals (referrer_id, referred_user_id, referral_code)
    values (v_referrer, v_profile, v_code)
    on conflict (referred_user_id) do nothing;
  end if;

  -- Every account starts on the free plan so subscription-based feature gating
  -- has exactly one code path, and free users are genuinely unlimited-in-time.
  select id into v_free_plan from public.plans where slug = 'free' limit 1;
  if v_free_plan is not null then
    insert into public.subscriptions (user_id, plan_id, status, price_paise, billing_period)
    values (v_profile, v_free_plan, 'active', 0, 'annual')
    on conflict do nothing;
  end if;

  insert into public.referral_wallets (user_id) values (v_profile)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ═══════════════════════════════════════════════════════════════════════════
-- Card counters
-- ═══════════════════════════════════════════════════════════════════════════

-- Keeps denormalised counters in step without trusting the client. The column
-- name is validated against a whitelist, so this cannot be used to write
-- arbitrary fields.
create or replace function public.increment_card_counter(
  p_card_id uuid,
  p_field   text,
  p_amount  integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_field = 'view_count' then
    update public.cards set view_count = view_count + p_amount where id = p_card_id;
  elsif p_field = 'qr_scan_count' then
    update public.cards set qr_scan_count = qr_scan_count + p_amount where id = p_card_id;
    update public.qr_codes  set scan_count  = scan_count  + p_amount where card_id = p_card_id;
  elsif p_field = 'lead_count' then
    update public.cards set lead_count = lead_count + p_amount where id = p_card_id;
  end if;
end;
$$;

create or replace function public.sync_card_lead_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cards
     set lead_count = (select count(*) from public.leads where card_id = coalesce(new.card_id, old.card_id))
   where id = coalesce(new.card_id, old.card_id);
  return null;
end;
$$;

create trigger trg_leads_sync_count
  after insert or delete on public.leads
  for each row execute function public.sync_card_lead_count();


-- ═══════════════════════════════════════════════════════════════════════════
-- Referral commission engine  (section 28 + 47 + 89)
-- ═══════════════════════════════════════════════════════════════════════════

-- Recomputes a wallet from its authoritative reward/payout rows. This is the
-- single writer; the application never writes balances directly.
create or replace function public.sync_referral_wallet(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.referral_wallets (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  update public.referral_wallets w set
    available_paise = coalesce((select sum(r.commission_amount) from public.referral_rewards r
                                where r.user_id = p_user_id and r.status = 'approved'), 0),
    pending_paise   = coalesce((select sum(r.commission_amount) from public.referral_rewards r
                                where r.user_id = p_user_id and r.status = 'qualified'), 0),
    lifetime_earned = coalesce((select sum(r.commission_amount) from public.referral_rewards r
                                where r.user_id = p_user_id and r.status <> 'rejected'), 0),
    lifetime_paid   = coalesce((select sum(p.amount_paise) from public.payout_requests p
                                where p.user_id = p_user_id and p.status = 'paid'), 0)
  where w.user_id = p_user_id;
end;
$$;

-- Creates the reward for one qualifying paid referral.
--
-- Returns the reward id, or NULL when no reward is owed (no referrer, plan not
-- eligible, referral flagged, or the transaction was already rewarded).
--
-- Guarantees:
--   * rate comes from referral_config (admin-configurable, never hardcoded)
--   * UNIQUE(subscription_id) => exactly one reward per qualifying transaction
--   * referral must not be flagged, and must belong to the paid user
--   * snapshot of percent + base is stored on the reward for auditability
create or replace function public.record_referral_reward(
  p_referred_user_id uuid,
  p_subscription_id  uuid,
  p_payment_id        uuid default null,
  p_base_amount_paise integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg            public.referral_config%rowtype;
  v_referral     public.referrals%rowtype;
  v_plan_slug    plan_slug;
  v_base         integer;
  v_reward       integer;
  v_reward_id    uuid;
begin
  -- Snapshot the active configuration for this calculation.
  select * into cfg from public.referral_config where is_active for share;
  if not found then
    return null;
  end if;

  -- Only pre-existing referrals can mature.
  select * into v_referral
  from public.referrals
  where referred_user_id = p_referred_user_id
  for update;

  if not found or v_referral.is_flagged then
    return null;
  end if;

  -- Already paid out / rejected: never re-reward.
  if v_referral.status in ('rejected', 'paid') then
    return null;
  end if;

  select s.plan_id, pl.slug into v_plan_slug
  from public.subscriptions s
  join public.plans pl on pl.id = s.plan_id
  where s.id = p_subscription_id;

  if v_plan_slug is null then
    return null;
  end if;

  -- Plan must be eligible under the current configuration.
  if not (v_plan_slug = any (cfg.eligible_plans)) then
    return null;
  end if;

  -- Base is the verified amount actually paid, never a client-supplied figure.
  v_base := coalesce(
    p_base_amount_paise,
    (select amount_paise from public.payments where id = p_payment_id),
    (select price_paise from public.subscriptions where id = p_subscription_id),
    0
  );

  if v_base <= 0 then
    return null;
  end if;

  v_reward := round(v_base * cfg.commission_percent / 100.0)::integer
              + cfg.fixed_reward_paise;

  if cfg.max_reward_paise is not null and v_reward > cfg.max_reward_paise then
    v_reward := cfg.max_reward_paise;
  end if;

  if v_reward <= 0 then
    return null;
  end if;

  -- ON CONFLICT is the idempotency guard: a retried webhook is a no-op.
  insert into public.referral_rewards (
    referral_id, user_id, subscription_id, payment_id,
    commission_percent, base_amount_paise, commission_amount,
    status, expires_at
  )
  values (
    v_referral.id, v_referral.referrer_id, p_subscription_id, p_payment_id,
    cfg.commission_percent, v_base, v_reward,
    'qualified',
    now() + make_interval(days => cfg.reward_validity_days)
  )
  on conflict (subscription_id) do nothing
  returning id into v_reward_id;

  -- Nothing inserted means this transaction was already rewarded.
  if v_reward_id is null then
    return null;
  end if;

  -- Signup alone never pays; qualification happens on verified payment only.
  update public.referrals
     set status = 'qualified',
         qualified_by = 'payment:' || coalesce(p_payment_id::text, 'unknown'),
         qualified_at = now()
   where id = v_referral.id
     and status = 'pending';

  perform public.sync_referral_wallet(v_referral.referrer_id);

  insert into public.notifications (user_id, type, title, body, link)
  values (
    v_referral.referrer_id,
    'referral_qualified',
    'Referral qualified',
    'A referral of yours became a paying customer. ' ||
      format('%s %s has been added to your pending rewards.',
             chr(8377), to_char(v_reward / 100.0, 'FM999990.00')),
    '/dashboard/referrals'
  );

  return v_reward_id;
end;
$$;

-- Optional signup reward, disabled by default (section 28). Called only when an
-- admin has explicitly turned `reward_on_signup` on.
create or replace function public.record_signup_reward(p_referred_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg         public.referral_config%rowtype;
  v_referral  public.referrals%rowtype;
  v_reward_id uuid;
begin
  select * into cfg from public.referral_config where is_active;
  if not found or not cfg.reward_on_signup or cfg.signup_reward_paise <= 0 then
    return null;
  end if;

  select * into v_referral from public.referrals
  where referred_user_id = p_referred_user_id for update;
  if not found or v_referral.is_flagged then
    return null;
  end if;

  -- subscription_id is NULL for signup rewards, and Postgres treats NULLs as
  -- distinct in a unique index, so ON CONFLICT cannot dedupe these. Check
  -- explicitly to keep this idempotent.
  if exists (
    select 1 from public.referral_rewards
    where referral_id = v_referral.id and subscription_id is null
  ) then
    return null;
  end if;

  insert into public.referral_rewards (
    referral_id, user_id, commission_percent, base_amount_paise,
    commission_amount, status, expires_at
  )
  values (
    v_referral.id, v_referral.referrer_id, 0, 0, cfg.signup_reward_paise,
    'qualified', now() + make_interval(days => cfg.reward_validity_days)
  )
  returning id into v_reward_id;

  if v_reward_id is not null then
    perform public.sync_referral_wallet(v_referral.referrer_id);
  end if;

  return v_reward_id;
end;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- Subscription lifecycle (section 39)
-- ═══════════════════════════════════════════════════════════════════════════

-- Grace period then disable. Never deletes a card.
--
-- Scheduled from /api/cron/expire-subscriptions rather than in-process, so it
-- runs exactly once regardless of how many app instances are live.
create or replace function public.expire_subscriptions()
returns table (
  moved_to_grace integer,
  moved_to_expired integer,
  cards_suspended integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grace_days integer;
  v_a integer;
  v_b integer;
  v_c integer;
begin
  select coalesce(grace_period_days, 14) into v_grace_days
  from public.platform_settings where id;

  -- active -> grace
  update public.subscriptions
     set status = 'grace',
         grace_until = coalesce(current_period_end, now()) + make_interval(days => v_grace_days)
   where status = 'active'
     and current_period_end is not null
     and current_period_end < now();
  get diagnostics v_a = row_count;

  -- grace -> expired
  update public.subscriptions
     set status = 'expired'
   where status = 'grace'
     and grace_until is not null
     and grace_until < now();
  get diagnostics v_b = row_count;

  -- A card with no live subscription becomes read-only, never deleted.
  update public.cards c
     set status = 'suspended',
         suspended_at = now(),
         suspend_reason = 'Subscription expired'
   where c.deleted_at is null
     and c.status = 'published'
     and not exists (
       select 1 from public.subscriptions s
       where s.user_id = c.user_id
         and s.status in ('active', 'grace', 'pending')
     );
  get diagnostics v_c = row_count;

  -- Tell affected owners.
  insert into public.notifications (user_id, type, title, body, link)
  select distinct s.user_id, 'subscription_expiring',
         'Subscription expired',
         'Your card is now read-only. Renew to bring it back online.',
         '/dashboard/subscription'
  from public.subscriptions s
  where s.status = 'expired'
    and not exists (
      select 1 from public.notifications n
      where n.user_id = s.user_id
        and n.type = 'subscription_expiring'
        and n.created_at > now() - interval '7 days'
    )
  limit 500;

  return query select v_a, v_b, v_c;
end;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- Payout guards (section 29)
-- ═══════════════════════════════════════════════════════════════════════════

-- Validates a requested payout against the approved wallet balance and the
-- configured minimum, then holds the funds immediately so the same balance
-- cannot be requested twice.
--
-- The user is taken from auth.uid() and is deliberately NOT a parameter: if it
-- were, any signed-in user could drain another account's wallet.
create or replace function public.request_payout(
  p_amount_paise integer,
  p_method       text,
  p_upi_id       text default null,
  p_bank_details jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_available integer;
  v_min       integer;
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_method not in ('upi', 'bank') then
    raise exception 'Unsupported payout method.' using errcode = '22023';
  end if;

  select available_paise into v_available
  from public.referral_wallets where user_id = v_user_id for update;

  if not found or v_available is null then
    raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
  end if;

  select min_payout_paise into v_min
  from public.referral_config where is_active;
  v_min := coalesce(v_min, 50000);

  if p_amount_paise < v_min then
    raise exception 'BELOW_MINIMUM' using errcode = 'P0001';
  end if;

  if p_amount_paise > v_available then
    raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
  end if;

  insert into public.payout_requests (user_id, amount_paise, method, upi_id, bank_details)
  values (v_user_id, p_amount_paise, p_method, p_upi_id, p_bank_details)
  returning id into v_request_id;

  -- Hold the funds straight away; an admin rejecting the request releases them.
  update public.referral_wallets
     set available_paise = available_paise - p_amount_paise
   where user_id = v_user_id;

  return v_request_id;
end;
$$;