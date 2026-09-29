# Beta round 2 — Aaliyah (deep skin, makeup first, skeptical)

**Tester:** our app development agent, playing Aaliyah from `docs/personas.md`: a junior with deep skin who does her own makeup daily, and who has had three online quizzes call her a Winter "because dark." She'll take a selfie only if she trusts it.
**Date:** September 29, 2026 (after the round 1 fixes went live)
**How:** the exact code live on `main`, opened in a phone-sized browser posing as an iPhone (390×844, Safari), with a selfie. The agent can't reach Cloudflare's AI from its environment, so a stand-in returned the AI's answer. It ran twice: once with the AI answering, once with the AI down.
**What this round tests:** everything Aaliyah sees and reads, plus the instructions Bella gives the AI. **What it can't test:** whether the real AI's season is right for her. That needs a teammate with deep skin to run it on a real phone (see the end).
**Result:** she got Deep Autumn, "based on your selfie and your six answers," without help. But three things would stop a skeptical customer like her from trusting it or telling friends.

## Screen by screen, in Aaliyah's words

**1. FAQ, before uploading anything**
- *Expected:* a plain answer to "what happens to my photo?"
- *Saw:* under **"What happens to my photos?"** a yellow box: **"TODO — full privacy policy. Owner: Whitney, with legal review from Bella & Sofia, per PREPARE-WEBSITE.md's Needs-a-Human list…"** "So you don't have a privacy policy, and I'm reading your team's to-do list."
- Also: "Can I ask for a redo if my result looks off? **Yes — flagging a submission for re-analysis… is supported.**" I looked for a redo button later and there isn't one.

**2. The selfie box**
- The promise ("used once and then deleted… never saved or seen by anyone") is clear. Good.
- Tips: "Face a window in daylight, no filter, hair back." **Nothing about makeup.** I have foundation on every day. Does that matter? *(It does: Bella's instructions tell the AI to give up on the photo if heavy makeup hides the coloring, but the customer is never told.)*

**3. Question 1: veins**
- "Look at the veins on your inner wrist in daylight." On my skin I honestly can't see them well. I picked **"A mix / can't tell."**
- *Then the result said:* **"Veins that look both blue and green…"** That's not what I said. I said I *can't tell*. It's the same thing that makes me distrust every quiz: it heard what it expected, not what I answered. *(The AI is also told "a mix of blue and green veins," so it gets the wrong answer too.)*

**4. Question 3: sun**
- "I burn easily / I burn, then tan / I tan easily." I rarely burn; my skin just gets deeper. "Tan easily" was the closest, but it doesn't really fit.

**5. Waiting**
- "Bella is looking at your photo… (about 15 seconds)." Clear.

**6. The result**
- **Deep Autumn**, "Based on your selfie and your six answers. Your photo has been deleted." Not Winter! That's the moment I'd screenshot.
- Reason (from the stand-in AI): warm golden-brown undertone, dark eyes and hair, rich warm contrast. That reads right.
- **Makeup: brick red and deep berry-brown lip, deep terracotta and warm brick blush.** These actually work on my skin. That's the thing I came for.
- **"A few to avoid": pastel pink, icy grey, baby blue.** No reason given. Why? Is it my undertone or my depth? A line explaining it would stop me arguing with the app.
- **If the AI is down:** I get Deep Autumn from my answers, with "Photo analysis didn't respond just now, so your season comes from your answers." Honest, fine. But the reason again says "veins that look both blue and green."

## Bella's instructions to the AI (checked for Aaliyah's fear)
The instructions tell the AI to look at undertone, depth, eyes, hair and contrast; never mention ethnicity; and trust the photo over the answers unless the light is bad. **They don't warn against her exact fear: treating deep skin as automatically cool (Winter).** Depth and undertone are separate. Deep skin can be warm, cool or neutral, and many deep-skinned women are Autumns. One sentence in the instructions would guard against this.

## Where Aaliyah got confused or lost trust
1. **The FAQ photo answer is a TODO box with internal team notes**, and the FAQ promises a redo that doesn't exist.
2. **"Can't tell" was turned into "both blue and green"**, in her result and in what the AI is told.
3. **No mention of makeup** before the selfie, even though foundation hides undertone.
4. **The sun question has no option for skin that rarely burns** and just deepens.
5. **The avoid colors have no reason.**
6. **Bella's AI instructions don't say "deep skin isn't automatically Winter."**

Also noticed: every season's makeup shades are the same no matter how light or deep someone's skin is. Deep Autumn's shades suit her, but if the AI puts a deep-skinned woman in, say, True Spring, "warm peach" lipstick may look ashy. That's one for Bella's real palettes.

## The three changes that would have helped Aaliyah most
1. **Treat "can't tell" as "can't tell," and fit the questions to deeper skin.** Separate "A mix" from "I can't tell" on the vein question, make the reason and the AI's input say what she actually answered, and add "I rarely burn — my skin just gets deeper" to the sun question.
2. **Make the selfie fair to deep skin and makeup wearers.** Add "bare skin or light makeup — foundation can hide your undertone" to the selfie tips, and add to Bella's AI instructions that skin depth is not undertone, so deep skin can be any season and must never be put in Winter just for being deep.
3. **Replace the FAQ's TODO with a real photo answer and stop promising a redo that doesn't exist.** Put the same photo promise from the selfie screen on the FAQ, and either add a "This doesn't look right" button on the result (so the team sees it) or remove the redo claim. Add one line under "A few to avoid" explaining why, for example "These cool, icy shades fight your warm undertone."

## Still needed from the team (real-phone check)
The stand-in can't tell us whether the real AI gets deep skin right. Before promoting to Panhellenic, **a teammate or friend with deep skin should take a real selfie by a window, bare-faced**, answer honestly, and note: the season, the two-sentence reason, and whether they agree. Then repeat in different daylight to see if the season stays the same. That's the Principle 3 check: fewer than 7 in 10 agreeing, or two different seasons from two photos, would mean the analysis isn't reliable yet.

*Not fixed yet. These go into the next round of changes.*
