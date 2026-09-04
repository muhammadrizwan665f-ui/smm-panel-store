ALTER TABLE public.provider_services
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS refill boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancel boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

ALTER TABLE public.provider_services ALTER COLUMN service_id DROP NOT NULL;

DELETE FROM public.provider_services a USING public.provider_services b
 WHERE a.id < b.id AND a.provider_id = b.provider_id AND a.provider_service_id = b.provider_service_id;

CREATE UNIQUE INDEX IF NOT EXISTS provider_services_provider_service_uniq
  ON public.provider_services (provider_id, provider_service_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO service_role;

NOTIFY pgrst, 'reload schema';