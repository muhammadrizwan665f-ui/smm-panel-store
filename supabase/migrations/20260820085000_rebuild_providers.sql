-- Completely drop and recreate the table to force a fresh schema cache
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

CREATE TABLE public.provider_api_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
    operation text NOT NULL,
    request_payload jsonb,
    response_payload jsonb,
    status_code integer,
    is_success boolean,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_api_logs ENABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
GRANT ALL ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO service_role;
GRANT ALL ON public.provider_api_logs TO authenticated;
GRANT ALL ON public.provider_api_logs TO service_role;

-- Policies
CREATE POLICY "Admins can manage providers" ON public.providers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage provider services" ON public.provider_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage logs" ON public.provider_api_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload schema';
