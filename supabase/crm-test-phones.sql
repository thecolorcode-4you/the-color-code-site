-- The Color Code — give the five teammate test customers our real mobile numbers, with text consent,
-- so the Twilio trial can text us. Run in Supabase → SQL Editor AFTER crm-texts.sql.
-- Replace each <...> with that teammate's mobile in +1 format, e.g. '+15045550123'.
-- Do this in the SQL Editor only; never save real numbers in this file (it's in GitHub).
-- Each teammate is agreeing, in writing (this message to the team counts; note the date), to receive test texts.

update public.customers set phone = '<WHITNEY_MOBILE>', sms_consent = true, sms_consent_on = (now() at time zone 'America/Chicago')::date where name = 'Ava Robichaux'  and is_test;
update public.customers set phone = '<BELLA_MOBILE>',   sms_consent = true, sms_consent_on = (now() at time zone 'America/Chicago')::date where name = 'Lily Fontenot'  and is_test;
update public.customers set phone = '<PIPER_MOBILE>',   sms_consent = true, sms_consent_on = (now() at time zone 'America/Chicago')::date where name = 'Nora Patel'     and is_test;
update public.customers set phone = '<JOELY_MOBILE>',   sms_consent = true, sms_consent_on = (now() at time zone 'America/Chicago')::date where name = 'Ella Marchand'  and is_test;
update public.customers set phone = '<SOFIA_MOBILE>',   sms_consent = true, sms_consent_on = (now() at time zone 'America/Chicago')::date where name = 'Mia Delacroix'  and is_test;

-- Check: select name, phone, sms_consent, sms_consent_on from public.customers where sms_consent;
-- Left as a <...> placeholder, a row fails with "customers_phone_check" and nothing changes for it.
