ALTER TABLE public.smm_providers_v5 ADD COLUMN IF NOT EXISTS api_version text DEFAULT 'v2';
NOTIFY pgrst, 'reload schema';
