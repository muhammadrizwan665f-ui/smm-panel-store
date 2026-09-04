-- Drop ALL existing policies on providers to ensure a clean slate
DROP POLICY IF EXISTS "Admin role access" ON public.providers;
DROP POLICY IF EXISTS "Temp bypass RLS" ON public.providers;
DROP POLICY IF EXISTS "Admin full access" ON public.providers;
DROP POLICY IF EXISTS "Admins can manage providers" ON public.providers;
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;

-- Use a SECURITY DEFINER function to check role to avoid recursion if any
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Apply the policy using the security definer function
CREATE POLICY "Admin access via function"
ON public.providers
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Ensure RLS is active
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Explicitly grant permissions to the roles
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;

-- Verify the admin user again
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
