-- The Color Code — CRM daily task. Paste all of this into Supabase → SQL Editor → Run.
-- Safe to run more than once. Run supabase/crm.sql first. Explained in docs/DAILY-TASK.md.

-- When we last emailed each customer, and which message it was.
alter table public.customers add column if not exists last_contacted_on date;
alter table public.customers add column if not exists last_message text;
alter table public.customers drop constraint if exists customers_last_message_check;
alter table public.customers add constraint customers_last_message_check
  check (last_message in ('welcome', 'monthly', 'lapsed'));

-- Who gets which email today (New Orleans date). One message per person, at most.
--   welcome: joined yesterday and never emailed
--   monthly: active (used us in the last 30 days, joined 14+ days ago) and not emailed in the last 30 days
--   lapsed : inactive for 30+ days and not sent the lapsed email since their last activity
-- Only people who agreed to receive email. Test customers are left out unless include_test is true.
create or replace function public.crm_todays_batch(include_test boolean default false)
returns table (message text, name text, email text, segment text, source text,
               joined_on date, last_active_on date, last_contacted_on date, last_message text, is_test boolean)
language sql stable set search_path = public
as $$
  with t as (select (now() at time zone 'America/Chicago')::date as today),
  c as (
    select cu.*, public.customer_segment(cu.joined_on, cu.last_active_on) as seg_now
    from public.customers cu
    where cu.email_consent and (include_test or not cu.is_test)
  )
  select
    case
      when c.joined_on = t.today - 1 and c.last_message is null then 'welcome'
      when c.seg_now = 'active' and (c.last_contacted_on is null or c.last_contacted_on <= t.today - 30) then 'monthly'
      when c.seg_now = 'lapsed' and not coalesce(c.last_message = 'lapsed' and c.last_contacted_on >= c.last_active_on, false) then 'lapsed'
    end as message,
    c.name, c.email, c.seg_now, c.source, c.joined_on, c.last_active_on, c.last_contacted_on, c.last_message, c.is_test
  from c, t
  where (c.joined_on = t.today - 1 and c.last_message is null)
     or (c.seg_now = 'active' and (c.last_contacted_on is null or c.last_contacted_on <= t.today - 30))
     or (c.seg_now = 'lapsed' and not coalesce(c.last_message = 'lapsed' and c.last_contacted_on >= c.last_active_on, false))
  order by 1, 2
$$;

-- After an email has actually been sent: record it (sets last-contacted to today).
create or replace function public.crm_record_sent(p_email text, p_message text)
returns void
language plpgsql set search_path = public
as $$
declare n integer;
begin
  if p_message not in ('welcome', 'monthly', 'lapsed') then
    raise exception 'message must be welcome, monthly or lapsed, not %', p_message;
  end if;
  update public.customers
     set last_contacted_on = (now() at time zone 'America/Chicago')::date,
         last_message = p_message
   where lower(email) = lower(btrim(p_email)) and email_consent;
  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'no customer who agreed to email has the address %', p_email;
  end if;
end $$;

-- These are for the team in the SQL Editor only, never for the website.
revoke all on function public.crm_todays_batch(boolean) from public, anon, authenticated;
revoke all on function public.crm_record_sent(text, text) from public, anon, authenticated;
