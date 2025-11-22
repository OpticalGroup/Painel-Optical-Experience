-- Grant admin role to tude.mkt@gmail.com
INSERT INTO public.user_roles (user_id, role) 
VALUES ('7177cd80-c853-4ef6-9892-10f4975a59c5', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;