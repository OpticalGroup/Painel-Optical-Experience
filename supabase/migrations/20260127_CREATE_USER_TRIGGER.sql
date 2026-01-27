-- =====================================================
-- MIGRATION: CREATE TRIGGER WITH ADMIN APPROVAL
-- =====================================================
-- Security: New users start as NOT approved.
-- Only Admin-approved users can access system data.

BEGIN;

-- 1. Add is_approved column to user_roles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN is_approved boolean DEFAULT false;
  END IF;
END $$;

-- 2. Approve existing users (current users are grandfathered in)
UPDATE public.user_roles SET is_approved = true WHERE is_approved IS NULL OR is_approved = false;

-- 3. Function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND is_approved = true
  );
$$;

-- 4. Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();

  -- Create role as PENDING (is_approved = false)
  INSERT INTO public.user_roles (user_id, role, is_approved)
  VALUES (new.id, 'viewer', false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- 5. Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Update RLS policies to require approval for data access
-- Drop old policies
DROP POLICY IF EXISTS "Admins/Operators see all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Sales see own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Approved users can view enrollments" ON public.enrollments;

-- Create new policies requiring approval
CREATE POLICY "Approved users can view enrollments"
ON public.enrollments FOR SELECT
USING (public.is_approved_user());

CREATE POLICY "Admins/Operators manage enrollments"
ON public.enrollments FOR ALL
USING (
  public.is_approved_user() 
  AND (public.is_admin() OR public.has_role('operator'))
);

-- 7. Update cohorts policies
DROP POLICY IF EXISTS "Approved users view cohorts" ON public.cohorts;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users view cohorts"
ON public.cohorts FOR SELECT USING (public.is_approved_user());

COMMIT;
