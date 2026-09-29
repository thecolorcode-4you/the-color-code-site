-- The Color Code — database setup. Paste all of this into Supabase → SQL Editor → Run.
-- Safe to run more than once.

-- Every quiz result a customer saves.
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  season text not null,
  reason text,
  answers jsonb not null,
  method text not null default 'quiz',
  research_consent boolean not null default false,
  team_note text
);

-- Who counts as The Color Code team (sees every result).
create table if not exists public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.analyses enable row level security;
alter table public.team_members enable row level security;

create or replace function public.is_team() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.team_members where user_id = auth.uid()) $$;

-- A saved result always belongs to whoever is logged in, with their real email.
create or replace function public.set_analysis_owner() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new.user_id := auth.uid();
  new.email := auth.jwt() ->> 'email';
  new.team_note := null;
  return new;
end $$;

drop trigger if exists analyses_owner on public.analyses;
create trigger analyses_owner before insert on public.analyses
for each row execute function public.set_analysis_owner();

-- Customers see only their own results; the team sees everything.
drop policy if exists "own or team can read" on public.analyses;
create policy "own or team can read" on public.analyses
  for select to authenticated using (user_id = auth.uid() or public.is_team());

drop policy if exists "customers add their own" on public.analyses;
create policy "customers add their own" on public.analyses
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "customers delete their own" on public.analyses;
create policy "customers delete their own" on public.analyses
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "team can reply" on public.analyses;
create policy "team can reply" on public.analyses
  for update to authenticated using (public.is_team()) with check (public.is_team());

drop policy if exists "see own team membership" on public.team_members;
create policy "see own team membership" on public.team_members
  for select to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.analyses to authenticated;
grant select on public.team_members to authenticated;
grant execute on function public.is_team() to authenticated;

-- AFTER all five of you have created accounts on the site, run this once
-- with your real emails to make yourselves the team:
-- insert into public.team_members (user_id)
--   select id from auth.users
--   where email in ('whitney@example.com', 'bella@example.com', 'piper@example.com', 'joely@example.com', 'sofia@example.com')
-- on conflict do nothing;
