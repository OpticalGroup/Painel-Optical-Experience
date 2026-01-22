-- Create admin user: gabrieltude@opticalgroup.com.br
-- This migration adds admin role to the user after they are created via Supabase Auth

-- First, we need to create the user in auth.users (this should be done via Supabase Dashboard or API)
-- Then add the admin role

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Check if user exists
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'gabrieltude@opticalgroup.com.br';
    
    -- If user exists, add admin role
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin'::app_role)
        ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role;
        
        RAISE NOTICE 'Admin role assigned to user: gabrieltude@opticalgroup.com.br';
    ELSE
        RAISE NOTICE 'User not found. Please create the user first via Supabase Dashboard.';
    END IF;
END $$;
