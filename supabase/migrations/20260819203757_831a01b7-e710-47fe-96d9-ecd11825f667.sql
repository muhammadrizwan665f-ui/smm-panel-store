-- Create app_role enum
create type public.app_role as enum ('admin', 'user');

-- Create profiles table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  mobile_number text unique not null,
  wallet_balance decimal(12,2) default 0.00 not null,
  status text default 'active' not null,
  created_at timestamptz default now() not null
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Grant permissions
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant all on public.profiles to service_role;
grant all on public.user_roles to service_role;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Security Definer Function to check roles
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

-- RLS Policies
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id);

create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));
