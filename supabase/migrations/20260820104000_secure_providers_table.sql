-- Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Grant permissions to ensure management functions (which use service_role or authenticated) work
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
GRANT SELECT ON public.providers TO anon;

-- Policy: Authenticated users (admin check is handled in management route, but we add it here too)
CREATE POLICY "Admins can manage providers"
ON public.providers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Anon users can read (only if needed for public stats, otherwise restricted)
-- For now, we allow reading for verified management
CREATE POLICY "Management view can read providers"
ON public.providers
FOR SELECT
TO authenticated
USING (true);

-- Ensure service_role has full access for server functions
ALTER TABLE public.providers FORCE ROW LEVEL SECURITY;
