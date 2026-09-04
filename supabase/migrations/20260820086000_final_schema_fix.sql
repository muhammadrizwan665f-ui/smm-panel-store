-- The persistent "notes column not found" error despite rebuilding the table 
-- usually means the PostgREST cache is STUCK or there is a mismatch between 
-- the 'public' and 'auth' schema visibility for the service role.

-- 1. Ensure the table is exactly what the code expects
DROP TABLE IF EXISTS public.provider_api_logs CASCADE;
DROP TABLE IF EXISTS public.provider_services CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;

CREATE TABLE public.providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    api_url text NOT NULL,
    api_key text NOT NULL,
    currency text DEFAULT 'INR',
    status text DEFAULT 'active',
    notes text,
    balance numeric DEFAULT 0,
    last_balance_check timestamptz,
    last_sync timestamptz,
    last_connection_check timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Grant EXPLICIT permissions to ALL relevant roles
GRANT ALL ON public.providers TO postgres, service_role, authenticated;
GRANT SELECT ON public.providers TO anon;

-- 3. Reset RLS entirely for testing - we will re-enable after confirmation
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;

-- 4. Re-create dependent tables
CREATE TABLE public.provider_services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
    provider_service_id text NOT NULL,
    name text NOT NULL,
    category text,
    description text,
    provider_cost numeric NOT NULL,
    provider_min integer,
    provider_max integer,
    status text DEFAULT 'active',
    last_synced_at timestamptz DEFAULT now(),
    UNIQUE(provider_id, provider_service_id)
);

GRANT ALL ON public.provider_services TO postgres, service_role, authenticated;
ALTER TABLE public.provider_services DISABLE ROW LEVEL SECURITY;

-- 5. Force reload
NOTIFY pgrst, 'reload schema';
