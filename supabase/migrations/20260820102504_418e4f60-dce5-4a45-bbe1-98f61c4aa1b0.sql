
-- Revoke anon access from provider_services for production security
REVOKE SELECT ON public.provider_services FROM anon;
REVOKE SELECT ON public.providers FROM anon;

-- Restore standard authenticated read policy
DROP POLICY IF EXISTS "Anyone can view provider_services" ON public.provider_services;
CREATE POLICY "Authenticated users can view provider_services" ON public.provider_services FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view providers" ON public.providers;
CREATE POLICY "Authenticated users can view providers" ON public.providers FOR SELECT TO authenticated USING (true);
