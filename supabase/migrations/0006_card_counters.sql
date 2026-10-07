-- ─────────────────────────────────────────────────────────────────────────────
-- DV CARD — 0006 denormalised counters
-- ─────────────────────────────────────────────────────────────────────────────
--
-- `cards.view_count`, `cards.qr_scan_count` and `cards.lead_count` are
-- denormalised counters the dashboard reads on every page load, so they cannot be
-- aggregated from `analytics_events` / `leads` at request time.
--
-- Why a trigger rather than application code:
--  - Atomicity. `set view_count = view_count + 1` inside the same transaction as
--    the INSERT cannot lose an update the way a read-modify-write in the app can.
--  - Least privilege. The anon key only needs INSERT on `analytics_events`; it
--    never needs UPDATE on `cards`, so the public endpoint cannot forge a view
--    count by writing to the counter directly.
--  - One definition. Leads submitted from the card, the dashboard, or a backfill
--    script all increment the same counter.
--
-- SECURITY DEFINER is required because the writing role (anon / authenticated) has
-- no UPDATE policy on `cards`.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.bump_card_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'analytics_events' then
    if new.event_type = 'card_view' then
      update public.cards
      set view_count = view_count + 1
      where id = new.card_id;

    elsif new.event_type = 'qr_scan' then
      update public.cards
      set qr_scan_count = qr_scan_count + 1
      where id = new.card_id;
    end if;

  elsif tg_table_name = 'leads' then
    update public.cards
    set lead_count = lead_count + 1
    where id = new.card_id;
  end if;

  return new;
end;
$$;

-- Drop first so this migration is safe to re-run on an existing database.
drop trigger if exists analytics_bump_card_counters on public.analytics_events;
create trigger analytics_bump_card_counters
after insert on public.analytics_events
for each row execute function public.bump_card_counters();

drop trigger if exists leads_bump_card_counters on public.leads;
create trigger leads_bump_card_counters
after insert on public.leads
for each row execute function public.bump_card_counters();

comment on function public.bump_card_counters() is
  'Maintains cards.view_count / qr_scan_count / lead_count as a side effect of inserting an analytics event or lead.';
