-- The browser is failing to find functions in the schema cache.
-- We will recreate the tables AND functions with DIFFERENT NAMES to force a cache miss.

DROP TABLE IF EXISTS public.smm_providers_v5 CASCADE;
CREATE TABLE public.smm_providers_v5 (
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

-- Universal access
GRANT ALL ON public.smm_providers_v5 TO anon, authenticated, service_role;
ALTER TABLE public.smm_providers_v5 DISABLE ROW LEVEL SECURITY;

-- RPC with NEW NAME to force cache reload
CREATE OR REPLACE FUNCTION public.execute_raw_sql_v1(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    EXECUTE 'SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (' || sql_query || ') t' INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_raw_data_v1(target_table text, data_fields jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cols text;
    vals text;
    final_query text;
    inserted_id uuid;
BEGIN
    SELECT string_agg(quote_ident(key), ', '), string_agg(quote_literal(value), ', ')
    FROM jsonb_each_text(data_fields)
    INTO cols, vals;

    final_query := 'INSERT INTO ' || quote_ident(target_table) || ' (' || cols || ') VALUES (' || vals || ') RETURNING id';
    EXECUTE final_query INTO inserted_id;
    RETURN jsonb_build_object('success', true, 'id', inserted_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_raw_sql_v1(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.insert_raw_data_v1(text, jsonb) TO anon, authenticated, service_role;

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
