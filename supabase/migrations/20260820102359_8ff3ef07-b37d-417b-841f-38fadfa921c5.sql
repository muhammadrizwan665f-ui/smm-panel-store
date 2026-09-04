
-- Grant access to all tables for authenticated users and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Special cases: allowed reads for anon if needed (e.g. site settings)
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.provider_services TO anon;
GRANT SELECT ON public.providers TO anon;

-- Ensure RLS is enabled on all tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Fix the provider_services policies to allow it to be more visible
DROP POLICY IF EXISTS "Authenticated users can view provider_services" ON public.provider_services;
CREATE POLICY "Anyone can view provider_services" ON public.provider_services FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Admins can manage provider_services" ON public.provider_services;
CREATE POLICY "Admins can manage provider_services" ON public.provider_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Also for providers
DROP POLICY IF EXISTS "Anyone can view providers" ON public.providers;
CREATE POLICY "Anyone can view providers" ON public.providers FOR SELECT TO authenticated, anon USING (true);
