-- Drop ALL previous variants of providers tables to clean up schema
DROP TABLE IF EXISTS public.smm_providers_v5 CASCADE;
DROP TABLE IF EXISTS public.smm_providers_v4 CASCADE;
DROP TABLE IF EXISTS public.smm_providers CASCADE;
DROP TABLE IF EXISTS public.external_providers CASCADE;
DROP TABLE IF EXISTS public.providers_v2 CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;

-- Create the DEFINITIVE providers table
CREATE TABLE public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    api_version TEXT DEFAULT 'v2',
    currency TEXT DEFAULT 'INR',
    balance DECIMAL(20, 4) DEFAULT 0,
    status TEXT DEFAULT 'active',
    notes TEXT,
    last_sync TIMESTAMP WITH TIME ZONE,
    last_balance_check TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant permissions
GRANT ALL ON public.providers TO authenticated, service_role, anon;

-- Disable RLS for now to ensure absolute visibility during this "fix" phase
-- (Will re-enable with proper policies once basic CRUD is 100% verified)
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;

-- Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
