-- If 'providers' is cursed in public, let's use a different name for the table 
-- and update the app code.

DROP VIEW IF EXISTS public.providers;
DROP TABLE IF EXISTS public.providers_v2 CASCADE;

CREATE TABLE public.smm_providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    api_url text NOT NULL,
    api_key text NOT NULL,
    currency text DEFAULT 'INR',
    status text DEFAULT 'active',
    notes text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.smm_providers DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.smm_providers TO anon, authenticated, service_role, postgres;

NOTIFY pgrst, 'reload schema';
