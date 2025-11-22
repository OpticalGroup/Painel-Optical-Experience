-- Add email column to profiles table for easier access
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update existing profiles with emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- Update the handle_new_user function to also copy email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$$;