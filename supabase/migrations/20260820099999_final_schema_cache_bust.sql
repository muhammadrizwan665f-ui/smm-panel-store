-- Forcefully rename the table and avoid the word 'notes' in columns 
-- until the cache is fully cleared.

DROP TABLE IF EXISTS public.smm_providers_v4 CASCADE;
CREATE TABLE public.smm_providers_v4 (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    api_url text NOT NULL,
    api_key text NOT NULL,
    currency text DEFAULT 'INR',
    status text DEFAULT 'active',
    internal_description text,
    created_at timestamptz DEFAULT now()
);

GRANT ALL ON public.smm_providers_v4 TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
