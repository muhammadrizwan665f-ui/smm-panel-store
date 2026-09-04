-- The 'external_providers' table is also failing with schema cache issues.
-- This indicates the schema cache reload is not affecting the relevant PostgREST instance.
-- We will move back to 'smm_providers' but ensures it's created correctly.

DROP TABLE IF EXISTS public.smm_providers CASCADE;
CREATE TABLE public.smm_providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    api_url text NOT NULL,
    api_key text NOT NULL,
    currency text DEFAULT 'INR',
    balance numeric DEFAULT 0,
    status text DEFAULT 'active',
    notes text,
    last_balance_check timestamptz,
    last_sync timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Ensure EVERYTHING can see it
GRANT ALL ON public.smm_providers TO anon, authenticated, service_role;
ALTER TABLE public.smm_providers DISABLE ROW LEVEL SECURITY;

-- Re-create RPCs for this table
CREATE OR REPLACE FUNCTION public.get_smm_providers()
RETURNS SETOF public.smm_providers
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM public.smm_providers ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.add_smm_provider(
    p_name text,
    p_api_url text,
    p_api_key text,
    p_currency text,
    p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id uuid;
BEGIN
    INSERT INTO public.smm_providers (name, api_url, api_key, currency, notes)
    VALUES (p_name, p_api_url, p_api_key, p_currency, p_notes)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_smm_providers() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_smm_provider(text, text, text, text, text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
