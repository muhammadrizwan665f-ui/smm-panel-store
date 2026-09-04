-- Revoke execute from public and authenticated for the security definer function
-- It should only be used by the system (rls)
revoke execute on function public.has_role(uuid, app_role) from public;
revoke execute on function public.has_role(uuid, app_role) from authenticated;

-- Add RLS policy for user_roles so users can see their own roles
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);
