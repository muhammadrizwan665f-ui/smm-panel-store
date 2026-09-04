-- The ultimate RLS bypass for testing.
-- Disables RLS completely on the table.
-- If it still fails, the error is NOT RLS.

ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;

-- Ensure grants are wide open for all roles
GRANT ALL ON public.providers TO anon;
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
