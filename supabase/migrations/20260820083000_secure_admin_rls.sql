-- Now that we confirmed the table works, let's restore security properly.
-- We use SECURITY DEFINER for role checks to bypass RLS recursion.

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON public.providers;
DROP POLICY IF EXISTS "Temp bypass RLS" ON public.providers;

-- A clean, secure policy for admins
CREATE POLICY "Admins can manage providers"
ON public.providers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure service_role can always access
ALTER TABLE public.providers FORCE ROW LEVEL SECURITY;
GRANT ALL ON public.providers TO service_role;
GRANT SELECT ON public.providers TO authenticated;

-- Also secure the services table which was opened earlier
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage provider services"
ON public.provider_services
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
