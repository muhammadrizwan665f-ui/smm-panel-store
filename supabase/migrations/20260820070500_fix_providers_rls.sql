-- Grant broad access to admins using has_role check
-- Make sure the function exists and is accessible
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
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- Re-enable RLS on providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage providers" ON public.providers;

-- Create a clean management policy
CREATE POLICY "Admins can manage providers"
ON public.providers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure authenticated users can at least see providers (required for UI)
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;
CREATE POLICY "Authenticated users can view providers"
ON public.providers
FOR SELECT
TO authenticated
USING (true);
