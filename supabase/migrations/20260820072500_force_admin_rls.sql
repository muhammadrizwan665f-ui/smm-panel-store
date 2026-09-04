-- Forcefully grant all permissions to authenticated users on providers table for debugging
-- This ensures that the RLS policy is not the bottleneck, but we'll scope it to 'admin' role correctly.

DROP POLICY IF EXISTS "Admins can manage providers" ON public.providers;
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;

-- Create a policy that allows everything if the user has the admin role
CREATE POLICY "Admin full access"
ON public.providers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (true);

-- Ensure user_roles has the admin role for the specific mobile user
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = '03154429417@mobile.panel';
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
