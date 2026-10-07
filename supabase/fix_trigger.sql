-- Run this in Supabase Dashboard → SQL Editor
-- This fixes the handle_new_user trigger

-- Drop and recreate the trigger on auth.users
drop trigger if exists trg_auth_user_created on auth.users;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
