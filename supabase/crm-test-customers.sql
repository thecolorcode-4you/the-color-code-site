-- The Color Code — 15 INVENTED test customers for the CRM. None of these people are real.
-- Run supabase/crm.sql first.
--
-- BEFORE YOU RUN: replace the five <...> placeholders below with our teammates' real email
-- addresses, so test emails reach us. Do this in the Supabase SQL Editor only, not in this
-- file, so our real addresses never end up in GitHub. If a placeholder is left in, Supabase
-- stops with a "customers_email_check" error and adds nothing.
--
-- Every row is marked is_test = true, so it never counts toward our KPIs.
-- Ten use @example.com, a domain reserved for testing: email sent there goes nowhere.
-- To remove them all later:  delete from public.customers where is_test;
--
-- Segments as of 2026-11-14: new 4, active 6, lapsed 5. Consent: 12 yes, 3 no.

insert into public.customers
  (name, email, joined_on, source, last_active_on, email_consent, email_consent_on, is_test)
values
  -- Our six personas (docs/personas.md), as customers
  ('Maddie Carter',    'maddie.carter@example.com',    '2026-09-30', 'instagram',           '2026-11-10', true,  '2026-09-30', true), -- formal-dress shopper: active
  ('Aaliyah Brooks',   'aaliyah.brooks@example.com',   '2026-10-02', 'tiktok',              '2026-10-05', false, null,         true), -- skeptical, makeup-first: lapsed, no email consent
  ('Priya Raman',      'priya.raman@example.com',      '2026-10-08', 'groupme',             '2026-10-08', false, null,         true), -- busy, private: lapsed, no email consent
  ('Chloe Nguyen',     'chloe.nguyen@example.com',     '2026-11-09', 'tiktok',              '2026-11-13', true,  '2026-11-09', true), -- new member from TikTok: new
  ('Hannah Mills',     'hannah.mills@example.com',     '2026-10-14', 'panhellenic',         '2026-11-06', true,  '2026-10-14', true), -- sisterhood chair: active
  ('Dana Whitfield',   'dana.whitfield@example.com',   '2026-10-20', 'panhellenic',         '2026-10-21', true,  '2026-10-20', true), -- Panhellenic VP: active
  -- Four more Tulane sorority members
  ('Olivia Grant',     'olivia.grant@example.com',     '2026-10-23', 'chapter_color_night', '2026-11-12', true,  '2026-10-23', true), -- active
  ('Sophie Laurent',   'sophie.laurent@example.com',   '2026-11-03', 'google',              '2026-11-03', true,  '2026-11-03', true), -- new
  ('Grace Kim',        'grace.kim@example.com',        '2026-09-29', 'direct',              '2026-09-29', false, null,         true), -- lapsed, no email consent
  ('Emma Thibodeaux',  'emma.thibodeaux@example.com',  '2026-11-12', 'chapter_color_night', '2026-11-12', true,  '2026-11-12', true), -- new
  -- Five invented customers with our teammates' real emails (one per segment mix), all consented
  ('Ava Robichaux',    '<WHITNEY_EMAIL>',              '2026-11-11', 'instagram',           '2026-11-11', true,  '2026-11-11', true), -- new
  ('Lily Fontenot',    '<BELLA_EMAIL>',                '2026-10-05', 'tiktok',              '2026-11-08', true,  '2026-10-05', true), -- active
  ('Nora Patel',       '<PIPER_EMAIL>',                '2026-09-30', 'groupme',             '2026-10-01', true,  '2026-09-30', true), -- lapsed
  ('Ella Marchand',    '<JOELY_EMAIL>',                '2026-10-18', 'chapter_color_night', '2026-10-30', true,  '2026-10-18', true), -- active
  ('Mia Delacroix',    '<SOFIA_EMAIL>',                '2026-10-10', 'google',              '2026-10-12', true,  '2026-10-10', true)  -- lapsed
on conflict ((lower(email))) do nothing;

-- Check:  select segment, count(*) from public.customers where is_test group by segment;
