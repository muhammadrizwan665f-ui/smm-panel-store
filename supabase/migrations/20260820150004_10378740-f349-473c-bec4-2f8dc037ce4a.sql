-- Grant admin role to the target user
INSERT INTO public.user_roles (user_id, role)
VALUES ('5afb0937-1b50-4695-b0dd-fc7728993460', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
