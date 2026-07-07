-- ====================================================================
-- NagrikTriage — Auth schema
-- Run this ONCE in the Supabase SQL editor after `schema.sql`.
-- It adds: a profiles table tied to auth.users, per-user ticket
-- ownership, RLS policies, and a trigger that auto-creates a profile
-- when a new auth user signs up.
-- ====================================================================

-- ----------------------------------------------------------------
-- 1. PROFILES  (one row per auth user, holds display_name + role)
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text not null default 'Resident',
  role         text not null default 'citizen'
                check (role in ('citizen','officer','mayor')),
  city_id      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 2. Auto-create a profile row when a new auth.users row appears.
--    (also runs on email-change to keep `email` in sync)
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'citizen')
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------
-- 3. Add owner to tickets (so each user sees their own complaints)
-- ----------------------------------------------------------------
alter table public.tickets
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

create index if not exists tickets_owner_id_idx on public.tickets (owner_id);

-- ----------------------------------------------------------------
-- 4. RLS on PROFILES
--    - You can read & update your own profile.
--    - Nothing else.
-- ----------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----------------------------------------------------------------
-- 5. RLS on TICKETS
--    - Citizens can see and create only their OWN tickets.
--    - Officers & mayors (role set on profile) can SELECT every ticket.
--    - Only the owner (or service_role on the server) can change status;
--      we additionally allow officers to UPDATE.
-- ----------------------------------------------------------------

-- Helper: current user's role from profiles
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- SELECT
drop policy if exists "tickets owner read" on public.tickets;
create policy "tickets owner read"
  on public.tickets for select
  using (
    owner_id = auth.uid()
    or public.current_role() in ('officer','mayor')
  );

-- INSERT: only your own tickets
drop policy if exists "tickets owner insert" on public.tickets;
create policy "tickets owner insert"
  on public.tickets for insert
  with check (
    owner_id is not null and owner_id = auth.uid()
  );

-- UPDATE: officers/mayors can advance status
drop policy if exists "tickets staff update" on public.tickets;
create policy "tickets staff update"
  on public.tickets for update
  using (public.current_role() in ('officer','mayor'));

-- Optional: widen the demo read so logged-OUT visitors still see the
-- seeded tickets (matches the old "open demo" behaviour). Comment this
-- out to lock everything down to logged-in users.
drop policy if exists "tickets anonymous read" on public.tickets;
create policy "tickets anonymous read"
  on public.tickets for select
  using (true);
