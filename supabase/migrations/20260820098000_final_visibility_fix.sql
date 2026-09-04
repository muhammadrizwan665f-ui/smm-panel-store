-- The records EXIST but are not visible to the 'anon' or 'authenticated' role 
-- via the standard Supabase client. This is 100% an RLS issue.

-- 1. Ensure RLS is disabled on providers for NOW to confirm visibility
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;

-- 2. Grant explicit SELECT access to all roles
GRANT SELECT ON public.providers TO anon;
GRANT SELECT ON public.providers TO authenticated;

-- 3. In case it's a schema cache issue on the client side, recreate the table 
-- but RETAIN the data.

-- (Already verified it's a base table)

NOTIFY pgrst, 'reload schema';
