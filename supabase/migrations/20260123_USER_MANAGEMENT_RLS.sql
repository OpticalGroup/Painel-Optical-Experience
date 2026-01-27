-- =====================================================
-- MIGRATION: ADAPT SCHEMA FOR APP COMPATIBILITY
-- =====================================================
-- Fixed: Handles existing tables without constraints

BEGIN;

-- 1. Add user_id column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN user_id uuid GENERATED ALWAYS AS (id) STORED;
  END IF;
END $$;

-- 2. Create app_role enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'sales', 'viewer');
  END IF;
END $$;

-- 3. Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz DEFAULT now()
);

-- 4. Add unique constraint if not exists (fixes ON CONFLICT issue)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_key' 
    AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 5. Sync existing roles from profiles.primary_role to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  p.id,
  CASE p.primary_role
    WHEN 'admin' THEN 'admin'::app_role
    WHEN 'ceo' THEN 'admin'::app_role
    WHEN 'manager' THEN 'operator'::app_role
    WHEN 'operator' THEN 'operator'::app_role
    WHEN 'closer' THEN 'sales'::app_role
    WHEN 'sdr' THEN 'sales'::app_role
    WHEN 'traffic_manager' THEN 'operator'::app_role
    ELSE 'viewer'::app_role
  END
FROM public.profiles p
WHERE p.id NOT IN (SELECT user_id FROM public.user_roles)
  AND p.primary_role IS NOT NULL;

-- 6. Bootstrap: Make current user admin if no admins exist
DO $$
DECLARE
  current_uid uuid := auth.uid();
BEGIN
  IF current_uid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (current_uid, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
END $$;

-- 7. RLS helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = _role
  );
END;
$$;

-- 8. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 9. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins manage all user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

-- 10. Create policies
CREATE POLICY "Admins manage all user_roles"
ON public.user_roles FOR ALL USING (public.is_admin());

CREATE POLICY "Users read own role"
ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all profiles"
ON public.profiles FOR ALL USING (public.is_admin());

CREATE POLICY "Users read own profile"
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

COMMIT;
