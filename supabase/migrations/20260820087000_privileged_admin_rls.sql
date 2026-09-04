-- The previous RLS violation was likely due to recursion or lack of grant access 
-- to the auth-checking function. We use a SECURITY DEFINER function to bypass this.

-- 1. Ensure the has_role function exists and is accessible
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- 2. Apply explicit GRANTS to the providers table
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
GRANT SELECT ON public.providers TO anon;

-- 3. Re-enable RLS and apply policies
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage providers" ON public.providers;
CREATE POLICY "Admins can manage providers"
ON public.providers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Add a policy for authenticated users to SELECT (so they show up in the list)
-- Note: 'admin' is a role, so public.has_role(auth.uid(), 'admin') covers this.
-- If the UI needs non-admins to see them, add a separate policy.

-- 5. Force reload
NOTIFY pgrst, 'reload schema';
