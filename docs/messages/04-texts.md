# Text messages (SMS): drafts, not sent

Same three moments as the emails. Each one is under 160 characters, uses only plain characters (no curly quotes or emoji, which would cut the limit to 70), says who we are, and ends with "Reply STOP to stop".
**Only for people whose record shows `sms_consent = true`.** That is a separate tick box on the sign-up form, with its own date; consent to email is not consent to texts.

| Moment | Text | Characters |
|---|---|---|
| **Welcome** (the day after they join) | `Welcome to The Color Code (Tulane, New Orleans)! Find your season free: the-color-code-site.thecolorcode-mktg4250.workers.dev/quiz Reply STOP to stop` | 149 |
| **Monthly** (active, not texted in 30 days) | `Hi {first_name}, The Color Code (Tulane, New Orleans) tip: hold new clothes under your chin by a window and check your palette. Reply STOP to stop` | 134 + name (keep names up to 25 characters; cut longer ones to the first name) |
| **Lapsed** (inactive 30+ days, not sent the lapsed text since) | `The Color Code (Tulane, New Orleans): result felt off? Retake free by a window: the-color-code-site.thecolorcode-mktg4250.workers.dev/quiz Reply STOP to stop` | 157 |

`/quiz` is a new short link on our site. It opens Start Your Analysis and tags the visit as coming from a text (`utm_source=sms`), so anyone who signs up from a text is recorded as source `sms`. Our site address alone is 53 characters, which is why the welcome and lapsed texts carry no name: with a name they would go over 160. A shorter custom domain later would leave room for one.

**Twilio trial note:** a trial account puts "Sent from your Twilio trial account - " in front of every text, which pushes each one into two parts. That's fine for testing on our own phones. Real customers would never see it, because that needs a paid, registered number (see `docs/DAILY-TASK.md`).
