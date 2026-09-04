CREATE TABLE public.payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL DEFAULT 'bharatpay',
  qr_image_url text,
  merchant_id text,
  access_token text,
  api_url text DEFAULT 'https://api.bharatpay.io/v1/transaction/status',
  instructions text,
  min_amount numeric NOT NULL DEFAULT 100,
  max_amount numeric NOT NULL DEFAULT 100000,
  auto_verify boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.payment_gateways TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateways TO authenticated;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payment gateways" ON public.payment_gateways FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.deposit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gateway_id uuid REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  utr text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  verification_response jsonb,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE UNIQUE INDEX deposit_requests_utr_unique ON public.deposit_requests (lower(utr));

GRANT ALL ON public.deposit_requests TO service_role;
GRANT SELECT, INSERT ON public.deposit_requests TO authenticated;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own deposits" ON public.deposit_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all deposits" ON public.deposit_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));