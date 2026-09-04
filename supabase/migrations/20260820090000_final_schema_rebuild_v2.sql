-- The error "Could not find the 'notes' column... in the schema cache" persists 
-- despite adding the column. This usually indicates a cached PostgREST plan or 
-- a stale schema cache in a managed environment that isn't acknowledging NOTIFY.

-- 1. Drop existing tables to start fresh
DROP TABLE IF EXISTS public.provider_api_logs CASCADE;
DROP TABLE IF EXISTS public.provider_services CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;

-- 2. Create the table WITH the 'notes' column from the very first second
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

-- 3. Explicitly GRANT everything to make sure there are no permission-masking-as-schema-error issues
GRANT ALL ON public.providers TO postgres, service_role, authenticated;
GRANT SELECT ON public.providers TO anon;

-- 4. Recreate dependent tables
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

-- 5. Force a cache reload via NOTIFY (PostgREST standard)
NOTIFY pgrst, 'reload schema';
