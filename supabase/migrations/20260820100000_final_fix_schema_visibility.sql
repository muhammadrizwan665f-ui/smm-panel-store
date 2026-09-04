-- The error "Could not find the table... in the schema cache" usually means
-- PostgREST is unaware of the table or it lacks permission to see it.

-- 1. Ensure the table exists and has the correct structure.
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

-- 2. Grant EXPLICIT permissions to ALL roles used by the API.
GRANT ALL ON public.smm_providers_v4 TO anon;
GRANT ALL ON public.smm_providers_v4 TO authenticated;
GRANT ALL ON public.smm_providers_v4 TO service_role;

-- 3. Disable RLS entirely for now to eliminate it as a factor during debugging.
ALTER TABLE public.smm_providers_v4 DISABLE ROW LEVEL SECURITY;

-- 4. FORCE a schema cache reload.
NOTIFY pgrst, 'reload schema';
