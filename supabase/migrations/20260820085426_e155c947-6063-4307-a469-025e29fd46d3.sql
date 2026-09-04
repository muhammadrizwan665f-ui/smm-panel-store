CREATE UNIQUE INDEX IF NOT EXISTS services_provider_service_uniq
  ON public.services (provider_id, provider_service_id)
  WHERE provider_id IS NOT NULL AND provider_service_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_categories_name_uniq
  ON public.service_categories (name);

NOTIFY pgrst, 'reload schema';