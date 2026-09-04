-- Revoke execute from public role explicitly (redundant but good for linter)
revoke execute on function public.has_role(uuid, app_role) from public;
-- Move to a private schema if needed, but for now just ensure execute is revoked from anon
revoke execute on function public.has_role(uuid, app_role) from anon;
