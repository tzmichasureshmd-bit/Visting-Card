-- ═══════════════════════════════════════════════════════════════════════════
-- DV CARD — 0001 initial schema
--
-- Conventions used throughout:
--  * All money is stored in PAISE (integer, 1 rupee = 100 paise). Never floats.
--    Example from section 28: plan 99900 paise x 20% = 19980 paise exactly.
--  * Timestamps are timestamptz, stored in UTC.
--  * Soft deletes use `deleted_at` where a record must be recoverable or where
--    historical reporting must remain intact (cards, leads, payments).
--  * Every table has created_at / updated_at. Soft-deletable tables additionally
--    carry a status enum so they can be suspended without losing data.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────

create type user_role          as enum ('user', 'reseller', 'admin');
create type user_status        as enum ('active', 'suspended', 'deleted');
create type card_type          as enum ('personal', 'professional', 'business', 'creator', 'company');
create type card_status        as enum ('draft', 'published', 'suspended');
create type lead_status        as enum ('new', 'contacted', 'interested', 'converted', 'lost');
create type appointment_status as enum ('pending', 'accepted', 'rejected', 'completed');
create type plan_slug          as enum ('free', 'starter', 'professional', 'business', 'enterprise');
create type billing_period     as enum ('monthly', 'annual', 'one_time');
create type subscription_status as enum ('active', 'cancelled', 'expired', 'grace', 'pending');
create type payment_status     as enum ('created', 'authorized', 'captured', 'failed', 'refunded');
create type discount_type      as enum ('percent', 'fixed');
create type referral_status    as enum ('pending', 'qualified', 'approved', 'paid', 'rejected');
create type payout_status      as enum ('requested', 'under_review', 'approved', 'paid', 'rejected');
create type reseller_status    as enum ('pending', 'approved', 'suspended');
create type domain_status     as enum ('pending', 'verified', 'failed', 'active');
create type notification_type  as enum (
  'lead_received', 'appointment_received', 'subscription_activated',
  'subscription_expiring', 'payment_success', 'referral_qualified',
  'referral_reward_approved', 'payout_approved', 'payout_paid', 'system'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Identity
-- ═══════════════════════════════════════════════════════════════════════════

-- Mirrors auth.users. `password` is never stored here — Supabase Auth (GoTrue)
-- owns credentials (section 7).
create table profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text unique not null,
  full_name        text,
  phone            text,
  avatar_url       text,
  role             user_role not null default 'user',
  status           user_status not null default 'active',
  referral_code    text unique,
  referred_by      uuid references profiles (id) on delete set null,
  onboarded        boolean not null default false,
  onboarding_step  smallint not null default 0 check (onboarding_step between 0 and 15),
  -- Notification preferences (section 49 / 62). In-app is always recorded; these
  -- only gate optional email/WhatsApp channels.
  notify_email     boolean not null default true,
  notify_whatsapp  boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column profiles.referred_by is
  'Denormalised copy of referrals.referrer_id for fast attribution; the referrals table remains authoritative.';

create index profiles_referral_code_idx on profiles (referral_code);
create index profiles_referred_by_idx   on profiles (referred_by);
create index profiles_status_idx        on profiles (status);

-- ═══════════════════════════════════════════════════════════════════════════
-- Themes
-- ═══════════════════════════════════════════════════════════════════════════

create table themes (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  category     text not null default 'general',
  description  text,
  -- Layout + palette + typography defaults. The renderer reads this to decide
  -- structure (e.g. `layout: 'centered' | 'banner' | 'split'`), which is what
  -- makes the ten themes genuinely different rather than recoloured (section 34).
  config       jsonb not null default '{}'::jsonb,
  is_premium   boolean not null default false,
  is_active    boolean not null default true,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index themes_active_idx on themes (is_active, sort_order);

-- ═══════════════════════════════════════════════════════════════════════════
-- Cards
-- ═══════════════════════════════════════════════════════════════════════════

create table cards (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles (id) on delete cascade,
  team_id           uuid,                                -- set later in 0001_reseller_team
  type              card_type not null default 'personal',

  -- Public URL segment. Partial unique index so a handle frees up on delete.
  username          text not null check (username = lower(username)),

  -- Identity (section 11)
  full_name         text not null,
  designation       text,
  company           text,
  bio               text,
  photo_url         text,
  cover_url         text,
  logo_url          text,

  -- Contact (section 11)
  phone             text,
  whatsapp          text,
  email             text,
  website           text,
  address           text,
  city              text,
  state             text,
  country           text default 'India',
  pincode           text,
  latitude          double precision,
  longitude         double precision,

  -- Presentation
  theme_id          uuid references themes (id) on delete set null,
  theme_overrides   jsonb not null default '{}'::jsonb,   -- user's saved customisations

  -- Capabilities toggled independently of section visibility
  show_business_hours boolean not null default true,
  open_to_enquiries   boolean not null default true,
  open_to_appointments boolean not null default false,

  -- Lifecycle
  status            card_status not null default 'draft',
  published_at      timestamptz,
  suspended_at      timestamptz,
  suspend_reason    text,
  deleted_at        timestamptz,

  -- Denormalised counters. Analytics is the source of truth; these are kept in
  -- step by trigger-free upserts so the dashboard never has to aggregate.
  view_count        integer not null default 0,
  qr_scan_count     integer not null default 0,
  lead_count        integer not null default 0,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
  -- The team_id foreign key is added at the bottom of this file, once `teams`
  -- exists (Postgres requires the referenced table to be present).
);

create unique index cards_username_key on cards (username) where deleted_at is null;
create index cards_user_idx  on cards (user_id) where deleted_at is null;
create index cards_status_idx on cards (status) where deleted_at is null;
create index cards_team_idx  on cards (team_id);

-- ── Ordered, individually toggleable card sections (section 10) ─────────────

create table card_sections (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references cards (id) on delete cascade,
  section_key text not null,
  position    smallint not null default 0,
  is_enabled  boolean not null default true,
  -- Per-section presentation overrides + arbitrary config (e.g. the
  -- pre-filled enquiry message, which CTA a service row uses).
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (card_id, section_key)
);

create index card_sections_card_idx on card_sections (card_id, position);

-- ── Social + custom links (section 13) ──────────────────────────────────────

create table social_links (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references cards (id) on delete cascade,
  platform   text not null default 'custom',   -- instagram|facebook|linkedin|youtube|x|telegram|threads|website|custom
  url        text not null,
  label      text,                             -- custom button title, e.g. "View My Portfolio"
  position   smallint not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index social_links_card_idx on social_links (card_id, position);

-- ── Business hours (section 20) ─────────────────────────────────────────────

create table business_hours (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references cards (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),  -- 0 = Sunday
  is_open    boolean not null default false,
  -- Minutes from midnight; avoids TIME string-formatting bugs across locales.
  opens_at   smallint check (opens_at between 0 and 1439),
  closes_at  smallint check (closes_at between 0 and 1439),
  is_24h     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, day_of_week)
);

create index business_hours_card_idx on business_hours (card_id, day_of_week);

-- ── UPI payment settings (section 21) ───────────────────────────────────────
-- Only a public UPI handle is stored. No payment credentials are ever held.
create table payment_configs (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null unique references cards (id) on delete cascade,
  upi_id      text,
  payee_name  text,
  note        text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Custom domains (section 71) ─────────────────────────────────────────────
-- Verification is a DNS TXT lookup performed by the app; ownership is never
-- auto-claimed.
create table custom_domains (
  id                 uuid primary key default gen_random_uuid(),
  card_id            uuid not null references cards (id) on delete cascade,
  domain             text unique not null,
  verification_token text not null default encode(gen_random_bytes(16), 'hex'),
  status             domain_status not null default 'pending',
  cname_target       text,
  verified_at        timestamptz,
  last_checked_at    timestamptz,
  error_message      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index custom_domains_card_idx on custom_domains (card_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Card content
-- ═══════════════════════════════════════════════════════════════════════════

-- Services (section 14)
create table services (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references cards (id) on delete cascade,
  name         text not null,
  description  text,
  image_url    text,
  price_paise  integer check (price_paise is null or price_paise >= 0),
  cta_type     text not null default 'enquiry',  -- whatsapp|call|website|enquiry
  cta_label    text,
  cta_value    text,
  position     smallint not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index services_card_idx on services (card_id, position);

-- Products (section 15)
create table products (
  id              uuid primary key default gen_random_uuid(),
  card_id         uuid not null references cards (id) on delete cascade,
  name            text not null,
  description     text,
  image_url       text,
  original_price  integer check (original_price is null or original_price >= 0),
  sale_price      integer check (sale_price is null or sale_price >= 0),
  cta_type        text not null default 'whatsapp',  -- whatsapp|buy_now|website|enquiry
  cta_label       text,
  cta_value       text,
  position        smallint not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- A "sale" price above the original is a pricing mistake worth rejecting.
  constraint products_sale_lte_original
    check (sale_price is null or original_price is null or sale_price <= original_price)
);

create index products_card_idx on products (card_id, position);

-- Digital catalogue (section 16)
create table catalogues (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references cards (id) on delete cascade,
  title        text not null,
  category     text not null default 'products',  -- food|products|services|properties|packages
  description  text,
  cover_url    text,
  position     smallint not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index catalogues_card_idx on catalogues (card_id, position);

create table catalogue_items (
  id           uuid primary key default gen_random_uuid(),
  catalogue_id uuid not null references catalogues (id) on delete cascade,
  card_id      uuid not null references cards (id) on delete cascade,
  name         text not null,
  description  text,
  image_url    text,
  price_paise  integer check (price_paise is null or price_paise >= 0),
  offer_paise  integer check (offer_paise is null or offer_paise >= 0),
  cta_type     text not null default 'enquiry',
  cta_label    text,
  position     smallint not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index catalogue_items_catalogue_idx on catalogue_items (catalogue_id, position);
create index catalogue_items_card_idx      on catalogue_items (card_id);

-- Portfolio (section 17)
create table portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references cards (id) on delete cascade,
  title        text not null,
  description  text,
  image_url    text,
  video_url    text,
  external_url text,
  category     text,
  position     smallint not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index portfolio_items_card_idx on portfolio_items (card_id, position);

-- Gallery (section 18). Dimensions are captured at upload so the grid can reserve
-- space and avoid layout shift on slow connections (section 73).
create table gallery_items (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references cards (id) on delete cascade,
  image_url   text not null,
  caption     text,
  width       integer,
  height      integer,
  blur_hash   text,
  position    smallint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index gallery_items_card_idx on gallery_items (card_id, position);

-- Video (section 19)
create table videos (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references cards (id) on delete cascade,
  title      text not null,
  url        text not null,
  kind       text not null default 'intro',  -- intro|product|portfolio
  thumbnail_url text,
  position   smallint not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index videos_card_idx on videos (card_id, position);

-- Reviews (aggregated rating) and testimonials (section 10)
create table reviews (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references cards (id) on delete cascade,
  author_name  text not null,
  author_avatar text,
  rating       smallint not null check (rating between 1 and 5),
  body         text,
  is_featured  boolean not null default false,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index reviews_card_idx on reviews (card_id);

create table testimonials (
  id                  uuid primary key default gen_random_uuid(),
  card_id             uuid not null references cards (id) on delete cascade,
  author_name         text not null,
  author_designation  text,
  author_company      text,
  author_avatar       text,
  body                text not null,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index testimonials_card_idx on testimonials (card_id);

-- Offers (section 10)
create table offers (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references cards (id) on delete cascade,
  title       text not null,
  description text,
  badge       text,
  expires_at  timestamptz,
  position    smallint not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index offers_card_idx on offers (card_id, position);

-- ═══════════════════════════════════════════════════════════════════════════
-- Lead generation & appointments (sections 22-23)
-- ═══════════════════════════════════════════════════════════════════════════

create table leads (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references cards (id) on delete cascade,
  name       text not null,
  phone      text not null,
  email      text,
  message    text,
  -- Which form produced this: enquiry section, service CTA, product CTA, etc.
  source     text not null default 'enquiry',
  status     lead_status not null default 'new',
  -- Soft-contact/privacy: we never store IP or raw user-agent against a lead.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  converted_at timestamptz
);

create index leads_card_idx   on leads (card_id, created_at desc);
create index leads_status_idx on leads (card_id, status);
-- NOTE: duplicate suppression (one enquiry per phone per 30 days) cannot be a
-- partial index because `now()` is STABLE, and Postgres requires IMMUTABLE
-- index predicates. It is enforced in the lead-capture action instead, which
-- also lets the rate limit vary by platform config.

create table lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads (id) on delete cascade,
  body       text not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index lead_notes_lead_idx on lead_notes (lead_id, created_at);

create table appointments (
  id              uuid primary key default gen_random_uuid(),
  card_id         uuid not null references cards (id) on delete cascade,
  name            text not null,
  phone           text not null,
  email           text,
  service         text,
  preferred_date  date,
  preferred_time  text,
  message         text,
  status          appointment_status not null default 'pending',
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index appointments_card_idx on appointments (card_id, created_at desc);
create index appointments_status_idx on appointments (card_id, status);
create unique index appointments_dedupe_idx on appointments (card_id, phone, preferred_date)
  where preferred_date is not null;

-- ═══════════════════════════════════════════════════════════════════════════
-- Analytics (sections 25-26)
-- ═══════════════════════════════════════════════════════════════════════════

-- Deliberately stores NO raw IP or full user-agent (section 25). `visitor_hash`
-- is a rotating, salted digest used only to count unique visitors per day, and
-- `device_category` is a coarse bucket rather than a fingerprint.
create table analytics_events (
  id             bigint generated always as identity primary key,
  card_id        uuid not null references cards (id) on delete cascade,
  event_type     text not null,
  visitor_hash   text,
  device_category text,   -- mobile|tablet|desktop|unknown
  traffic_source text,   -- whatsapp|instagram|direct|qr|referral|search|unknown
  referrer       text,
  utm_source     text,
  utm_campaign   text,
  created_at     timestamptz not null default now()
);

create index analytics_events_card_time_idx on analytics_events (card_id, created_at desc);
create index analytics_events_card_type_idx on analytics_events (card_id, event_type);
-- Retention: raw events older than a year are dropped by the cron sweeper.
create index analytics_events_created_idx   on analytics_events (created_at);

create table qr_codes (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references cards (id) on delete cascade,
  -- Short, stable id so QR payloads stay small and printable.
  short_id   text unique not null default encode(gen_random_bytes(6), 'hex'),
  label      text,
  style      jsonb not null default '{}'::jsonb,
  scan_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index qr_codes_card_idx on qr_codes (card_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Plans, subscriptions, payments, coupons (sections 36-39, 46)
-- ═══════════════════════════════════════════════════════════════════════════

create table plans (
  id             uuid primary key default gen_random_uuid(),
  slug           plan_slug not null unique,
  name           text not null,
  tagline        text,
  description    text,
  price_paise    integer not null default 0 check (price_paise >= 0),
  -- Enterprise is sold by negotiation, so no fixed price.
  is_custom      boolean not null default false,
  billing_period billing_period not null default 'annual',
  features       jsonb not null default '[]'::jsonb,
  -- The single source of truth for plan limits (section 37). Feature gating
  -- reads this column; nothing is hardcoded in application code.
  limits         jsonb not null default '{}'::jsonb,
  sort_order     smallint not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Only one row per slug may be the active price for a billing period.
create table subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  plan_id       uuid not null references plans (id) on delete restrict,
  status        subscription_status not null default 'pending',
  started_at    timestamptz not null default now(),
  current_period_end timestamptz,
  -- Card stays live until this instant (section 39).
  grace_until   timestamptz,
  cancelled_at  timestamptz,
  cancel_reason text,
  -- Snapshot of price paid, so later price changes never rewrite history.
  price_paise   integer not null,
  billing_period billing_period not null default 'annual',
  razorpay_subscription_id text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One live subscription per user.
create unique index subscriptions_one_active_idx
  on subscriptions (user_id)
  where status in ('active', 'grace', 'pending');
create index subscriptions_user_idx    on subscriptions (user_id, created_at desc);
create index subscriptions_expiry_idx on subscriptions (current_period_end)
  where status in ('active', 'grace');

create table payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles (id) on delete cascade,
  subscription_id uuid references subscriptions (id) on delete set null,
  plan_id         uuid references plans (id) on delete set null,
  order_id        text unique,                       -- Razorpay order id
  transaction_id  text unique,                       -- Razorpay payment id
  amount_paise    integer not null check (amount_paise >= 0),
  discount_paise  integer not null default 0,
  tax_paise       integer not null default 0,
  currency        text not null default 'INR',
  status          payment_status not null default 'created',
  provider        text not null default 'razorpay',
  method          text,
  coupon_id       uuid,
  -- Verbatim provider payload, retained for disputes and reconciliation.
  provider_payload jsonb,
  -- Set ONLY after server-side signature verification or webhook validation.
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index payments_user_idx    on payments (user_id, created_at desc);
create index payments_status_idx  on payments (status, created_at desc);
create index payments_plan_idx    on payments (plan_id);

create table coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,
  description      text,
  discount_type    discount_type not null,
  -- percent: 1-100. fixed: paise.
  discount_value   integer not null check (discount_value > 0),
  max_redemptions  integer,                          -- null = unlimited
  times_used       integer not null default 0,
  per_user_limit   smallint not null default 1,
  -- Empty array = valid on every plan.
  plan_slugs       plan_slug[] not null default '{}',
  expires_at       timestamptz,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index coupons_code_idx on coupons (code) where is_active;

create table coupon_redemptions (
  id              uuid primary key default gen_random_uuid(),
  coupon_id       uuid not null references coupons (id) on delete cascade,
  user_id         uuid not null references profiles (id) on delete cascade,
  subscription_id uuid references subscriptions (id) on delete set null,
  discount_paise  integer not null,
  created_at      timestamptz not null default now()
);

-- A coupon cannot be redeemed more than `per_user_limit` times by one account.
create index coupon_redemptions_user_idx on coupon_redemptions (coupon_id, user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Referral programme (sections 27-30, 47, 69, 89)
-- ═══════════════════════════════════════════════════════════════════════════

-- Admin-configurable programme rules. Exactly one row (id = true) is enforced
-- with a check constraint, so commission is never hardcoded anywhere (section 28).
create table referral_config (
  id                  boolean primary key default true check (id),
  commission_percent  numeric(5,2) not null default 20 check (commission_percent between 0 and 100),
  fixed_reward_paise  integer not null default 0 check (fixed_reward_paise >= 0),
  -- When non-zero this is ADDED to the percentage result.
  max_reward_paise    integer,
  min_payout_paise    integer not null default 50000 check (min_payout_paise >= 0),
  reward_validity_days integer not null default 365 check (reward_validity_days > 0),
  -- Off by default: a mere signup must never pay out (section 28).
  reward_on_signup    boolean not null default false,
  signup_reward_paise integer not null default 0,
  eligible_plans      plan_slug[] not null default '{starter,professional,business}',
  -- Once true the config is frozen for in-flight referrals.
  is_active           boolean not null default true,
  updated_at          timestamptz not null default now(),
  updated_by          uuid references profiles (id) on delete set null
);

insert into referral_config (id) values (true);

-- The referral relationship itself. Created at signup, always server-side.
create table referrals (
  id               uuid primary key default gen_random_uuid(),
  referrer_id      uuid not null references profiles (id) on delete cascade,
  referred_user_id uuid not null unique references profiles (id) on delete cascade,
  referral_code    text not null,
  status           referral_status not null default 'pending',
  -- How this referral reached 'qualified' — an audited payment is the only
  -- legitimate trigger when reward_on_signup is disabled.
  qualified_by     text,
  qualified_at     timestamptz,
  -- Manual fraud holds (section 69).
  is_flagged       boolean not null default false,
  flag_reason      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Self-referral is impossible even if application logic regresses.
  constraint referrals_no_self_referral check (referrer_id <> referred_user_id)
);

create index referrals_referrer_idx on referrals (referrer_id, status);
create index referrals_status_idx   on referrals (status, created_at desc);

-- The money record. One reward per qualifying transaction — enforced by the
-- unique subscription_id, which is what stops double-commissioning (section 89).
create table referral_rewards (
  id               uuid primary key default gen_random_uuid(),
  referral_id      uuid not null references referrals (id) on delete cascade,
  -- Whoever receives the money.
  user_id          uuid not null references profiles (id) on delete cascade,
  subscription_id  uuid not null unique references subscriptions (id) on delete cascade,
  payment_id       uuid references payments (id) on delete set null,
  -- Snapshotted rate so later config edits never rewrite an earned reward.
  commission_percent numeric(5,2) not null,
  base_amount_paise integer not null check (base_amount_paise >= 0),
  commission_amount integer not null check (commission_amount >= 0),
  currency         text not null default 'INR',
  status           referral_status not null default 'pending',
  approved_by      uuid references profiles (id) on delete set null,
  approved_at      timestamptz,
  paid_at          timestamptz,
  -- Commission stops being claimable this many days after it was earned.
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- One reward per referral per subscription.
  unique (referral_id, subscription_id)
);

create index referral_rewards_user_idx   on referral_rewards (user_id, status);
create index referral_rewards_status_idx on referral_rewards (status, created_at desc);

-- Wallet balances are derived from referral_rewards + payouts, then cached here
-- for fast dashboard reads. `rpc_sync_referral_wallet` is the single writer.
create table referral_wallets (
  user_id          uuid primary key references profiles (id) on delete cascade,
  available_paise  integer not null default 0 check (available_paise >= 0),
  pending_paise    integer not null default 0 check (pending_paise >= 0),
  lifetime_earned  integer not null default 0,
  lifetime_paid    integer not null default 0,
  updated_at       timestamptz not null default now()
);

create table payout_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  amount_paise  integer not null check (amount_paise > 0),
  method        text not null default 'upi',  -- upi|bank
  upi_id        text,
  bank_details  jsonb,                        -- only when method = 'bank'
  status        payout_status not null default 'requested',
  admin_note    text,
  -- Recorded when an admin marks it paid. DV Card never initiates a transfer.
  payout_reference text,
  processed_by  uuid references profiles (id) on delete set null,
  processed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint payout_needs_details check (
    (method <> 'upi') or (upi_id is not null and length(trim(upi_id)) > 2)
  )
);

create index payout_requests_user_idx   on payout_requests (user_id, created_at desc);
create index payout_requests_status_idx on payout_requests (status, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- Resellers (sections 31-33, 48)
-- ═══════════════════════════════════════════════════════════════════════════

create table resellers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique not null references profiles (id) on delete cascade,
  business_name       text not null,
  -- Per-reseller override of the default referral-style commission.
  commission_percent  numeric(5,2) not null default 20 check (commission_percent between 0 and 100),
  status              reseller_status not null default 'pending',
  -- Governs what a reseller may do; admin-controlled (section 31).
  can_set_pricing     boolean not null default false,
  can_create_customers boolean not null default true,
  -- Retail price ceilings/overrides per plan slug, applied only when
  -- can_set_pricing is true.
  pricing_rules       jsonb not null default '{}'::jsonb,
  contact_email       text,
  contact_phone       text,
  approved_by         uuid references profiles (id) on delete set null,
  approved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index resellers_status_idx on resellers (status);

create table reseller_customers (
  id             uuid primary key default gen_random_uuid(),
  reseller_id    uuid not null references resellers (id) on delete cascade,
  user_id        uuid not null references profiles (id) on delete cascade,
  plan_id        uuid references plans (id) on delete set null,
  subscription_id uuid references subscriptions (id) on delete set null,
  retail_price_paise integer,
  status         text not null default 'active',
  assigned_at    timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (reseller_id, user_id)
);

create index reseller_customers_reseller_idx on reseller_customers (reseller_id, created_at desc);
-- One reseller may not claim the same customer twice.
create unique index reseller_customers_user_idx on reseller_customers (user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Teams / company cards (section 33)
-- ═══════════════════════════════════════════════════════════════════════════

create table teams (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references profiles (id) on delete cascade,
  name          text not null,
  slug          text unique not null,
  logo_url      text,
  cover_url     text,
  about         text,
  website       text,
  phone         text,
  email         text,
  address       text,
  city          text,
  state         text,
  country       text default 'India',
  pincode       text,
  latitude      double precision,
  longitude     double precision,
  theme_id      uuid references themes (id) on delete set null,
  theme_overrides jsonb not null default '{}'::jsonb,
  business_hours jsonb,
  -- Set when the owner's subscription grants team seats.
  member_limit  integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index teams_owner_idx on teams (owner_user_id);

create table team_members (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references teams (id) on delete cascade,
  -- Null for staff who do not (yet) have a login. Invited employees.
  user_id       uuid references profiles (id) on delete cascade,
  card_id       uuid references cards (id) on delete set null,
  full_name     text not null,
  designation   text,
  email         text,
  phone         text,
  photo_url     text,
  -- Individual card URL slug for this employee (section 33).
  username      text,
  social_links  jsonb not null default '[]'::jsonb,
  bio           text,
  position      smallint not null default 0,
  is_active     boolean not null default true,
  invite_token  text unique,
  invited_at    timestamptz,
  accepted_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (team_id, email)
);

create unique index team_members_username_key on team_members (username) where username is not null;
create index team_members_team_idx  on team_members (team_id, position);
create index team_members_user_idx on team_members (user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- System (sections 49, 61)
-- ═══════════════════════════════════════════════════════════════════════════

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  type       notification_type not null default 'system',
  title      text not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, is_read, created_at desc);

-- IP is hashed with a rotating per-day salt, never stored raw (section 61).
create table audit_logs (
  id           bigint generated always as identity primary key,
  actor_id     uuid references profiles (id) on delete set null,
  actor_role   user_role,
  action       text not null,
  target_type  text,
  target_id    text,
  metadata     jsonb not null default '{}'::jsonb,
  ip_hash      text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index audit_logs_actor_idx  on audit_logs (actor_id, created_at desc);
create index audit_logs_action_idx on audit_logs (action, created_at desc);
create index audit_logs_created_idx on audit_logs (created_at desc);

-- Platform-wide configuration (section 39/37). Single row enforced.
create table platform_settings (
  id                    boolean primary key default true check (id),
  site_name             text not null default 'DV Card',
  support_email         text not null default 'support@dvcard.com',
  support_whatsapp      text,
  grace_period_days     integer not null default 14 check (grace_period_days >= 0),
  analytics_retention_days integer not null default 365,
  signup_referral_cookie_days smallint not null default 30,
  default_theme_slug    text not null default 'minimal',
  maintenance_mode      boolean not null default false,
  maintenance_message   text,
  updated_at            timestamptz not null default now(),
  updated_by            uuid references profiles (id) on delete set null
);

insert into platform_settings (id) values (true);
-- ---------------------------------------------------------------------------
-- Deferred foreign keys
--
-- `cards` and `payments` reference tables defined further down this file. Postgres
-- requires the target table to exist when the constraint is declared, so these are
-- attached after every table exists.
-- ---------------------------------------------------------------------------

alter table cards
  add constraint cards_team_fk foreign key (team_id) references teams (id) on delete cascade;

alter table payments
  add constraint payments_coupon_fk foreign key (coupon_id) references coupons (id) on delete set null;
