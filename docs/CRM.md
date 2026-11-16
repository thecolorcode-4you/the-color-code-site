# CRM: our customer record

**Date:** 2026-11-14 · **By:** CRM agent

> This file belongs at `ceo/crm/CRM.md`. This repository holds only the website (`ceo/web/site/`), so it is saved here as `docs/CRM.md` (never published). Copy it across. I couldn't find our charter, `ceo/crm/CLAUDE.md`, because it isn't in this repository; I worked from the website, the Pricing page, `docs/personas.md` and `supabase/schema.sql`. If the charter says anything different, tell me and I'll change this to match.

## What I built

### 1. The customer record: a `customers` table in our Supabase database
We already have a Supabase database (the one that holds accounts, quiz results and usage events), so the record lives there, not in a CSV. **It doesn't exist until someone on the team pastes `supabase/crm.sql` into Supabase.** I can't log in to our database from here (see "What you need to set up").

| Column | What it holds |
|---|---|
| `name` | Their name, as they typed it |
| `email` | Their email, stored in lowercase; each address only once |
| `joined_on` | The date they joined (New Orleans date) |
| `source` | Where they came from, in one word: the link tag they arrived with (for example `instagram` from `?utm_source=instagram`), otherwise the site that sent them (`instagram`, `tiktok`, `google`, `groupme`…), otherwise `direct` |
| `last_active_on` | The date they were last active. Today this updates when they sign up, or sign up again with the same email |
| `segment` | `new`, `active` or `lapsed` (rule below), set automatically |
| `email_consent` | Whether they agreed to receive email from us (yes/no) |
| `email_consent_on` | The date they agreed. The database refuses a "yes" without a date, or a date without a "yes" |
| extra | `utm_source`, `utm_medium`, `utm_campaign`, `referrer`, `visitor_id` (links them to our usage events), `is_test` (marks invented people), `created_at` |

**Segment rule** (I picked these numbers; change them if the charter says otherwise):
- **new**: joined in the last 14 days
- **active**: joined earlier and active in the last 30 days
- **lapsed**: not active for more than 30 days

**Who can see it:** only the five of you (the `team_members` list from `schema.sql`). Visitors can add themselves through the form, but they can't read, change or delete anything, not even their own row, and the form never reveals whether an email was already on the list.

### 2. Sign-up form on the website
On the **home page** and the **Pricing page** (section "Get color tips from us by email"):
- Fields: name and email.
- Under them, a checkbox the visitor must tick: **"I agree to receive emails from The Color Code. I can unsubscribe at any time."** The form won't send without it, and the database also refuses a sign-up without it, so it can't be bypassed.
- Under that: "To unsubscribe, use the link in any of our emails or message us on Instagram at @thecolorcode.collective. We use your email only to send you these emails."
- On submit it calls `join_customer_list()` in the database, which saves today's date as the join, last-active and consent date. If the email is already there, it updates last-active to today and records the consent again; nothing else is overwritten.
- It also records an `email_signup` event in our usage tracker.

The FAQ has a new question, "How do I join or leave your email list?", included in the FAQ's structured data.

Tested: the database script in a local copy of Postgres (all the checks under "Tested" below), and the form in a phone-sized browser against a stand-in database (it won't submit without the tick, it sends the right fields, and source came out as `instagram` for a visitor who arrived with `?utm_source=Instagram`). **The form will show "Sorry, we couldn't save that" until `crm.sql` has been run in Supabase.**

### 3. Fifteen invented test customers
In `supabase/crm-test-customers.sql`. **None are real people.** Each row is marked `is_test = true` so it never counts toward our KPIs.

| Name | Email | Joined | Source | Last active | Segment on Nov 14 | Email OK? |
|---|---|---|---|---|---|---|
| Maddie Carter | maddie.carter@example.com | Sep 30 | instagram | Nov 10 | active | yes |
| Aaliyah Brooks | aaliyah.brooks@example.com | Oct 2 | tiktok | Oct 5 | lapsed | no |
| Priya Raman | priya.raman@example.com | Oct 8 | groupme | Oct 8 | lapsed | no |
| Chloe Nguyen | chloe.nguyen@example.com | Nov 9 | tiktok | Nov 13 | new | yes |
| Hannah Mills | hannah.mills@example.com | Oct 14 | panhellenic | Nov 6 | active | yes |
| Dana Whitfield | dana.whitfield@example.com | Oct 20 | panhellenic | Oct 21 | active | yes |
| Olivia Grant | olivia.grant@example.com | Oct 23 | chapter_color_night | Nov 12 | active | yes |
| Sophie Laurent | sophie.laurent@example.com | Nov 3 | google | Nov 3 | new | yes |
| Grace Kim | grace.kim@example.com | Sep 29 | direct | Sep 29 | lapsed | no |
| Emma Thibodeaux | emma.thibodeaux@example.com | Nov 12 | chapter_color_night | Nov 12 | new | yes |
| Ava Robichaux | **Whitney's email** | Nov 11 | instagram | Nov 11 | new | yes |
| Lily Fontenot | **Bella's email** | Oct 5 | tiktok | Nov 8 | active | yes |
| Nora Patel | **Piper's email** | Sep 30 | groupme | Oct 1 | lapsed | yes |
| Ella Marchand | **Joely's email** | Oct 18 | chapter_color_night | Oct 30 | active | yes |
| Mia Delacroix | **Sofia's email** | Oct 10 | google | Oct 12 | lapsed | yes |

The first six are our personas from `docs/personas.md`; the next four are more Tulane sorority members. Totals: **new 4, active 6, lapsed 5**; **12 agreed to email, 3 didn't**. The ten `@example.com` addresses use a domain reserved for testing, so mail sent there goes nowhere. Each teammate's address sits on a different kind of customer (new, active, lapsed), so each of you receives a different version of a segmented test email.

**I don't know your five email addresses,** so the file has placeholders (`<WHITNEY_EMAIL>` and so on). Replace them in the Supabase SQL Editor when you run it, not in the file, so your real addresses stay out of GitHub. If one is left in, Supabase stops with an error and adds nothing.

To delete all test customers later: `delete from public.customers where is_test;`

### Tested (local copy of Postgres)
- `crm.sql` runs cleanly, twice in a row.
- The test file fails safely with the placeholders still in it, and adds exactly 15 rows once they're replaced; running it again adds nothing.
- Segments came out new 4 / active 6 / lapsed 5, and every "yes" has a date.
- A visitor with no tick is refused; a visitor with a tick is saved with today's date and their source; the same email again doesn't create a second row.
- A visitor can't read the table, write to it directly, or run the segment refresh. A signed-in customer who isn't on the team sees 0 rows; a team member sees all of them.
- An activity date of today moves a lapsed customer to active.

## What you need to set up yourselves

> **Status 2026-11-16:** the Supabase project was paused and has been restored. `crm.sql` has been run and the 15 test customers have been added (check result: new 4, active 6, lapsed 5). The live sign-up form was then tested on a phone and saved correctly (new went from 4 to 5). Still to do: steps 4–7.

1. **Create the table (5 minutes, required).** Supabase → our project → **SQL Editor** → New query → paste all of `supabase/crm.sql` → **Run**. It should say "Success. No rows returned."
2. **Make sure all five of you are on the team list.** The record is only visible to accounts in `team_members`. If anyone hasn't been added yet, run the commented block at the bottom of `supabase/schema.sql` with your real emails.
3. **Add the test customers.** New query → paste `supabase/crm-test-customers.sql` → replace the five `<…_EMAIL>` placeholders with your real addresses → **Run**. Then check with `select segment, count(*) from public.customers where is_test group by segment;`. You should see new 4, active 6, lapsed 5.
4. **Keep segments up to date every day (optional, 1 minute).** Supabase → **Database → Extensions** → turn on `pg_cron`, then run:
   `select cron.schedule('refresh-customer-segments', '15 6 * * *', 'select public.refresh_customer_segments()');`
   Without this, a segment only updates when that customer's row changes, so someone who joined on Nov 1 would still say "new" in December.
5. **Pick an email tool before sending anything.** We promise an unsubscribe link in every email, and Supabase can't send marketing email. Tools with a free tier, such as Mailchimp or MailerLite, add the unsubscribe link and a postal-address footer for you. US law (CAN-SPAM) requires a physical mailing address in marketing emails; a P.O. box or a business address works, and the tool asks for it. Export people who agreed with:
   `select name, email, segment from public.customers where email_consent;`
   Add `and not is_test` once you're sending to real people.
6. **Unsubscribe requests (same day).** When someone unsubscribes in the email tool or messages us on Instagram, run:
   `update public.customers set email_consent = false, email_consent_on = null where lower(email) = lower('their@email.com');`
   and remove them in the email tool too.
7. **Decide what the emails will be.** The form promises "color ideas for your season and news about chapter color nights". Whatever we send has to match that.

## Known limits (worth deciding later)
- **Last active** only moves when someone signs up again. Our usage tracker already records visits (`events`, linked by `visitor_id`), so a later step could update `last_active_on` from real visits. Tell me if you want it.
- **No double opt-in.** Anyone can type someone else's email into the form. Most email tools can send a "confirm your subscription" email first; I recommend turning that on.
- **Accounts and the email list are separate.** Someone with a quiz account isn't on the email list unless they also use the form, which is correct because creating an account isn't consent to marketing email.

## Files
New: `supabase/crm.sql`, `supabase/crm-test-customers.sql`, `email-signup.js`, `docs/CRM.md`.
Changed: `index.html` and `pricing.html` (form), `faq-and-policies.html` (email-list question), `track.js` (remembers the first site that sent a visitor), `styles.css`, `sw.js`, the stylesheet version on every page.
