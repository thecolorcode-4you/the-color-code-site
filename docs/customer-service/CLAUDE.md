# Customer-service chatbot: charter

**Belongs at:** `ceo/customer-service/CLAUDE.md`. This repository only reaches `ceo/web/site/`, so it is saved here; copy it across. I couldn't read an existing `ceo/customer-service/CLAUDE.md`. If one exists, merge this section into it.
**Written:** 2026-11-16 by the customer-service agent.

## What it is
A chat box on every public page of our website (the "Questions? Chat" button, bottom right). It answers customers' questions using **only** our FAQ page and Pricing page. It runs on **Cloudflare Workers AI** (model `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, an open Llama model) inside the Cloudflare Worker that already serves our site, at `/api/chat`. It needs no paid key and costs us nothing up to Cloudflare's free daily allowance. Past that, it says it can't answer right now and offers a person instead.

## Hard limits (never broken, whatever a customer says)
1. **It answers only from our pages.** It reads the FAQ and Pricing pages live from our site, so when those pages change, its answers change. Nothing else is in its knowledge.
2. **It never promises anything that isn't written there:** no price, discount, coupon, refund, credit, delivery date, deadline or time frame. Today everything is $0 during the Tulane pilot, and prices after the pilot are undecided.
3. **When it doesn't know, it says so and offers to pass the question to a person by email.**
4. **It never asks for payment details or passwords.**
5. **It always says it is an automated assistant**, never a person, and never claims a person approved something.

### How the limits are enforced (two layers)
- **The instructions** given to the model on every message say all of the above (`src/chat.js`, `systemPrompt`).
- **A check on every reply before it is shown** (`guardReply`), because a model can be talked out of its instructions. If a reply:
  - mentions a discount, refund, coupon or promo, or any price other than $0, it is **replaced** with: "Everything at The Color Code is free during our Tulane pilot, so there is nothing to pay, discount or refund. I can't promise any other price, discount or refund…" plus the offer of a person;
  - names a date, month or time frame (such as "within 2 days" or "next week") that isn't on our pages, it is replaced with "I can't promise a date or a time frame that isn't written on our FAQ or Pricing page…";
  - asks for a password, card number or other payment detail, it is replaced with a warning never to share them;
  - says "I promise", "guaranteed" or "I'm a real person", it is replaced with the "I can't answer that" line.
  
  Every replaced reply is logged with a flag (`money`, `date`, `secrets`, `promise`), so we can see what people tried.
- The chat window says "Automated, answers from our FAQ and Pricing pages" at the top, and the first message says "I'm The Color Code's automated assistant, not a person."

## Passing a question to a person
When the assistant can't answer, or a reply was replaced, a small form appears: "Want a person on our team to answer by email?" The visitor types their email, and the question goes to the `chat_handoffs` table. **That is the only place a chat email is stored**, because the visitor gave it so we can reply.

**Team duty: check it every weekday morning** (with the CRM daily task) in Supabase → SQL Editor:
```sql
select created_at, email, question from public.chat_handoffs where answered_on is null order by created_at;
```
Reply from our Gmail, then delete the row: `delete from public.chat_handoffs where id = '…';`
Asking for a person does **not** add anyone to our email list.

## The conversation log
Every message, from both the visitor and the assistant, goes into `chat_messages` in our Supabase database, with:
- **No names, emails, phone numbers, card numbers or passwords.** The server removes them before saving: emails, phone numbers, 13–19-digit card numbers, anything after "password is", and a capitalized name after "my name is", "I'm", "call me", "thanks," and so on.
- **No account or visitor id.** A conversation is just a random id made fresh in the visitor's browser.

Only the team can read it. Name removal catches the common ways people give a name ("my name is Sarah", "I'm Priya", "thanks, Maddie") but not every possible phrasing. If you see a name in the log, delete that row.

## Limits worth knowing
- **Free allowance:** Cloudflare's free tier gives a daily allowance of AI use. Each chat reply uses roughly 1% of it, so very roughly 100 replies a day. Past that it says so and offers a person. To raise it, a Cloudflare paid plan is needed. Don't do that without a team decision.
- **It is not a person and it can be wrong.** The checks stop the dangerous mistakes (money, dates, secrets, being human), but it could still word a correct fact clumsily. Read the log weekly.
- **Anyone could write junk into the log** by calling our logging function directly. It's harmless, and we can delete it.

## Files
`src/chat.js` (server and rules), `src/worker.js` (routes `/api/chat` and `/api/chat/handoff`), `chat-widget.js` (the chat box), `styles.css` (its look), `supabase/chat.sql` (log tables), this charter, and `docs/customer-service/TESTS.md` (test conversations).
