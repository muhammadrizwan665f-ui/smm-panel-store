-- Create RPC functions to bypass PostgREST table schema cache.

-- 1. Get all providers
CREATE OR REPLACE FUNCTION public.get_external_providers()
RETURNS SETOF public.external_providers
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM public.external_providers ORDER BY created_at DESC;
$$;

-- 2. Add a provider
CREATE OR REPLACE FUNCTION public.add_external_provider(
    p_name text,
    p_api_url text,
    p_api_key text,
    p_currency text,
    p_internal_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id uuid;
BEGIN
    INSERT INTO public.external_providers (name, api_url, api_key, currency, internal_description)
    VALUES (p_name, p_api_url, p_api_key, p_currency, p_internal_description)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;

-- 3. Get provider by ID
CREATE OR REPLACE FUNCTION public.get_external_provider_by_id(p_id uuid)
RETURNS public.external_providers
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM public.external_providers WHERE id = p_id LIMIT 1;
$$;

-- 4. Update balance
CREATE OR REPLACE FUNCTION public.update_external_provider_balance(
    p_id uuid,
    p_balance numeric,
    p_currency text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.external_providers
    SET 
        balance = p_balance,
        currency = p_currency,
        last_balance_check = now()
    WHERE id = p_id;
END;
$$;

-- 5. Update sync time
CREATE OR REPLACE FUNCTION public.update_external_provider_sync(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.external_providers
    SET last_sync = now()
    WHERE id = p_id;
END;
$$;

-- Grant execution to all
GRANT EXECUTE ON FUNCTION public.get_external_providers() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_external_provider(text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_external_provider_by_id(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_external_provider_balance(uuid, numeric, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_external_provider_sync(uuid) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
