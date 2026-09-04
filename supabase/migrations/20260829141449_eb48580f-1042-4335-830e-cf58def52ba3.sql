ALTER TABLE public.services ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'api';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS fixed_price numeric;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS allow_quantity boolean NOT NULL DEFAULT false;

ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'api';

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'api';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contact_whatsapp text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS note text;

CREATE INDEX IF NOT EXISTS idx_services_service_type ON public.services(service_type);
CREATE INDEX IF NOT EXISTS idx_categories_service_type ON public.service_categories(service_type);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);

GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.service_categories TO anon;

DROP POLICY IF EXISTS "Public can view active manual services" ON public.services;
CREATE POLICY "Public can view active manual services"
  ON public.services FOR SELECT
  USING (service_type = 'manual' AND status = 'active');

DROP POLICY IF EXISTS "Admins manage services" ON public.services;
CREATE POLICY "Admins manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can view active manual categories" ON public.service_categories;
CREATE POLICY "Public can view active manual categories"
  ON public.service_categories FOR SELECT
  USING (service_type = 'manual' AND coalesce(status, 'active') = 'active');

DROP POLICY IF EXISTS "Admins manage categories" ON public.service_categories;
CREATE POLICY "Admins manage categories"
  ON public.service_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));