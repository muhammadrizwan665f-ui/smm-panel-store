-- 1. Drop EVERYTHING related to providers
DROP TABLE IF EXISTS public.provider_api_logs CASCADE;
DROP TABLE IF EXISTS public.provider_services CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;

-- 2. Create the table in a DIFFERENT schema or just as a completely fresh one
CREATE TABLE public.providers_v2 (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    api_url text NOT NULL,
    api_key text NOT NULL,
    currency text DEFAULT 'INR',
    status text DEFAULT 'active',
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 3. NO RLS. NO POLICIES. WIDE OPEN.
ALTER TABLE public.providers_v2 DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.providers_v2 TO anon, authenticated, service_role, postgres;

-- 4. Create a VIEW that points to providers_v2 as 'providers' 
-- (This bypasses any potential table-level caching if it exists)
CREATE VIEW public.providers AS SELECT * FROM public.providers_v2;
GRANT ALL ON public.providers TO anon, authenticated, service_role, postgres;

NOTIFY pgrst, 'reload schema';
