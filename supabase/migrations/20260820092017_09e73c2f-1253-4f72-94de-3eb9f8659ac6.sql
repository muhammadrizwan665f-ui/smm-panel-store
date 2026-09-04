CREATE TABLE public.providers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    api_url text NOT NULL,
    api_key text,
    status text NOT NULL DEFAULT 'active',
    currency text DEFAULT 'INR',
    balance numeric DEFAULT 0.00,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.provider_services (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
    provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
    provider_service_id text NOT NULL,
    provider_cost numeric DEFAULT 0.00,
    provider_min integer DEFAULT 0,
    provider_max integer DEFAULT 0,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO service_role;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage provider_services" ON public.provider_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view provider_services" ON public.provider_services FOR SELECT TO authenticated USING (true);

CREATE TABLE public.payments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    method text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    gateway text,
    gateway_transaction_id text,
    reference text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info',
    target text DEFAULT 'all',
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text DEFAULT 'active',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT ON public.notifications TO anon;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active notifications" ON public.notifications FOR SELECT TO public USING (status = 'active' AND (target = 'all' OR (target = 'user' AND auth.uid() = user_id)));
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.support_tickets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tickets" ON public.support_tickets FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.support_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_admin boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages for their tickets" ON public.support_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "Admins can manage all messages" ON public.support_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.admin_activity_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    target_type text,
    target_id text,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_activity_logs TO authenticated;
GRANT ALL ON public.admin_activity_logs TO service_role;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view logs" ON public.admin_activity_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.site_settings (
    key text PRIMARY KEY,
    value text,
    description text,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
GRANT SELECT ON public.site_settings TO anon;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all transactions" ON public.wallet_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all categories" ON public.service_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all user_roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_service_id TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_rate DECIMAL(12,4) DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS customer_rate DECIMAL(12,4) DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_cost DECIMAL(12,4) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_profit DECIMAL(12,4) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_response JSONB;

CREATE TABLE IF NOT EXISTS public.provider_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    status_code INTEGER,
    is_success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT ON public.provider_api_logs TO authenticated;
GRANT ALL ON public.provider_api_logs TO service_role;
ALTER TABLE public.provider_api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view API logs" ON public.provider_api_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access" ON public.providers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view providers" ON public.providers FOR SELECT TO authenticated USING (true);