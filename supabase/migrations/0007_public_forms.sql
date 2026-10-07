-- ─────────────────────────────────────────────────────────────────────────────
-- DV CARD — 0007 public form submission
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.submit_lead(
  p_card_id  uuid,
  p_name     text,
  p_phone    text,
  p_email    text,
  p_message  text,
  p_source   text default 'enquiry'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card       public.cards%rowtype;
  v_new_id     uuid;
  v_phone      text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_source     text := coalesce(nullif(trim(p_source), ''), 'enquiry');
begin
  select * into v_card
  from public.cards c
  where c.id = p_card_id
    and c.status = 'published'
    and c.deleted_at is null;

  if v_card.id is null or not v_card.open_to_enquiries then
    return null;
  end if;

  if length(v_phone) < 10 or length(coalesce(p_name, '')) < 2 then
    return null;
  end if;

  if length(coalesce(p_message, '')) > 2000 or length(coalesce(p_name, '')) > 120 then
    return null;
  end if;

  if p_email is not null and p_email <> '' and length(p_email) > 254 then
    return null;
  end if;

  if exists (
    select 1
    from public.leads l
    where l.card_id = p_card_id
      and l.phone = v_phone
      and l.source = v_source
      and l.created_at > now() - interval '30 days'
  ) then
    return null;
  end if;

  insert into public.leads (card_id, name, phone, email, message, source, status)
  values (
    p_card_id,
    trim(left(coalesce(p_name, ''), 120)),
    v_phone,
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    left(v_source, 40),
    'new'
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

comment on function public.submit_lead(uuid, text, text, text, text, text) is
  'Inserts an enquiry from a public card. Returns the new lead id, or NULL if the card is closed, the input is invalid, or a duplicate was suppressed.';

-- ── Appointment requests ──────────────────────────────────────────────────────

create or replace function public.submit_appointment(
  p_card_id        uuid,
  p_name           text,
  p_phone          text,
  p_email          text,
  p_service        text,
  p_preferred_date date,
  p_preferred_time text,
  p_message        text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card   public.cards%rowtype;
  v_new_id uuid;
  v_phone  text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  select * into v_card
  from public.cards c
  where c.id = p_card_id
    and c.status = 'published'
    and c.deleted_at is null;

  if v_card.id is null or not v_card.open_to_appointments then
    return null;
  end if;

  if length(v_phone) < 10 or length(coalesce(p_name, '')) < 2 then
    return null;
  end if;

  if length(coalesce(p_name, '')) > 120
     or length(coalesce(p_message, '')) > 2000
     or length(coalesce(p_service, '')) > 120
     or length(coalesce(p_preferred_time, '')) > 20 then
    return null;
  end if;

  if p_email is not null and p_email <> '' and length(p_email) > 254 then
    return null;
  end if;

  if p_preferred_date is null or p_preferred_date < current_date then
    return null;
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.card_id = p_card_id
      and a.phone = v_phone
      and a.preferred_date = p_preferred_date
  ) then
    return null;
  end if;

  insert into public.appointments (
    card_id, name, phone, email, service,
    preferred_date, preferred_time, message, status
  )
  values (
    p_card_id,
    trim(left(coalesce(p_name, ''), 120)),
    v_phone,
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(left(coalesce(p_service, ''), 120)), ''),
    p_preferred_date,
    nullif(trim(left(coalesce(p_preferred_time, ''), 20)), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    'pending'
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

comment on function public.submit_appointment(uuid, text, text, text, text, date, text, text) is
  'Inserts an appointment request from a public card. Returns the new id, or NULL if the card is closed, the input is invalid, or the slot was already requested.';

grant execute on function public.submit_lead(uuid, text, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_appointment(uuid, text, text, text, text, date, text, text) to anon, authenticated;
