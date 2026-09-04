-- Totally reset the table's RLS state
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Admin access via function" ON public.providers;
DROP POLICY IF EXISTS "Admin role access" ON public.providers;
DROP POLICY IF EXISTS "Temp bypass RLS" ON public.providers;
DROP POLICY IF EXISTS "Admin full access" ON public.providers;
DROP POLICY IF EXISTS "Admins can manage providers" ON public.providers;
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;

-- Re-enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible authenticated policy
CREATE POLICY "authenticated_all" ON public.providers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure grants are correct
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
GRANT ALL ON public.providers TO anon;
