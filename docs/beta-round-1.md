# Beta round 1 — Priya (busy pre-med, won't upload a photo)

**Tester:** our app development agent, playing Priya from `docs/personas.md`: a senior studying for the MCAT who found the link in a GroupMe, has about one minute, and won't upload a photo of her face.
**Date:** September 29, 2026
**How:** the exact code live on `main`, opened in a phone-sized browser posing as an iPhone (390×844, Safari). The agent can't reach the live address from its environment, so it opened the same pages locally. Accounts are off on the live site (no Supabase keys yet), so there was no sign-up step. The selfie AI wasn't used, because Priya skips the photo.
**Result:** she got her season (Deep Winter, "Based on your six answers") without help, but nearly quit twice before the first question.

## Screen by screen, in Priya's words

**1. Home page (from the GroupMe link)**
- *Expected:* what this is, that it's free, and a button to start.
- *Saw:* the first line on the screen is a grey banner: **"STAGING PREVIEW — local build only, nothing here is live. Dashed boxes mark facts we don't have yet."** "So this isn't real? Why would I give it anything?" This is where I almost closed it.
- Then: **"Upload a few photos and answer a short questionnaire."** A few photos? Of my face? Nothing on this screen says the photo is optional.
- An **"Get The Color Code app — tap Share, then Add to Home Screen"** card covers the bottom of the screen before I've seen anything. Why would I install something I haven't tried? I closed it.
- The Start Your Analysis button is right there on the first screen. Good.

**2. Start Your Analysis — the top**
- *Expected:* the questions.
- *Saw:* a paragraph about Bella being an AI agent, another paragraph saying what I'll get, a "How it works" list, then an example Soft Autumn card. It's all fine, but it says the same thing three times. **The first question is 2.4 screens down, and the Get my season button is 4.7 screens down, out of 5.4.** For a one-minute person that's a lot of thumb.
- "How it works" step 3 says my palette is **"saved to your free account."** I wasn't asked to make one, and My Account says "Accounts are coming soon." Which is true?

**3. The selfie box**
- *Expected:* a way to skip it.
- *Saw:* the photo promise is clear and reassuring: used once, deleted, never saved, no one sees it. The big **Take a selfie** button comes first, and the line saying I can skip the photo is at the very bottom of the box, after the buttons. I had to read the whole box to learn I could skip it. There's no "Skip — just answer the questions" button.

**4. The six questions**
- Quick and clear. Veins, silver or gold, sun, hair, eyes, white or ivory: I knew every answer without thinking. Big tap targets. This part was easy.
- I tapped **Get my season** without ticking the "I agree…" box, the way you skim terms. The phone showed a small "Please check this box" bubble. Not a big deal, but it's another tap, and the agreement is a long sentence.

**5. The result**
- *Expected:* my season, and whether to trust it.
- *Saw:* **Deep Winter** and a reason that opens **"Your a mix of blue and green veins, your pull toward silver jewelry…"** That's a grammar mistake in the most important sentence in the app. For someone deciding whether this is legit, it reads as sloppy.
- Right under it: **"PILOT PALETTE — BELLA'S FINAL SHADES COMING SOON."** So these aren't my real colors? Then what am I looking at?
- "Based on your six answers": good, honest.
- Colors to wear, then avoid, then lip, blush and eye, all fit on the screen; makeup is 1.3 screens down. Swatches have names, which helps.
- "Your result is kept on this phone — come back to this page any time." Fine for me.
- The install card is still covering the bottom of the screen.

## Where Priya got confused or stuck
1. **The "STAGING PREVIEW… nothing here is live" banner on the home page.** She almost left before starting. *(This banner is still on 6 pages. The quiz pages were updated, the rest weren't.)*
2. **"Upload a few photos"** on the home page, with no mention that the photo is optional.
3. **The long scroll to the first question** (2.4 screens), with the skip-photo option buried at the bottom of the selfie box.
4. **"Saved to your free account"** when there's no account step on the live site.
5. **The reason sentence's grammar:** "Your a mix of blue and green veins…" This happens whenever someone answers "a mix / can't tell" for veins.
6. **The "Pilot palette — final shades coming soon" label** makes the result sound fake.
7. **The install card** covers the bottom of every screen from the first second.

Also noticed (not a Priya problem): the home video is a `.mov` file, which some Android phones won't play. Worth checking on an Android.

## The three changes that would have helped Priya most
1. **Make the home page look real and photo-optional:** remove the "STAGING PREVIEW / nothing here is live" banner from every page, and change "Upload a few photos" to "Take a selfie (optional) and answer six quick questions."
2. **Get her to the first question in one screen:** trim the repeated intro, and put a clear **"Skip the photo — just answer 6 questions"** button at the top of the selfie box that jumps straight to question 1.
3. **Make the result sentence trustworthy:** fix the reason's grammar for every answer combination, and change "Pilot palette — final shades coming soon" to something that doesn't make the colors sound fake (for example, "Pilot palette — Bella is refining these shades"). Also make "saved to your account" appear only when accounts are actually on.

*Not fixed yet, as asked. These go into the next round of changes.*
