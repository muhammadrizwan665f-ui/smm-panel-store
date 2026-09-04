-- Drop existing conflicting columns if they exist (though based on schema they shouldn't conflict)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='provider_id') THEN
        ALTER TABLE public.services ADD COLUMN provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='provider_service_id') THEN
        ALTER TABLE public.services ADD COLUMN provider_service_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='provider_rate') THEN
        ALTER TABLE public.services ADD COLUMN provider_rate DECIMAL(12,4) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='customer_rate') THEN
        ALTER TABLE public.services ADD COLUMN customer_rate DECIMAL(12,4) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='status') THEN
        ALTER TABLE public.services ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Update orders table for profit tracking and provider details
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='provider_id') THEN
        ALTER TABLE public.orders ADD COLUMN provider_id UUID REFERENCES public.providers(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='provider_cost') THEN
        ALTER TABLE public.orders ADD COLUMN provider_cost DECIMAL(12,4) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='estimated_profit') THEN
        ALTER TABLE public.orders ADD COLUMN estimated_profit DECIMAL(12,4) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='provider_status') THEN
        ALTER TABLE public.orders ADD COLUMN provider_status TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='provider_response') THEN
        ALTER TABLE public.orders ADD COLUMN provider_response JSONB;
    END IF;
END $$;

-- Create API logs table
CREATE TABLE IF NOT EXISTS public.provider_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    status_code INTEGER,
    is_success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT ON public.provider_api_logs TO authenticated;
GRANT ALL ON public.provider_api_logs TO service_role;
ALTER TABLE public.provider_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view API logs" ON public.provider_api_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
