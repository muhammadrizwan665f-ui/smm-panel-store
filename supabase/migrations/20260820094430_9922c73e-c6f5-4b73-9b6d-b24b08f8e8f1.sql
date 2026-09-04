-- de-duplicate before adding unique keys
DELETE FROM public.provider_services a USING public.provider_services b
 WHERE a.ctid < b.ctid AND a.provider_id = b.provider_id AND a.provider_service_id = b.provider_service_id;
DELETE FROM public.service_categories a USING public.service_categories b
 WHERE a.ctid < b.ctid AND a.name = b.name;

CREATE UNIQUE INDEX IF NOT EXISTS provider_services_provider_id_provider_service_id_key
  ON public.provider_services (provider_id, provider_service_id);
CREATE UNIQUE INDEX IF NOT EXISTS service_categories_name_key
  ON public.service_categories (name);