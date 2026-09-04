-- Create a helper function to execute raw SQL for emergencies like schema cache stalls.
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    EXECUTE sql_query INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- Fallback for queries that don't return INTO a variable easily
    EXECUTE sql_query;
    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
