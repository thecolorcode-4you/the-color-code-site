# Lifecycle email drafts (CRM)

**Drafted 2026-11-16 by the CRM agent. Not sent. Nothing has been sent to anyone.**
These belong in `ceo/crm/messages/`; this repository only reaches `ceo/web/site/`, so they are saved here (`docs/` is never published). Copy them across.

| File | Who gets it | When |
|---|---|---|
| `01-new.md` | segment = new, email_consent = yes | The day they join |
| `02-active.md` | segment = active, email_consent = yes | Once a month |
| `03-lapsed.md` | segment = lapsed, email_consent = yes | Once, after 30 days without activity |

Only send to people with `email_consent = true`. `{first_name}` is filled in by the email tool from the `name` column. `[MAILING ADDRESS]` must be replaced with a real postal address before anything is sent (US CAN-SPAM requires it; the email tool will ask for it). Read them as a team and edit until they sound like you; keep each under 150 words.
