-- =====================================================
-- BACKFILL: Sync existing auth.users to profiles + user_roles
-- =====================================================
-- Run this ONCE to create profiles and roles for 
-- existing users that were created before the trigger.

BEGIN;

-- 1. Insert missing profiles from auth.users
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert missing user_roles (default to 'admin' for existing users since they had access)
INSERT INTO public.user_roles (user_id, role, is_approved)
SELECT 
  au.id,
  'admin'::app_role,
  true  -- Existing users are approved by default
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO UPDATE SET is_approved = true;

-- 3. Verify the sync
SELECT 
  'auth.users' as table_name, 
  COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
  'public.profiles', 
  COUNT(*) 
FROM public.profiles
UNION ALL
SELECT 
  'public.user_roles', 
  COUNT(*) 
FROM public.user_roles;

COMMIT;
