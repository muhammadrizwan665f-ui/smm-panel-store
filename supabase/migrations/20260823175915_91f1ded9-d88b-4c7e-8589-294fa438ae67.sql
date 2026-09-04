-- provider_services: admin only
DROP POLICY IF EXISTS "Anon can view provider_services" ON public.provider_services;
DROP POLICY IF EXISTS "Authenticated users can view provider_services" ON public.provider_services;
REVOKE SELECT ON public.provider_services FROM anon;

-- providers: admin only
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;
DROP POLICY IF EXISTS "Management view can read providers" ON public.providers;
REVOKE SELECT ON public.providers FROM anon;

-- site_settings: admin only
DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
REVOKE SELECT ON public.site_settings FROM anon;

-- services: restrict base table to admins, expose safe public view
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
REVOKE SELECT ON public.services FROM anon;

CREATE OR REPLACE VIEW public.services_public AS
SELECT
  id,
  category_id,
  name,
  description,
  price_per_1000,
  min_quantity,
  max_quantity,
  status,
  icon,
  discount_percent,
  created_at
FROM public.services
WHERE status = 'active';

GRANT SELECT ON public.services_public TO anon, authenticated;
GRANT ALL ON public.services_public TO service_role;