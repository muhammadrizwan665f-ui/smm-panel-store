-- Create a high-privilege RPC that can execute raw queries to bypass schema cache.

CREATE OR REPLACE FUNCTION public.execute_admin_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    EXECUTE 'SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (' || query_text || ') t' INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.execute_admin_insert(table_name text, data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cols text;
    vals text;
    query text;
    result jsonb;
BEGIN
    SELECT string_agg(key, ', '), string_agg(quote_literal(value), ', ')
    FROM jsonb_each_text(data)
    INTO cols, vals;

    query := 'INSERT INTO ' || quote_ident(table_name) || ' (' || cols || ') VALUES (' || vals || ') RETURNING id';
    EXECUTE query INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_admin_query(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.execute_admin_insert(text, jsonb) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
