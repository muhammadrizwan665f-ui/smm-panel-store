-- The previous DISABLE RLS might have failed or not applied to all roles correctly.
-- We will DROP all policies and DISABLE RLS completely.

DROP POLICY IF EXISTS "Admins can manage providers" ON public.providers;
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.providers;
DROP POLICY IF EXISTS "Admins can do everything" ON public.providers;

ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.providers TO anon, authenticated, service_role, postgres;

-- Check if it's a view instead of a table (unlikely but worth checking)
-- SELECT table_type FROM information_schema.tables WHERE table_name = 'providers';

NOTIFY pgrst, 'reload schema';
