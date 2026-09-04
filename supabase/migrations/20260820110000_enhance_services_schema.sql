-- Add status and provider mapping to service_categories if missing
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Enhance services table for provider mapping and profit management
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_service_id TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_rate DECIMAL(12,5); -- Rate in provider currency (e.g. INR)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_cost DECIMAL(12,5); -- Cost in internal currency (PKR)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS markup_type TEXT DEFAULT 'percentage';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS markup_amount DECIMAL(12,2) DEFAULT 20.00;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint for provider service mapping to prevent duplicates
-- Use a DO block to safely add the constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_provider_id_provider_service_id_key') THEN
        ALTER TABLE public.services ADD CONSTRAINT services_provider_id_provider_service_id_key UNIQUE (provider_id, provider_service_id);
    END IF;
END
$$;

-- Ensure proper grants for management
GRANT ALL ON public.service_categories TO authenticated;
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.service_categories TO service_role;
GRANT ALL ON public.services TO service_role;

-- Update RLS policies to allow admins to manage services
-- Assuming has_role function exists from previous context
DROP POLICY IF EXISTS "Admins can manage service categories" ON public.service_categories;
CREATE POLICY "Admins can manage service categories" ON public.service_categories
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Ensure provider_services table is ready for fetching
CREATE TABLE IF NOT EXISTS public.provider_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    provider_service_id TEXT NOT NULL,
    name TEXT,
    category TEXT,
    description TEXT,
    provider_cost DECIMAL(12,5),
    provider_min INTEGER,
    provider_max INTEGER,
    status TEXT DEFAULT 'active',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(provider_id, provider_service_id)
);

GRANT ALL ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO service_role;

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage provider services" ON public.provider_services
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
