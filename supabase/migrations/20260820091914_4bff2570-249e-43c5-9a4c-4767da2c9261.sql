-- ==== 20260819203757 ====
DO $guard$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  mobile_number text unique not null,
  wallet_balance decimal(12,2) default 0.00 not null,
  status text default 'active' not null,
  created_at timestamptz default now() not null
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant all on public.profiles to service_role;
grant all on public.user_roles to service_role;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
for select
to authenticated
using (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
for update
to authenticated
using (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- ==== 20260819203805 ====
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

revoke execute on function public.has_role(uuid, app_role) from public;
revoke execute on function public.has_role(uuid, app_role) from anon;

-- ==== 20260819205030 ====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, mobile_number, wallet_balance, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'mobile_number', split_part(new.email, '@', 1)),
    0,
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;

-- ==== 20260819213241 ====
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Anyone can view service categories" ON public.service_categories;
CREATE POLICY "Anyone can view service categories" ON public.service_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

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