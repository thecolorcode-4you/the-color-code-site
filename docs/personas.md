# The Color Code — six simulated people (Practicum 5)

Invented by our app development agent to test the app and fill it with labeled examples. **None of these are real people.** Four are customers; two are the other people our business needs: the chapter officer who books a color night, and the Panhellenic partner who brings the audience.

In the app, the four customers appear as example results (Results & Benefits) and example reviews (Customer Reviews), each labeled "Example — simulated tester, not a real customer." Their seasons are not typed in by hand: their quiz answers go through the app's real season rules.

| | Person | Role | Season in the app |
|---|---|---|---|
| 1 | Maddie | Customer — formal dress shopper | Light Summer |
| 2 | Aaliyah | Customer — deep skin tone, makeup-first, skeptical | Deep Autumn |
| 3 | Priya | Customer — busy, private, no photo | Deep Winter |
| 4 | Chloe | Customer — new member, found us on TikTok | Light Spring |
| 5 | Hannah | Chapter sisterhood chair — books a color night | — |
| 6 | Dana | Panhellenic VP of Programming — the partner | — |

---

## 1. Maddie — the formal-dress shopper
- **Who:** Sophomore, in a Panhellenic chapter, from Atlanta. Buys most clothes online and returns half of them.
- **What she wants:** To know which dress colors to look for before formal in three weeks, so she stops buying and returning.
- **Time:** A few minutes between classes, on her phone. Will do the quiz once, then come back to her palette when shopping.
- **Money:** About $150 a month of spending money; spends $80–$150 on a formal dress. Would pay $15–$20 for a full report if the free season convinced her.
- **Answers:** blue/purple veins, silver, burns, ash blonde, light blue/gray eyes, either white.
- **What would make her give up:** Having to create an account before she sees anything; a result with no explanation; a palette she can't pull up in a store.
- **What the app does for her today:** Preview, then quiz, then a Light Summer palette with 8 colors to wear. Kept on her phone, and in her account once Supabase is on. *Gap:* no formal-dress page yet.

## 2. Aaliyah — deep skin tone, makeup first, skeptical
- **Who:** Junior, Black, does her own makeup daily, has taken three online color quizzes that all called her a Winter.
- **What she wants:** Lip and blush shades that actually work on her skin, and a result that reads her undertone rather than defaulting on her skin depth.
- **Time:** Willing to spend five minutes if it's taken seriously. Will take a selfie only if she trusts the lighting advice.
- **Money:** Spends about $40 a month on makeup at Sephora and Ulta. Would buy a lipstick straight from her palette.
- **Answers:** green veins, gold, tans easily, black hair, very dark brown eyes, soft ivory.
- **What would make her give up:** Being put in Winter "because dark"; an avoid list with no reasons; makeup shades that are obviously meant for fair skin. **This is the persona that tests whether the season is right for every skin tone** (Principle 3).
- **What the app does for her today:** Deep Autumn, with brick and berry-brown lip shades. *Gap:* no foundation or undertone guidance, and the palettes are still placeholders until Bella's real ones.

## 3. Priya — busy, private, no photo
- **Who:** Senior, pre-med, studying for the MCAT. Won't upload a photo of her face to an app she found through a GroupMe.
- **What she wants:** Her season in under a minute, without a photo.
- **Time:** One minute, once. Won't come back unless the result is useful.
- **Money:** Tight; wouldn't pay for a report, but would use a free result when shopping.
- **Answers:** a mix of blue and green veins, silver, burns then tans, dark brown hair, hazel eyes, bright white.
- **What would make her give up:** A required photo; a long form; an account before any value; unclear privacy.
- **What the app does for her today:** Skips the selfie and gets Deep Winter from her answers. The photo promise is right above the camera button. *Gap:* still has to create an account before the quiz once Supabase is on (the preview comes first).

## 4. Chloe — new member, found us on TikTok
- **Who:** Freshman, just got her bid, on TikTok and Instagram daily. Heard about the app from a chapter GroupMe during bid week.
- **What she wants:** A fun result to share with her pledge class, and colors for bid day photos.
- **Time:** Two minutes on her phone in Safari, in the middle of a group hangout.
- **Money:** Little to spend; would never pay, but would tag The Color Code in a story.
- **Answers:** green veins, gold, burns, golden blonde, bright blue eyes, bright white.
- **What would make her give up:** A slow result; nothing to share; having to download something from the App Store.
- **What the app does for her today:** Light Spring in about a minute; installs from Share → Add to Home Screen. *Gap:* no Instagram Story palette card yet (one of the practicum's suggested extensions).

## 5. Hannah — chapter sisterhood chair (books a color night)
- **Who:** Junior, sisterhood chair of a 120-member chapter. Plans two sisterhood events a semester.
- **What she wants:** A sisterhood event that's easy to run: everyone gets her season on her own phone, and the chapter sees who shares a season before formal and bid day photos.
- **Time:** Plans three weeks ahead; needs setup to take under 10 minutes on the night.
- **Money:** About $200–$300 per sisterhood event from the chapter budget. The $150–$250 chapter-night price fits; the first one free for a post is an easy yes.
- **What would make her give up:** Members having to download an app store app; any member being charged; not being able to show the chapter's spread on a screen at the event; unclear photo privacy (she's responsible for her members).
- **What the app does for her today:** An **example chapter spread** on Results & Benefits (24 invented members across 9 seasons, with names grouped by season), labeled as an example and "coming later." *Gap:* no group link or chapter booking yet. Today she'd contact Joely or Sofia through Panhellenic.

## 6. Dana — Panhellenic VP of Programming (the partner)
- **Who:** Senior, on the Panhellenic executive board, which covers all 1,832 women in Tulane Greek life.
- **What she wants:** A campus-wide program that's free for members, inclusive of every skin tone, and safe to recommend, so it reflects well on Panhellenic.
- **Time:** Reviews a partner once, in a short meeting, then shares it in the council GroupMe and newsletter.
- **Money:** No budget to pay a vendor; will promote for free if the program is free and useful.
- **What would make her give up:** Any cost to members; photos being stored or seen; results that look wrong for members of color; a partner who can't show how it works on a phone in the meeting.
- **What the app does for her today:** Free pilot; the photo promise on the upload screen (used once, deleted, never saved or seen); a quiz-only path; the team screen shows the team every result (once Supabase is on), so Sofia's consistency checks are possible. *Gap:* no written privacy policy page yet (still a TODO on FAQ & Policies).

---

## What these six tell us to build or fix next
1. **Principle 3 proof for Aaliyah:** have real members of color test it and compare against their own sense of their coloring before we promote it campus-wide.
2. **Privacy policy page** for Dana and Hannah: the photo promise exists, but the FAQ's full policy is still a TODO.
3. **Instagram Story palette card** for Chloe: the easiest growth loop.
4. **Group link / chapter night** for Hannah: the first thing anyone would pay for.
5. **Bella's real palettes**: the result is only as good as the colors in it.
