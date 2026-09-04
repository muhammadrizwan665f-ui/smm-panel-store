ALTER TABLE public.services ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(10, 2) DEFAULT 0;
GRANT ALL ON public.services TO authenticated, service_role;
GRANT SELECT ON public.services TO anon;