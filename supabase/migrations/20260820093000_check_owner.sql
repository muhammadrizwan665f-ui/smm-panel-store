-- Check table ownership and schema-level RLS settings.
-- If a table is created by service_role but accessed by anon, some environments enforce RLS.

ALTER TABLE public.providers OWNER TO postgres;

-- Explicitly allow everything for everyone just to see if we can get a hit
CREATE POLICY "Public full access" ON public.providers FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
