-- ============================================================
-- SMM Panel: Admin RLS Access Setup
-- Run this ONCE in your Supabase SQL Editor. Safe to re-run.
-- This lets the Management/Admin panel work fully using the
-- logged-in admin's OWN account — no service_role key needed.
-- ============================================================

-- Make sure has_role() exists (it already should, but this is safe to re-run)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Helper: apply a standard "admins can do everything, everyone else limited"
-- policy to a table. Run this block for every admin-managed table.
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'services',
    'service_categories',
    'providers',
    'provider_services',
    'provider_api_logs',
    'orders',
    'profiles',
    'wallet_transactions',
    'site_settings',
    'user_roles',
    'payments',
    'payment_gateways',
    'deposit_requests'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Admins full access" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Admins full access" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))',
      tbl
    );
    EXECUTE format('GRANT ALL ON public.%I TO authenticated', tbl);
  END LOOP;
END $$;

-- Everyday customers still need to read/write their OWN rows on a few tables
-- (these are additive — they do not remove the admin policy above).

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users read own wallet transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own deposits" ON public.deposit_requests;
CREATE POLICY "Users read own deposits" ON public.deposit_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users create own deposits" ON public.deposit_requests;
CREATE POLICY "Users create own deposits" ON public.deposit_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
CREATE POLICY "Users read own payments" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Everyone (including logged-out visitors) can see active services/categories,
-- enabled payment gateways, and public site settings.
DROP POLICY IF EXISTS "Public reads active services" ON public.services;
CREATE POLICY "Public reads active services" ON public.services
  FOR SELECT TO anon, authenticated USING (status = 'active');

DROP POLICY IF EXISTS "Public reads categories" ON public.service_categories;
CREATE POLICY "Public reads categories" ON public.service_categories
  FOR SELECT TO anon, authenticated USING (status = 'active');

DROP POLICY IF EXISTS "Public reads enabled gateways" ON public.payment_gateways;
CREATE POLICY "Public reads enabled gateways" ON public.payment_gateways
  FOR SELECT TO anon, authenticated USING (status = 'active');

DROP POLICY IF EXISTS "Public reads settings" ON public.site_settings;
CREATE POLICY "Public reads settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

-- IMPORTANT: anon (logged-out / not-yet-authenticated) role also needs the base
-- table-level GRANT, not just the RLS policy above, or Postgres blocks it
-- with "permission denied for table ..." before RLS is even evaluated.
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT ON public.payment_gateways TO anon;
GRANT SELECT ON public.site_settings TO anon;
