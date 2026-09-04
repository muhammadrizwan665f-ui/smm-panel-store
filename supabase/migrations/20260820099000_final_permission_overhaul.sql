-- The records are visible to 'service_role' but NOT to 'anon' even with RLS disabled.
-- This usually means a GRANT problem at the schema level or table level.

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.providers TO anon, authenticated;

-- Ensure RLS is OFF
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
