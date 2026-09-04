-- 1. Ensure columns exist in provider_services
ALTER TABLE public.provider_services ADD COLUMN IF NOT EXISTS provider_currency text DEFAULT 'USDT';

-- 2. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO service_role;
GRANT SELECT ON public.provider_services TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
GRANT SELECT ON public.providers TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT ALL ON public.service_categories TO service_role;
GRANT SELECT ON public.service_categories TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
GRANT SELECT ON public.site_settings TO anon;

-- 3. Ensure RLS allows visibility
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view provider_services" ON public.provider_services;
CREATE POLICY "Authenticated users can view provider_services" 
ON public.provider_services FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Admins can manage provider_services" ON public.provider_services;
CREATE POLICY "Admins can manage provider_services" 
ON public.provider_services FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Also for anon for preview
DROP POLICY IF EXISTS "Anon can view provider_services" ON public.provider_services;
CREATE POLICY "Anon can view provider_services" 
ON public.provider_services FOR SELECT 
TO anon 
USING (true);
