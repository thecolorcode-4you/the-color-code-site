-- The Color Code — text messages (SMS) as a second CRM channel. Paste all of this into
-- Supabase → SQL Editor → Run. Safe to run more than once. Run crm.sql and crm-daily.sql first.
-- Explained in docs/DAILY-TASK.md and docs/CRM.md.

-- Phone number and a SEPARATE written consent to texts, with its date.
alter table public.customers add column if not exists phone text;
alter table public.customers add column if not exists sms_consent boolean not null default false;
alter table public.customers add column if not exists sms_consent_on date;
alter table public.customers add column if not exists last_texted_on date;
alter table public.customers add column if not exists last_text_message text;

alter table public.customers drop constraint if exists customers_phone_check;
alter table public.customers add constraint customers_phone_check check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$');
alter table public.customers drop constraint if exists sms_consent_has_date;
alter table public.customers add constraint sms_consent_has_date
  check (sms_consent = (sms_consent_on is not null) and (not sms_consent or phone is not null));
alter table public.customers drop constraint if exists customers_last_text_message_check;
alter table public.customers add constraint customers_last_text_message_check
  check (last_text_message in ('welcome', 'monthly', 'lapsed'));

-- The sign-up form, now with an optional phone number and text consent. (Replaces the
-- earlier version from crm.sql; the email part works exactly as before.)
drop function if exists public.join_customer_list(text, text, boolean, text, text, text, text, text, text);
create or replace function public.join_customer_list(
  p_name text, p_email text, p_consent boolean,
  p_source text default 'direct', p_utm_source text default null, p_utm_medium text default null,
  p_utm_campaign text default null, p_referrer text default null, p_visitor_id text default null,
  p_phone text default null, p_sms_consent boolean default false
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  today date := (now() at time zone 'America/Chicago')::date;
  ph text := nullif(btrim(p_phone), '');
  sms boolean := coalesce(p_sms_consent, false) and nullif(btrim(p_phone), '') is not null;
begin
  if p_consent is not true then
    raise exception 'consent_required';
  end if;
  if coalesce(p_sms_consent, false) and ph is null then
    raise exception 'phone_required_for_texts';
  end if;
  insert into public.customers as c
    (name, email, joined_on, source, last_active_on, email_consent, email_consent_on,
     utm_source, utm_medium, utm_campaign, referrer, visitor_id, phone, sms_consent, sms_consent_on)
  values
    (btrim(p_name), lower(btrim(p_email)), today, coalesce(nullif(btrim(left(p_source, 60)), ''), 'direct'), today, true, today,
     left(p_utm_source, 100), left(p_utm_medium, 100), left(p_utm_campaign, 100), left(p_referrer, 200), left(p_visitor_id, 64),
     case when sms then ph end, sms, case when sms then today end)
  on conflict ((lower(email))) do update
    set last_active_on = today,
        email_consent_on = case when c.email_consent then c.email_consent_on else today end,
        email_consent = true,
        -- Only a new, ticked text consent changes the phone/text fields; an unticked box never removes an earlier one.
        phone = case when sms then ph else c.phone end,
        sms_consent_on = case when sms and not c.sms_consent then today when sms then c.sms_consent_on else c.sms_consent_on end,
        sms_consent = c.sms_consent or sms;
end $$;
revoke all on function public.join_customer_list(text, text, boolean, text, text, text, text, text, text, text, boolean) from public;
grant execute on function public.join_customer_list(text, text, boolean, text, text, text, text, text, text, text, boolean) to anon, authenticated;

-- Who gets which TEXT today: same three moments and rules as email, but only people who
-- ticked the text box, and counted against when we last TEXTED them.
create or replace function public.crm_todays_text_batch(include_test boolean default false)
returns table (message text, name text, phone text, segment text, joined_on date, last_active_on date,
               last_texted_on date, last_text_message text, is_test boolean)
language sql stable set search_path = public
as $$
  with t as (select (now() at time zone 'America/Chicago')::date as today),
  c as (
    select cu.*, public.customer_segment(cu.joined_on, cu.last_active_on) as seg_now
    from public.customers cu
    where cu.sms_consent and cu.phone is not null and (include_test or not cu.is_test)
  ),
  m as (
    select c.*,
      case
        when c.joined_on = t.today - 1 and c.last_text_message is null then 'welcome'
        when c.seg_now = 'active' and (c.last_texted_on is null or c.last_texted_on <= t.today - 30) then 'monthly'
        when c.seg_now = 'lapsed' and not coalesce(c.last_text_message = 'lapsed' and c.last_texted_on >= c.last_active_on, false) then 'lapsed'
      end as msg
    from c, t
  )
  select msg, name, phone, seg_now, joined_on, last_active_on, last_texted_on, last_text_message, is_test
  from m where msg is not null order by 1, 2
$$;

-- After a text has actually been sent.
create or replace function public.crm_record_text_sent(p_phone text, p_message text)
returns void language plpgsql set search_path = public
as $$
declare n integer;
begin
  if p_message not in ('welcome', 'monthly', 'lapsed') then
    raise exception 'message must be welcome, monthly or lapsed, not %', p_message;
  end if;
  update public.customers
     set last_texted_on = (now() at time zone 'America/Chicago')::date, last_text_message = p_message
   where phone = btrim(p_phone) and sms_consent;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'no customer who agreed to texts has the number %', p_phone; end if;
end $$;

-- When someone replies STOP (Twilio blocks further texts to them automatically), record it the same day:
-- update public.customers set sms_consent = false, sms_consent_on = null where phone = '+15045550123';

revoke all on function public.crm_todays_text_batch(boolean) from public, anon, authenticated;
revoke all on function public.crm_record_text_sent(text, text) from public, anon, authenticated;
