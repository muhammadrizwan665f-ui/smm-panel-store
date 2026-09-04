-- providers
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS api_version TEXT DEFAULT 'v2';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS last_balance_check TIMESTAMPTZ;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.providers ALTER COLUMN api_key SET NOT NULL;
GRANT ALL ON public.providers TO authenticated, service_role;
GRANT SELECT ON public.providers TO anon;
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;
CREATE POLICY "Management view can read providers" ON public.providers FOR SELECT TO authenticated USING (true);

-- provider_services
ALTER TABLE public.provider_services
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS refill boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancel boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT now();
ALTER TABLE public.provider_services ALTER COLUMN service_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS provider_services_provider_service_uniq
  ON public.provider_services (provider_id, provider_service_id);
GRANT ALL ON public.provider_services TO authenticated, service_role;

-- services / categories
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_cost DECIMAL(12,5);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS markup_type TEXT DEFAULT 'percentage';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS markup_amount DECIMAL(12,2) DEFAULT 20.00;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE public.services ALTER COLUMN status SET DEFAULT 'inactive';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_provider_id_provider_service_id_key') THEN
        ALTER TABLE public.services ADD CONSTRAINT services_provider_id_provider_service_id_key UNIQUE (provider_id, provider_service_id);
    END IF;
END
$$;
CREATE UNIQUE INDEX IF NOT EXISTS service_categories_name_uniq ON public.service_categories (name);
GRANT ALL ON public.services TO authenticated, service_role;
GRANT ALL ON public.service_categories TO authenticated, service_role;
DROP POLICY IF EXISTS "Admins can manage all categories" ON public.service_categories;
CREATE POLICY "Admins can manage service categories" ON public.service_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- default settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('usdt_to_inr', '100', 'Conversion rate from 1 USDT to INR'),
  ('usdt_to_pkr', '290', 'Conversion rate from 1 USDT to PKR'),
  ('provider_currency', 'INR', 'Default provider currency')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- helper routines used by the admin tooling
CREATE OR REPLACE FUNCTION public.execute_raw_sql_v2(text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RETURN jsonb_build_object('error', 'not authorized');
    END IF;
    EXECUTE 'SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (' || $1 || ') t' INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RETURN jsonb_build_object('error', 'not authorized');
    END IF;
    EXECUTE sql_query INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.execute_raw_sql_v2(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_raw_sql_v2(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';