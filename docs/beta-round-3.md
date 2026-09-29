# Beta round 3 — Hannah (chapter sisterhood chair, would book a color night)

**Tester:** our app development agent, playing Hannah from `docs/personas.md`: a junior and the sisterhood chair of a 120-member chapter. She plans two sisterhood events a semester, has about $200–$300 per event from the chapter budget, and plans three weeks ahead. She is the "other side" of the business: the person who would book the first paid product.
**Date:** September 29, 2026 (after the round 1 and 2 fixes went live)
**How:** the exact code live on `main` (commit `243fa45`), opened in a phone-sized browser posing as an iPhone (390×844, Safari), starting from the home page as if from a Panhellenic GroupMe link. The agent read every page and searched each one for anything about chapters, groups, sisterhood, Panhellenic, booking, contact, price or cost. Her whole path could be tested; nothing here depends on the AI.
**Her question:** "Can I run this as a chapter event, what does it cost, and who do I talk to?"
**Result:** she found the chapter color night idea only by luck, 4 screens down on the 6.5-screen Results & Benefits page. There was no way to contact anyone and no price, and there were internal team notes on the same page. She would not have booked, and wouldn't have shown it to her exec board.

## Screen by screen, in Hannah's words

**1. Home page**
- *Expected:* something like "bring The Color Code to your chapter," since the link came from Panhellenic.
- *Saw:* everything is about one person getting her own season. **The words chapter, group, sisterhood and Panhellenic don't appear anywhere on the home page.** "Is this even for chapters, or is it just a personal quiz?"

**2. How It Works**
- Same: individual only. Nothing about groups.

**3. Results & Benefits (found by scrolling, not by being led there)**
- Example results, then, **4 screens down**: **"Coming later — for chapters: Chapter color night."** "This is exactly what I want!" Every member takes it on her own phone, and the chapter sees who shares a season for formal and bid day photos.
- The example season spread (24 invented members, 9 seasons, names grouped) is the most convincing thing on the site for me. I'd show that to my exec board.
- **"Not bookable yet during the pilot; ask Joely or Sofia through Panhellenic."** How? There's no email, no form, no link. I don't know Joely or Sofia. *(Their names are on About Us, but with no way to reach them.)*
- Right below it: **"Coming soon — pending ceo/Whitney sign-off before this goes live (Decision 5)"** and a **"REMINDER: None of this is scoped, priced, or approved yet… confirm with ceo/Whitney before it ever appears on a live site."** "Wait, this page wasn't supposed to be public? Can I trust anything on it?" *(An internal note in the page's code says this section must not go live without Whitney's sign-off, and it is live.)*

**4. FAQ**
- *Expected:* "Can my chapter do this?" and "How much for a chapter?"
- *Saw:* neither question. "Is this free?" says the pilot is free, followed by a yellow **TODO box: "Pricing for any phase after this pilot hasn't been decided — that's a business-model call for ceo/Whitney, not web-development."** "So I can't tell my treasurer anything."

**5. About Us**
- Joely and Sofia "work for Panhellenic." Good, that's the connection. Still no way to contact them.

**6. Could she run it tonight anyway?**
- Partly. Every member could open the link and take the quiz on her own phone right now, and the selfie is optional, which matters because she's responsible for 120 people's photos. But nothing collects the chapter's results, so the "who shares a season" spread, the part she'd pay for, can't happen. She'd have to ask everyone to screenshot and post in the GroupMe. And there are no instructions for running it as an event.

## Where Hannah got confused or stuck
1. **No front door for chapters.** Nothing on the home page, How It Works or FAQ mentions chapters. The idea is only 4 screens down on Results & Benefits.
2. **No way to contact anyone.** "Ask Joely or Sofia through Panhellenic" has no link, email or form.
3. **No price or "free for chapters during the pilot."** The FAQ pricing answer is a TODO box addressed to the team.
4. **Internal notes on the live site:** the roadmap's "pending ceo/Whitney sign-off (Decision 5)" label and "Reminder… confirm before it appears on a live site" box, plus the TODO boxes on Results & Benefits and FAQ. She'd screenshot this page for her exec board, and these make the business look unready.
5. **No guidance for running a color night with what exists today.**

Also noticed: if 120 members all take a selfie in the same hour, that's the biggest load the free Cloudflare AI allowance has seen. It's untested. Worth one small trial (for example, the five of you plus a few friends in one sitting) before a real chapter night.

## The three changes that would have helped Hannah most
1. **Give chapters a front door.** A short "For chapters" section on the home page and a FAQ answer ("Can my chapter do a color night?"), both linking to the chapter color night section, with the price in plain words: *free during the pilot, first chapter night free in exchange for a post*, if the team agrees.
2. **Give her a way to ask.** A clear contact on the chapter section and FAQ: an Instagram DM link to @thecolorcode.collective, a team email, or a short "My chapter is interested" form the team sees on the team screen once Supabase is on. The team needs to pick which.
3. **Take the internal notes off the live site.** Remove or rewrite the roadmap's "pending ceo/Whitney sign-off (Decision 5)" label and reminder box, and the TODO boxes on Results & Benefits and FAQ. Whitney needs to decide whether the "What's next" roadmap stays public at all, since the team's own note says it needed her sign-off first.

## Decisions only the team can make before fixing
- **Price for chapters during the pilot:** free? First one free for a post, then $150–$250 (the professor's suggestion)?
- **How chapters contact you:** Instagram DM, email (which address?), or a form?
- **The "What's next" roadmap (outfit, nails, hair advice…):** keep it public labeled "ideas we're exploring," or remove it? The professor's advice was to keep nails, hair and outfits on the "coming later" list and focus on seasons and makeup.

*Not fixed yet. These go into the next round of changes.*
