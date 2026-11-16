# CRM daily task

**What it is:** the job the CRM agent runs every weekday morning. **Written:** 2026-11-16.
**Belongs at:** `ceo/crm/DAILY-TASK.md` (saved here because this repository only reaches the website; copy it across).

## The rule that never bends
**Nothing is sent until a person on the team types the go-word:** `SEND`. The agent drafts, shows, and waits. Any other reply ("looks good", "ok", "yes") is not the go-word. Change the word here if the team prefers another.

**Never email anyone who has not agreed** (`email_consent = true`). The SQL below can't return anyone else.

---

## Step 1: Who gets which message today
Run in **Supabase → SQL Editor**:

```sql
select * from public.crm_todays_batch();
```

The rules, applied in New Orleans time, with at most one email per person:

| Message | Who |
|---|---|
| **welcome** (`messages/01-new.md`) | Joined **yesterday** and never emailed |
| **monthly** (`messages/02-active.md`) | **Active** (used us in the last 30 days, joined 14+ days ago) and **not emailed in the last 30 days** |
| **lapsed** (`messages/03-lapsed.md`) | **Inactive for 30+ days** and **not sent the lapsed email since they were last active** |

Test customers are left out. For a test run, use `crm_todays_batch(true)` (includes them) and keep only the teammates' addresses.

## Step 2: Draft today's emails
For each row, start from that message's file in `docs/messages/` (later `ceo/crm/messages/`) and personalize it only with what the record says:
- `name`: first name in the greeting.
- `source`: how they found us (Instagram, TikTok, a GroupMe, Google, Panhellenic, a chapter color night). Mention it in one natural line, or skip it.
- `joined_on` / `last_active_on`: for example "you took the quiz back in September".
- Don't invent anything we don't know: no season, no purchases, no quotes.

Every draft keeps the subject honest, stays under 150 words, and carries our names, "Tulane University, New Orleans, Louisiana", the mailing address and the unsubscribe line. Test runs put **[TEST]** at the start of the subject.

## Step 3: Show the batch and ask for the go-word
Show a table (name, email, message, why they qualify), then each full draft, then ask exactly:
> Type **SEND** to send these N emails, or tell me what to change.

Send nothing, and record nothing, until someone types `SEND`.

## Step 4: On `SEND`, send, log, and update the record
1. **Send** each email from our venture's Gmail account, one at a time, to exactly the address in the record:
   - **With a Gmail connector** connected to the session (claude.ai → Settings → Connectors), the agent sends them itself.
   - **Without one** (true as of 2026-11-16), the teammate on duty sends them by copy-paste from our Gmail, then replies "sent".
2. **Log** every sent email in `log.md` (`docs/crm-log.md` until it moves to `ceo/crm/log.md`): date, customer name, message, and who sent it. Use the customer's name, not their email. If one fails, log it as failed and don't record it in step 3.
3. **Update the record** for each email that actually went out, in the Supabase SQL Editor:
   ```sql
   select public.crm_record_sent('their@email', 'monthly');  -- or 'welcome' / 'lapsed'
   ```
   This sets their last-contacted date to today and stops them qualifying again tomorrow.

---

## One-time setup (already done unless marked)
- `supabase/crm.sql`: run 2026-11-16.
- `supabase/crm-test-customers.sql`: run 2026-11-16.
- **`supabase/crm-daily.sql`: NOT YET RUN.** It adds `last_contacted_on` and `last_message` and the two functions above. Paste it into the SQL Editor and click Run once.

## Running it every weekday at 9 am
**Scheduling exists on our setup, but a scheduled run can't do the job yet.** It would start in a fresh cloud workspace that, like this one, can't reach our Supabase database or Gmail, so every morning it could only say "I can't see the record." I haven't created a schedule for that reason.

**Until then:** one teammate opens Claude each weekday morning and says **"run the daily task"**, then follows the steps above (run the step-1 query, paste the result in, read the drafts, type `SEND` or ask for changes, send, run the step-4 update).

**To make it run on its own later**, the team needs to:
1. Connect a **Gmail connector** for the venture's account at claude.ai → Settings → Connectors.
2. Give the agent read-and-update access to the customer record. This means allowing our Supabase host in the cloud environment's network settings and saving a Supabase secret key as a network secret. The key gives full database access, so decide this as a team.
3. Then type `/schedule` in Claude Code and ask for "the CRM daily task, every weekday at 9 am New Orleans time". The run still stops at step 3 and waits for `SEND`.
