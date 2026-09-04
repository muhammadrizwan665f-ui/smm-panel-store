-- We will use the MOST BASIC approach possible.
-- A single function that takes a JSON with 'query' key.

DROP FUNCTION IF EXISTS public.exec_sql(text);
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
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

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
