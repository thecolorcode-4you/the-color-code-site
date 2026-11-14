-- The Color Code — customer record (CRM). Paste all of this into Supabase → SQL Editor → Run.
-- Safe to run more than once. Run supabase/schema.sql first (this uses its is_team() function).
-- Full explanation: docs/CRM.md.

-- One row per person who has given us their name and email.
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 100),
  email text not null check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  joined_on date not null default (now() at time zone 'America/Chicago')::date,
  source text not null default 'direct' check (length(source) <= 60),
  last_active_on date not null default (now() at time zone 'America/Chicago')::date,
  segment text not null default 'new' check (segment in ('new', 'active', 'lapsed')),
  email_consent boolean not null default false,
  email_consent_on date,
  -- Extra detail behind "source", kept as it arrived.
  utm_source text check (length(utm_source) <= 100),
  utm_medium text check (length(utm_medium) <= 100),
  utm_campaign text check (length(utm_campaign) <= 100),
  referrer text check (length(referrer) <= 200),
  visitor_id text check (length(visitor_id) <= 64),
  -- Invented test customers are marked so they never count in our KPIs.
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  -- A "yes" always has a date; a "no" never does.
  constraint consent_has_date check (email_consent = (email_consent_on is not null))
);

-- One row per email address, whatever its capital letters.
create unique index if not exists customers_email_key on public.customers (lower(email));
create index if not exists customers_segment_idx on public.customers (segment);

-- The segment rule, in one place (dates are New Orleans time):
--   new    = joined in the last 14 days
--   active = joined earlier, and active in the last 30 days
--   lapsed = not active for more than 30 days
create or replace function public.customer_segment(joined date, last_active date) returns text
language sql stable set search_path = public
as $$
  select case
    when joined > (now() at time zone 'America/Chicago')::date - 14 then 'new'
    when last_active > (now() at time zone 'America/Chicago')::date - 30 then 'active'
    else 'lapsed'
  end
$$;

create or replace function public.set_customer_segment() returns trigger
language plpgsql set search_path = public
as $$
begin
  new.segment := public.customer_segment(new.joined_on, new.last_active_on);
  return new;
end $$;

drop trigger if exists customers_segment on public.customers;
create trigger customers_segment before insert or update on public.customers
for each row execute function public.set_customer_segment();

-- Segments change with the calendar (someone is "new" for 14 days only), so refresh them
-- every day. Returns how many rows changed. See docs/CRM.md for the one-line daily schedule.
create or replace function public.refresh_customer_segments() returns integer
language sql security definer set search_path = public
as $$
  with changed as (
    update public.customers
       set segment = public.customer_segment(joined_on, last_active_on)
     where segment is distinct from public.customer_segment(joined_on, last_active_on)
    returning 1
  )
  select count(*)::integer from changed
$$;

-- The website's sign-up form calls this. It adds the person, or, if the email is already
-- on file, marks them active today and records their "yes" again. It refuses without a ticked
-- consent box, and it never tells the browser whether the email was already on file.
create or replace function public.join_customer_list(
  p_name text, p_email text, p_consent boolean,
  p_source text default 'direct', p_utm_source text default null, p_utm_medium text default null,
  p_utm_campaign text default null, p_referrer text default null, p_visitor_id text default null
) returns void
language plpgsql security definer set search_path = public
as $$
declare today date := (now() at time zone 'America/Chicago')::date;
begin
  if p_consent is not true then
    raise exception 'consent_required';
  end if;
  insert into public.customers as c
    (name, email, joined_on, source, last_active_on, email_consent, email_consent_on,
     utm_source, utm_medium, utm_campaign, referrer, visitor_id)
  values
    (btrim(p_name), lower(btrim(p_email)), today, coalesce(nullif(btrim(left(p_source, 60)), ''), 'direct'), today, true, today,
     left(p_utm_source, 100), left(p_utm_medium, 100), left(p_utm_campaign, 100), left(p_referrer, 200), left(p_visitor_id, 64))
  on conflict ((lower(email))) do update
    set last_active_on = today,
        email_consent_on = case when c.email_consent then c.email_consent_on else today end,
        email_consent = true;
end $$;

alter table public.customers enable row level security;

-- Only the team (team_members, from schema.sql) can see or change the record.
-- Visitors can only add themselves through join_customer_list() above.
drop policy if exists "team reads customers" on public.customers;
create policy "team reads customers" on public.customers
  for select to authenticated using (public.is_team());

drop policy if exists "team updates customers" on public.customers;
create policy "team updates customers" on public.customers
  for update to authenticated using (public.is_team()) with check (public.is_team());

drop policy if exists "team deletes customers" on public.customers;
create policy "team deletes customers" on public.customers
  for delete to authenticated using (public.is_team());

revoke all on public.customers from anon;
grant select, update, delete on public.customers to authenticated;
revoke all on function public.join_customer_list(text, text, boolean, text, text, text, text, text, text) from public;
grant execute on function public.join_customer_list(text, text, boolean, text, text, text, text, text, text) to anon, authenticated;
revoke all on function public.refresh_customer_segments() from public, anon, authenticated;

-- To unsubscribe someone (do it the same day they ask):
-- update public.customers set email_consent = false, email_consent_on = null where lower(email) = lower('them@example.com');
