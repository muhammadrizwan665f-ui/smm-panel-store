-- We suspect has_role is failing or not being seen correctly in the PostgREST cache.
-- Let's try a direct auth.uid() check to see if that works better than a function call.

-- 1. Redefine user_roles table to be super clear about the primary key
-- (Assuming it already exists, let's just make sure)
-- 2. Drop existing policies
DROP POLICY IF EXISTS "Admin full access" ON public.providers;
DROP POLICY IF EXISTS "Temp bypass RLS" ON public.providers;
DROP POLICY IF EXISTS "Admins can manage providers" ON public.providers;

-- 3. Create a policy that checks the role table directly
CREATE POLICY "Admin role access"
ON public.providers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4. Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 5. Grant access
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
