-- Create providers table
CREATE TABLE public.providers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    api_url text NOT NULL,
    api_key text,
    status text NOT NULL DEFAULT 'active',
    currency text DEFAULT 'INR',
    balance numeric DEFAULT 0.00,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT providers_pkey PRIMARY KEY (id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage providers" ON public.providers
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Create provider_services table
CREATE TABLE public.provider_services (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
    provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
    provider_service_id text NOT NULL,
    provider_cost numeric DEFAULT 0.00,
    provider_min integer DEFAULT 0,
    provider_max integer DEFAULT 0,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT provider_services_pkey PRIMARY KEY (id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO service_role;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage provider_services" ON public.provider_services
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view provider_services" ON public.provider_services
    FOR SELECT TO authenticated
    USING (true);

-- Create payments table
CREATE TABLE public.payments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    method text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    gateway text,
    gateway_transaction_id text,
    reference text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT payments_pkey PRIMARY KEY (id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments" ON public.payments
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Create notifications table
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info',
    target text DEFAULT 'all', -- 'all', 'user'
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text DEFAULT 'active',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT ON public.notifications TO anon;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active notifications" ON public.notifications
    FOR SELECT TO public
    USING (status = 'active' AND (target = 'all' OR (target = 'user' AND auth.uid() = user_id)));

CREATE POLICY "Admins can manage notifications" ON public.notifications
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Create support_tickets table
CREATE TABLE public.support_tickets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT support_tickets_pkey PRIMARY KEY (id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tickets" ON public.support_tickets
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Create support_messages table
CREATE TABLE public.support_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_admin boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT support_messages_pkey PRIMARY KEY (id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their tickets" ON public.support_messages
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid()));

CREATE POLICY "Admins can manage all messages" ON public.support_messages
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Create admin_activity_logs table
CREATE TABLE public.admin_activity_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    target_type text,
    target_id text,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT admin_activity_logs_pkey PRIMARY KEY (id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_activity_logs TO authenticated;
GRANT ALL ON public.admin_activity_logs TO service_role;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs" ON public.admin_activity_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Create site_settings table
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

CREATE POLICY "Anyone can view settings" ON public.site_settings
    FOR SELECT TO public
    USING (true);

CREATE POLICY "Admins can manage settings" ON public.site_settings
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Update existing table policies to allow admin access
CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all transactions" ON public.wallet_transactions
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all services" ON public.services
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all categories" ON public.service_categories
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all user_roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
