REVOKE ALL ON FUNCTION public.exec_sql(text) FROM authenticated, anon, public;
REVOKE ALL ON FUNCTION public.execute_raw_sql_v2(text) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_raw_sql_v2(text) TO service_role;