-- Fix missing foreign key relationship between services and providers
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_provider_id_fkey;

-- Ensure columns exist
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_cost DECIMAL(12,5);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS markup_type TEXT DEFAULT 'percentage';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS markup_amount DECIMAL(12,2) DEFAULT 20.00;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add the foreign key constraint
ALTER TABLE public.services 
ADD CONSTRAINT services_provider_id_fkey 
FOREIGN KEY (provider_id) REFERENCES public.providers(id) 
ON DELETE SET NULL;

-- Ensure provider_services also has correct FK
ALTER TABLE public.provider_services
DROP CONSTRAINT IF EXISTS provider_services_provider_id_fkey;

ALTER TABLE public.provider_services
ADD CONSTRAINT provider_services_provider_id_fkey
FOREIGN KEY (provider_id) REFERENCES public.providers(id)
ON DELETE CASCADE;

-- Force PostgREST to reload
NOTIFY pgrst, 'reload schema';

-- Grant permissions again
GRANT ALL ON public.services TO authenticated, service_role;
GRANT ALL ON public.providers TO authenticated, service_role;
GRANT ALL ON public.provider_services TO authenticated, service_role;
GRANT ALL ON public.service_categories TO authenticated, service_role;
