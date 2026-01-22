-- Grant admin role to gabrieltude@opticalgroup.com.br
-- User ID: 4416d4a8-7860-41ff-9105-61befc46dae6

-- Insert admin role (if exists, do nothing)
INSERT INTO public.user_roles (user_id, role)
VALUES ('4416d4a8-7860-41ff-9105-61befc46dae6', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Also confirm the email so user can login
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE id = '4416d4a8-7860-41ff-9105-61befc46dae6';
