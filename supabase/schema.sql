-- Agent CRM: schema inicial do MVP
-- Execute no SQL Editor do Supabase. Habilite confirmação de e-mail nas configurações de Auth conforme sua preferência.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 180),
  segment text,
  city text,
  state text not null default 'MT',
  phone text,
  email text,
  website text,
  source text not null default 'Outro',
  status text not null default 'new' check (status in ('new','qualified','contacted','replied','proposal','won','lost')),
  service text,
  estimated_value numeric(12,2) check (estimated_value is null or estimated_value >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_user_created_idx on public.leads (user_id, created_at desc);
create index if not exists leads_user_status_idx on public.leads (user_id, status);
create index if not exists leads_user_name_idx on public.leads (user_id, lower(name));

alter table public.leads enable row level security;

drop policy if exists "Users can read own leads" on public.leads;
create policy "Users can read own leads"
  on public.leads for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own leads" on public.leads;
create policy "Users can create own leads"
  on public.leads for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own leads" on public.leads;
create policy "Users can update own leads"
  on public.leads for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own leads" on public.leads;
create policy "Users can delete own leads"
  on public.leads for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.leads to authenticated;
