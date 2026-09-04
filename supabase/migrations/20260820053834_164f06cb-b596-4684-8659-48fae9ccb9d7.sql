ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;

-- Revoke execute on handle_new_user from public/authenticated (it's a trigger function)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
