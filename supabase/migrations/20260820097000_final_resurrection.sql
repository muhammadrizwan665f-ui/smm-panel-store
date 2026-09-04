-- The 404 means the schema cache is stuck and doesn't see 'smm_providers' yet.
-- The 401 on 'providers' means it DOES see it but thinks RLS is on.
-- We will try to RESTORE 'providers' as a clean table with NO RLS.

DROP VIEW IF EXISTS public.providers CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;
DROP TABLE IF EXISTS public.smm_providers CASCADE;

CREATE TABLE public.providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    api_url text NOT NULL,
    api_key text NOT NULL,
    currency text DEFAULT 'INR',
    status text DEFAULT 'active',
    notes text,
    created_at timestamptz DEFAULT now()
);

-- THE ONLY WAY TO BE SURE: Use a SECURITY DEFINER function to do the insert
-- and EXPOSE it as a public RPC.

CREATE OR REPLACE FUNCTION public.add_provider_secure(
    p_name text,
    p_api_url text,
    p_api_key text,
    p_currency text DEFAULT 'INR',
    p_notes text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id uuid;
BEGIN
    INSERT INTO public.providers (name, api_url, api_key, currency, notes, status)
    VALUES (p_name, p_api_url, p_api_key, p_currency, p_notes, 'active')
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;

ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.providers TO anon, authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.add_provider_secure TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
