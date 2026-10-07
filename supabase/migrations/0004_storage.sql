-- ═══════════════════════════════════════════════════════════════════════════
-- DV CARD — 0004 storage
--
-- Object storage for avatars, covers, logos, product/catalogue images, gallery
-- and portfolio media (section 60).
--
-- PATH CONVENTION (enforced by the policies below):
--     {user_id}/{card_id}/{filename}
--
-- Deriving ownership from the path means a user cannot upload into someone
-- else's folder, and a public URL never exposes another tenant's namespace.
-- Every bucket is world-readable (public card images must render for anonymous
-- visitors) but only the owning card's manager may write or delete.
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',        'avatars',        true, 5242880,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('business-logos', 'business-logos', true, 5242880,  array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml']),
  ('covers',         'covers',         true, 10485760, array['image/jpeg','image/png','image/webp','image/avif']),
  ('products',       'products',       true, 8388608,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('catalogues',     'catalogues',     true, 8388608,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('gallery',        'gallery',        true, 10485760, array['image/jpeg','image/png','image/webp','image/avif']),
  ('portfolio',      'portfolio',      true, 15728640, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Resolves the card id embedded in an object path. Returns NULL for any path
-- that does not match the convention, which fails the policy closed.
create or replace function public.storage_card_id(p_name text)
returns uuid
language sql
immutable
as $$
  select nullif(split_part(p_name, '/', 2), '')::uuid;
$$;

create or replace function public.can_write_storage_object(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- First path segment must be the authenticated user.
    split_part(p_name, '/', 1) = auth.uid()::text
    and public.can_manage_card(public.storage_card_id(p_name));
$$;

-- Avatars are keyed by user only (a user sets their avatar before owning a card),
-- so they get their own narrower policy.
create or replace function public.can_write_avatar_object(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select split_part(p_name, '/', 1) = auth.uid()::text
      or public.is_admin();
$$;

do $$
declare b text;
begin
  foreach b in array array[
    'business-logos','covers','products','catalogues','gallery','portfolio'
  ] loop
    execute format(
      'create policy %1$s_read on storage.objects for select to public
         using (bucket_id = %1$L)', b);

    execute format(
      'create policy %1$s_insert on storage.objects for insert to authenticated
         with check (bucket_id = %1$L and public.can_write_storage_object(name))', b);

    execute format(
      'create policy %1$s_update on storage.objects for update to authenticated
         using (bucket_id = %1$L and public.can_write_storage_object(name))
         with check (bucket_id = %1$L and public.can_write_storage_object(name))', b);

    execute format(
      'create policy %1$s_delete on storage.objects for delete to authenticated
         using (bucket_id = %1$L and public.can_write_storage_object(name))', b);
  end loop;
end $$;

create policy avatars_read on storage.objects
  for select to public using (bucket_id = 'avatars');

create policy avatars_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and public.can_write_avatar_object(name));

create policy avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and public.can_write_avatar_object(name))
  with check (bucket_id = 'avatars' and public.can_write_avatar_object(name));

create policy avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and public.can_write_avatar_object(name));


-- ═══════════════════════════════════════════════════════════════════════════
-- Grants
--
-- The RLS helper functions are SECURITY DEFINER so they bypass RLS internally,
-- but Postgres still requires the caller to hold EXECUTE. Public-facing helpers
-- must be callable by `anon` for the public card to render at all.
-- ═══════════════════════════════════════════════════════════════════════════

grant execute on function public.current_user_id()                    to anon, authenticated;
grant execute on function public.current_user_role()                  to anon, authenticated;
grant execute on function public.is_admin()                           to anon, authenticated;
grant execute on function public.is_reseller()                        to anon, authenticated;
grant execute on function public.is_card_public(uuid)                 to anon, authenticated;
grant execute on function public.can_manage_card(uuid)                to anon, authenticated;
grant execute on function public.can_manage_team(uuid)                to anon, authenticated;
grant execute on function public.reseller_manages(uuid)               to anon, authenticated;
grant execute on function public.storage_card_id(text)                to anon, authenticated;
grant execute on function public.can_write_storage_object(text)       to authenticated;
grant execute on function public.can_write_avatar_object(text)        to authenticated;

-- Money paths. The commission engine, the sweeper and the wallet sync are
-- callable only by the service role (the Razorpay webhook and the cron route
-- both use it after their own auth checks), so EXECUTE is revoked from anon and
-- authenticated entirely.
revoke execute on function public.record_referral_reward(uuid, uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.record_signup_reward(uuid) from public, anon, authenticated;
revoke execute on function public.expire_subscriptions() from public, anon, authenticated;
grant execute on function public.record_referral_reward(uuid, uuid, uuid, integer) to service_role;
grant execute on function public.record_signup_reward(uuid) to service_role;
grant execute on function public.expire_subscriptions() to service_role;

-- A user requests their own payout, so this one IS callable by `authenticated`.
-- request_payout reads auth.uid() internally rather than accepting a user id,
-- so a caller cannot nominate somebody else's wallet.
grant execute on function public.request_payout(integer, text, text, jsonb) to authenticated;

grant execute on function public.sync_referral_wallet(uuid) to service_role;
grant execute on function public.increment_card_counter(uuid, text, integer) to anon, authenticated, service_role;