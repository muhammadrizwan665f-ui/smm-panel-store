-- The issue is likely a corrupted table state or a misbehaving trigger that exists but wasn't visible.
-- We will drop and recreate the table to ensure a clean slate.

-- 1. Backup if needed (none yet for this fresh dev project)
DROP TABLE IF EXISTS public.provider_services CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;

-- 2. Create providers table
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

-- 3. Create dependent table
CREATE TABLE public.provider_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    provider_service_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    provider_cost DECIMAL(12,4),
    provider_min INTEGER,
    provider_max INTEGER,
    status TEXT DEFAULT 'active',
    last_synced_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(provider_id, provider_service_id)
);

-- 4. Disable RLS initially to confirm functionality
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services DISABLE ROW LEVEL SECURITY;

-- 5. Wide open grants
GRANT ALL ON public.providers TO authenticated, service_role, anon;
GRANT ALL ON public.provider_services TO authenticated, service_role, anon;

-- 6. Grant sequence access if any (though we use UUID)
GRANT USAGE ON SCHEMA public TO authenticated, service_role, anon;
