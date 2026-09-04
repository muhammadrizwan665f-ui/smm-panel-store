-- The issue is that RLS DISABLE alone might not be enough if there are still 
-- conflicting GRANTs or if the user is authenticated as a role that has 
-- specifically restricted access.

-- 1. Disable RLS completely
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;

-- 2. Revoke all existing permissions first to clean up any restrictive grants
REVOKE ALL ON public.providers FROM authenticated;
REVOKE ALL ON public.providers FROM anon;
REVOKE ALL ON public.providers FROM service_role;

-- 3. Grant everything to everyone (for isolation testing only)
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.providers TO anon;
GRANT ALL ON public.providers TO service_role;

-- 4. Do the same for related tables just in case they are triggered
ALTER TABLE public.provider_services DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO anon;
GRANT ALL ON public.provider_services TO service_role;

-- 5. Final check on schema permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
