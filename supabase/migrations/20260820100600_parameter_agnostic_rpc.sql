-- Recreate functions with NO named parameters to bypass parameter-name-cache issues.

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

GRANT EXECUTE ON FUNCTION public.execute_raw_sql_v2(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.insert_raw_data_v2(text, jsonb) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
