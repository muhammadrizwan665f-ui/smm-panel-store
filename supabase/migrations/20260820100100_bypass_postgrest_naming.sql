-- The name smm_providers_v4 might be getting mangled or filtered.
-- Let's try a very standard name and ensure it's in the public schema.

DROP TABLE IF EXISTS public.external_providers CASCADE;
CREATE TABLE public.external_providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    api_url text NOT NULL,
    api_key text NOT NULL,
    currency text DEFAULT 'INR',
    status text DEFAULT 'active',
    internal_description text,
    created_at timestamptz DEFAULT now()
);

GRANT ALL ON public.external_providers TO anon, authenticated, service_role;
ALTER TABLE public.external_providers DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
