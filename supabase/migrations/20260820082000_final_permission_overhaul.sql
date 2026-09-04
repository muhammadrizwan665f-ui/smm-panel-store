-- 1. Completely drop and recreate the table to ensure absolute clean state
DROP TABLE IF EXISTS public.provider_services CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;

CREATE TABLE public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    currency TEXT DEFAULT 'INR',
    balance DECIMAL(12,2) DEFAULT 0.00,
    status TEXT DEFAULT 'active',
    last_balance_check TIMESTAMPTZ,
    last_sync TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DISABLE RLS PERMANENTLY FOR NOW
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;

-- 3. GRANT ALL PRIVILEGES TO ALL ROLES EXPLICITLY
GRANT ALL ON TABLE public.providers TO anon, authenticated, service_role;

-- 4. Re-grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 5. Force a reload of the PostgREST schema cache by doing a small DDL change
COMMENT ON TABLE public.providers IS 'SMM Providers list';
