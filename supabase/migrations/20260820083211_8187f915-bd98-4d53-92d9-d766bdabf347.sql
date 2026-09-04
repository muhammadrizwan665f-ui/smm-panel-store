-- Drop old versions that might be causing confusion
DROP FUNCTION IF EXISTS public.exec_sql(text);
DROP FUNCTION IF EXISTS public.execute_raw_sql(text);

-- Ensure our primary functions exist and are parameter-agnostic (v2 pattern)
-- execute_raw_sql_v2 for SELECTs
CREATE OR REPLACE FUNCTION public.execute_raw_sql_v2(text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    EXECUTE 'SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (' || $1 || ') t' INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- insert_raw_data_v2 for INSERTs
CREATE OR REPLACE FUNCTION public.insert_raw_data_v2(text, jsonb)
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
    FROM jsonb_each_text($2)
    INTO cols, vals;

    final_query := 'INSERT INTO ' || quote_ident($1) || ' (' || cols || ') VALUES (' || vals || ') RETURNING id';
    EXECUTE final_query INTO inserted_id;
    RETURN jsonb_build_object('success', true, 'id', inserted_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execution to all roles
GRANT EXECUTE ON FUNCTION public.execute_raw_sql_v2(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.insert_raw_data_v2(text, jsonb) TO anon, authenticated, service_role;

-- Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';