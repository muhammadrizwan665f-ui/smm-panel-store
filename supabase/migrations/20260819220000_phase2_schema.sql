-- Create service categories table
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_per_1000 DECIMAL(12,2) NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 10,
    max_quantity INTEGER NOT NULL DEFAULT 1000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id),
    platform TEXT,
    service_name TEXT,
    link TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    provider_order_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL, -- 'deposit', 'order_payment', 'refund', 'adjustment'
    status TEXT NOT NULL DEFAULT 'completed',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.service_categories TO authenticated;
GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.service_categories TO service_role;
GRANT ALL ON public.services TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.wallet_transactions TO service_role;

-- Policies
CREATE POLICY "Anyone can view service categories" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Seed data for categories
INSERT INTO public.service_categories (name, icon, display_order) VALUES
('Instagram', 'Instagram', 1),
('TikTok', 'TikTok', 2),
('Facebook', 'Facebook', 3),
('YouTube', 'YouTube', 4),
('Telegram', 'Telegram', 5),
('Twitter / X', 'Twitter', 6),
('Threads', 'Threads', 7),
('Snapchat', 'Snapchat', 8),
('Spotify', 'Spotify', 9),
('Other Services', 'Globe', 10)
ON CONFLICT DO NOTHING;
