-- ─────────────────────────────────────────────────────────────────────────────
-- DV CARD — 0005 public card plan gate
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Why this exists
-- ---------------
-- The public card renderer needs to know two things that live behind RLS:
--
--   1. may this card drop the "Made with DV Card" footer?  (`remove_branding`)
--   2. which paid sections may still be shown?                  (catalogue, video…)
--
-- `profiles` and `subscriptions` are deliberately *not* publicly readable — an
-- anonymous visitor must never be able to enumerate subscriptions. So we expose
-- one narrow, read-only, SECURITY DEFINER function that returns ONLY the boolean
-- and integer limits the renderer needs for a card that is already published.
--
-- This is not a security boundary for the data itself (an unpublished card still
-- 404s, because this function refuses to answer for one). It exists so plan
-- gating stays correct on the *live* card: when a subscription lapses and the
-- sweeper suspends the card, the branding returns and the paid sections hide.
--
-- Resolution order: an 'active' subscription wins over a 'grace' one; within the
-- same status the one that runs longest is chosen. A user with no usable
-- subscription is treated as Free.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.public_card_gate(p_card_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_owner_id  uuid;
  v_limits    jsonb := '{}'::jsonb;
  v_defaults  jsonb;
  v_merged    jsonb;
  v_result    jsonb;
begin
  -- Answer only for a live, published card. Everything else gets NULL, which the
  -- application treats as "not found" rather than guessing at limits.
  select c.user_id into v_owner_id
  from public.cards c
  where c.id = p_card_id
    and c.status = 'published'
    and c.deleted_at is null;

  if v_owner_id is null then
    return null;
  end if;

  select coalesce(p.limits, '{}'::jsonb) into v_limits
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.user_id = v_owner_id
    and s.status in ('active', 'grace')
  order by
    case s.status when 'active' then 0 else 1 end,
    coalesce(s.current_period_end, 'epoch'::timestamptz) desc
  limit 1;

  v_limits := coalesce(v_limits, '{}'::jsonb);

  -- Free-plan defaults, matching src/lib/plan-limits.ts. Merging first and then
  -- picking keys whitelists the output: whatever is in `limits`, only these
  -- eleven keys can ever leave the function.
  v_defaults := jsonb_build_object(
    'remove_branding',      false,
    'premium_themes',       false,
    'catalogue',            false,
    'video',                false,
    'upi_payments',         true,
    'appointment_booking',  true,
    'max_services',         5,
    'max_products',         5,
    'max_gallery_items',    10,
    'max_portfolio_items',  3,
    'max_catalogue_items',  20
  );

  v_merged := v_defaults || v_limits;

  v_result := jsonb_build_object(
    'remove_branding',     v_merged -> 'remove_branding',
    'premium_themes',      v_merged -> 'premium_themes',
    'catalogue',           v_merged -> 'catalogue',
    'video',               v_merged -> 'video',
    'upi_payments',        v_merged -> 'upi_payments',
    'appointment_booking', v_merged -> 'appointment_booking',
    'max_services',        v_merged -> 'max_services',
    'max_products',        v_merged -> 'max_products',
    'max_gallery_items',   v_merged -> 'max_gallery_items',
    'max_portfolio_items', v_merged -> 'max_portfolio_items',
    'max_catalogue_items', v_merged -> 'max_catalogue_items'
  );

  return v_result;
end;
$$;

comment on function public.public_card_gate(uuid) is
  'Plan-derived, non-sensitive limits for rendering a published card. Returns NULL for a card that is not published.';

-- Public by design: the anon key calls this for every card view.
grant execute on function public.public_card_gate(uuid) to anon, authenticated;
