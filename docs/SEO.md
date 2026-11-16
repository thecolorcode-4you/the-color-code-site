# SEO work log: The Color Code site

**Date:** 2026-11-12 · **By:** web agent · **Live site:** https://the-color-code-site.thecolorcode-mktg4250.workers.dev/

The course's five-point SEO checklist, done in order, plus structured data (Part 1), then what we changed so AI assistants can find, trust and recommend us (Part 2).

---

## 0. A decision this reverses

The site was deliberately hidden from search: `robots.txt` said `Disallow: /` and every page had `<meta name="robots" content="noindex, nofollow">`, per **WEBSITE-BRAINSTORM.md Decision 13** ("block indexing during the free pilot"). On 2026-11-12 the CEO approved opening it to search engines. Update Decision 13 in the brainstorm so the two documents agree.

Pages that **stay hidden** (noindex): `account.html`, `result.html`, `reset-password.html`, `team.html`, `kpi/`. They are private or show one person's result.

---

## 1. Letting Google in

| File | What changed |
|---|---|
| `robots.txt` | Rewritten. Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot and PerplexityBot are each named and allowed, and so is every other crawler. Only `/api/` (the selfie endpoint) is blocked. Ends with the `Sitemap:` line. (2026-11-14: a dash in its first comment line was changed to a plain hyphen so it displays correctly.) |
| `sitemap.xml` | **New.** Lists all 10 public pages (11 after Part 2 added Pricing): home, Start Your Analysis, How It Works, Results & Benefits, the 3 new guides, About, FAQ, Customer Reviews. The 5 noindex pages are left out on purpose: a sitemap tells Google "please index this", which would contradict their noindex tag. |
| Every public page | `noindex, nofollow` → `index, follow`, plus a `<link rel="canonical">` to its full address. |

### Google Search Console (done by the team)

1. ✅ **2026-11-12:** property added as a **URL prefix** (`https://the-color-code-site.thecolorcode-mktg4250.workers.dev/`); a `workers.dev` address is shared, so the Domain option doesn't work.
2. ✅ **2026-11-12:** verified with the **HTML tag** method; the `google-site-verification` tag is in the `<head>` of `index.html`. Leave it there, or verification is lost.
3. ✅ **Sitemap submitted:** `sitemap.xml`.
4. ⏳ **Request indexing:** the home page's first inspection said "can't be indexed" because Google still had our old `Disallow: /` robots.txt cached; the live test after the cache cleared showed it available, and the daily request quota ran out. Still to request, a few a day: the home page (if not done), `warm-or-cool-undertone.html`, `what-colors-look-good-on-me.html`, `color-analysis-new-orleans.html`, `pricing.html`. The sitemap gets every page found anyway; this only speeds it up.
5. Optional: Bing Webmaster Tools (https://www.bing.com/webmasters) → **Import from Google Search Console** (Bing also powers ChatGPT search).

**If you get a custom domain later** (for example `thecolorcode.com`), every canonical tag, `sitemap.xml`, `robots.txt` and the About page's structured data must change to the new address, and you add the new domain as its own Search Console property.

---

## 2. Three pages that answer what customers search for

The CEO picked these three from the six personas in `docs/personas.md`. Each page answers its question in full sentences in the first paragraph, then backs it with things only we can say, and links to where the reader acts.

| Page | Question it answers | Only-us material | Where it sends people |
|---|---|---|---|
| `warm-or-cool-undertone.html` | How do I know if I have warm or cool undertones? | The exact weights our season rules (`season-rules.js`) give each sign: veins, jewelry and white or ivory count 1 point each, sun ½, hair a ½-point hint; "rarely burn" counts for depth only; a sure selfie reading counts as much as 2 answers; indoor light counts for half. Real swatches from our final True Autumn and True Winter palettes. | Start Your Analysis (twice) |
| `what-colors-look-good-on-me.html` | What colors look good on me? | All 12 of our final palettes (Bella and Whitney, Sept 2026), generated straight from `palettes.js`: 8 colors to wear, 3 to skip and why. A still from our own hero video. | Start Your Analysis (three times) |
| `color-analysis-new-orleans.html` | Where can I get a color analysis in New Orleans? | Our numbers: $0 during the pilot, about 1 minute, about 15 seconds for a selfie, 7 questions, 12 seasons, 0 photos kept; chapter color nights run by Joely and Sofia; Whitney's own analysis in Korea. A still from our own video. | Start Your Analysis, chapter color night section, Instagram DM |

**Still missing: our customers' words.** We have no real reviews yet, and the only "reviews" on the site are labeled invented test users. I didn't put invented quotes on these pages. When the first real customer agrees to be quoted, add one or two lines to each guide, especially the undertone page (an Aaliyah-type customer saying the result read her undertone right would be the strongest proof we could have). Real photos of members holding up their palettes would also beat the video stills.

---

## 3. Plain titles, descriptions and headings

Every page now has a title under 60 characters and a description under 160 (checked by script). Headings now say what the page or section is and who it's for; the brand lines were kept as text under the heading.

| Page | New title (chars) | Old → new main heading |
|---|---|---|
| Home | Free Color Analysis for Tulane Students \| The Color Code (56) | "Know exactly which colors work for you — down to the shade." → **Free personal color analysis for Tulane students** |
| How It Works | How Our Personal Color Analysis Works \| The Color Code (54) | "Three steps, one report." → **How our personal color analysis works** |
| Start Your Analysis | Take the Free Color Analysis Quiz \| The Color Code (50) | "Start Your Analysis with Bella" → **Start your free color analysis** |
| Results & Benefits | Your Color Palette Report \| The Color Code (42) | "All shades. One hue. Endlessly you." → **What your color palette report includes** |
| Customer Reviews | Customer Reviews \| The Color Code (33) | "What clients are saying" → **Customer reviews of The Color Code** |
| About | About Us: Tulane Students in New Orleans \| The Color Code (57) | "Five women who live color theory daily." → **About The Color Code: who we are and how to reach us** |
| FAQ & Policies | FAQ: Price, Photo Privacy and Results \| The Color Code (54) | "Questions, answered." → **Questions about price, photo privacy and results** |
| Undertone guide (new) | Warm or Cool Undertone? How to Tell \| The Color Code (52) | **How do I know if I have warm or cool undertones?** |
| Colors guide (new) | What Colors Look Good on Me? \| The Color Code (45) | **What colors look good on me?** |
| New Orleans guide (new) | Color Analysis in New Orleans, Free \| The Color Code (52) | **Where can I get a color analysis in New Orleans?** |
| Account, Result, Reset password, Team, KPI | Plain titles; the four copy-pasted "Submit your photos…" descriptions replaced with ones that fit | (noindex, unchanged) |

Section headings changed too, for example "Bring a color night to your chapter." → "Chapter color nights for Tulane sororities"; "What 'Analyze' actually means" → "How we choose your season"; "What a result looks like" → "Example results from invented test users". The home page's "Why This Matters" section had no heading at all; it now has "Why it helps to know your colors". FAQ questions became `<h2>`s and the How It Works steps `<h2>`s so no heading level is skipped (an accessibility audit item).

Each public page also got Open Graph tags (title, description, image) so links pasted into Instagram DMs, GroupMe and iMessage show a proper preview.

---

## 4. Links from places we already control

### On the site (done)

- **Footer on every page** now has all six main pages, Instagram and TikTok (before, only the home page footer had the social links), a **Color guides** row linking the three new pages, and our location.
- **Home page:** new "Color guides" section linking the three guides.
- **Each guide** links to the other two plus How It Works and FAQ ("More color guides").
- **How It Works, Results & Benefits, FAQ** link into the guides where the topic comes up. The FAQ got two new questions: "How do I know if I'm warm or cool?" and "Where are you based?"
- **About page** (it already existed, but had no location or contact). It now has: what The Color Code is, **Where we are** (Tulane University, New Orleans, Louisiana), **How to reach us** (Instagram DM @thecolorcode.collective; TikTok @thecolorcode_), the five team members, and a link to start the analysis. The CEO chose Instagram DM as the only public contact; no email is published.

### Off the site (you have to do these; I can't sign in to them)

Use this exact link everywhere: `https://the-color-code-site.thecolorcode-mktg4250.workers.dev/`

| Place we control | Owner | Has the link today? | What to do |
|---|---|---|---|
| Instagram bio, @thecolorcode.collective | Piper | Unknown, I can't see it | Settings → Edit profile → **Links** → Add external link. |
| TikTok bio, @thecolorcode_ | Piper / Joely | Unknown | Edit profile → **Website** (needs a Business account) or put the address in the bio text. |
| TikTok video descriptions and Instagram post captions | Joely | Unknown | Add "Free quiz: link in bio", and on TikTok paste the address into the description. For a video about undertones, link `/warm-or-cool-undertone.html` directly. |
| Instagram Story highlight / pinned post | Piper | Unknown | A "Find your season" highlight with a link sticker to the quiz. |
| Each team member's personal Instagram / TikTok / LinkedIn | Everyone | Unknown | Add the site to your bio or LinkedIn "Projects". |
| Tulane student-organization directory (if we register as a club) | Sofia | No | Website field. |
| Tulane Panhellenic newsletter / council GroupMe | Joely, Sofia | No | Link the New Orleans guide or the quiz when it's shared. |
| Course activity page (mktg4250.pages.dev) | Whitney | Unknown | Add the live link to our team entry, if the course allows. |
| GitHub repository "Website" field | Whitney | No | Repository → ⚙ next to About → Website. |
| Google Business Profile | Whitney | No | Optional and only if we want a map listing: it's a service-area business with no storefront, so hide the address. |

Tell me which ones you've done and I'll mark them here.

---

## 5. Fast on a phone

### Before and after

**Google PageSpeed Insights could not be run from my workspace.** Its free shared quota was used up (error 429, "Queries per day"), and my workspace's network can't reach `workers.dev` at all. So I ran **Lighthouse**, the engine PageSpeed Insights uses, myself with the same mobile settings (Moto G Power emulation, slow 4G throttling), against the site's files served locally, 3 runs each:

| Home page, mobile | Before | After |
|---|---|---|
| **Performance** | **98** (98, 98, 99) | **99** (100, 99, 99); **official PageSpeed Insights on the live site: 100** |
| Accessibility | 95 | 100 |
| Best practices | 96 | 96 |
| **SEO** | **66** | **100** |
| Largest Contentful Paint | 2.2 s | 1.5–1.6 s |
| First Contentful Paint | 1.5 s | 1.5 s |
| Total Blocking Time | 0 ms | 0 ms |
| Layout shift | 0 | 0.02 |
| Hero video file | 10.5 MB `.mov`, started downloading at once | 2.1 MB `.mp4`, loads after the page |

All 10 public pages now score SEO 100 and accessibility 98–100 in the same test.

**Official PageSpeed Insights, live site, mobile, after deploy: 100** (2026-11-12, run by the team on pagespeed.web.dev). The "before" figure is my local Lighthouse run, because PageSpeed Insights couldn't be reached from my workspace at the time.

### What it flagged, and what I fixed

| Flag | Fix |
|---|---|
| Page is blocked from indexing (SEO) | See section 1. |
| Huge hero video (10.5 MB QuickTime `.mov`) | Re-encoded to a 720-px H.264 `.mp4` with fast start (2.1 MB, same 39 seconds, audio kept). Shows a 24 KB poster image first; `site.js` only loads the video after the page has finished loading. `hero.mov` removed. |
| Images not properly sized / not next-gen format | Logo was a 424×296 PNG (133 KB) shown at 75×52; resized to 2× (149×104, 20 KB). New photos are WebP. |
| Images without width and height (layout jumps) | Added `width`/`height` to the logo, video and every new image. |
| Text contrast too low (accessibility) | The accent color `#B5675F` was 3.9:1 on ivory (minimum is 4.5:1). Darkened to `#9C524A` (5.3:1), and the muted text from `#726862` to `#6B615B`. The accent was already marked PLACEHOLDER in `styles.css`, **Piper should confirm** the new shade. Footer links no longer fade. |
| Short cache lifetimes | New `_headers` file tells Cloudflare to let phones keep `/assets/*` for 30 days. |
| Render-blocking fonts | Added a `preconnect` to `fonts.gstatic.com` so the font files start downloading sooner. |
| Skipped heading levels (accessibility) | See section 3. |
| Console errors (best practices) | **Not fixed, and not a site problem:** they come from my workspace blocking the Supabase and Cloudflare Analytics scripts. On the live site these load normally. |

Also: the service worker's cache name went to `tcc-v9` and the stylesheet to `styles.css?v=4`, so installed phones pick up the changes.

---

## 6. Structured data (schema.org JSON-LD)

An `Organization` block in the `<head>` of `about.html`. Everything in it is visible on that page:

| Field | Value | Where it's visible |
|---|---|---|
| name | The Color Code | Logo, headings |
| url | site home page | Logo link |
| logo | `assets/logo.png` | Header logo |
| description | "The Color Code is a free personal color analysis… Five Tulane University students in New Orleans built it and run it." | First paragraph, word for word |
| address | New Orleans, LA, US | "Where we are" |
| founder | Whitney, Bella, Piper, Joely, Sofia | "Our team" |
| sameAs | Instagram, TikTok | "How to reach us" and footer |
| contactPoint | Instagram DM | "How to reach us" |

Check it after deploy at https://search.google.com/test/rich-results (paste the About page address). If you change the About page text, change the JSON-LD to match.

Two things to improve later: Google prefers a square logo of at least 112×112 for organizations, so a square version of the logo would help. And only first names are listed; add surnames on the About page and in the JSON-LD if the team is comfortable with that.

---

## How this connects to our KPI plan

`KPI-PLAN.md` isn't in this repository; I read the feed it produces, `kpi/kpi-data.json`, and `kpi/kpi-internal.json`. The only locked KPI is **Awareness: reach** (1,282 accounts by Dec 4, from Instagram and TikTok). "Visits to website per month" is listed as **not yet defined**. Once Search Console has a few weeks of data, its **Performance → Total clicks** is a clean candidate for that KPI, or for a search line inside Awareness (Search Console **impressions** = people who saw us in Google). Suggested decision rule: if impressions grow but clicks don't, rewrite that page's title and description; if neither grows after four weeks, write the next guide page.

---

## Files changed

New: `sitemap.xml`, `_headers`, `warm-or-cool-undertone.html`, `what-colors-look-good-on-me.html`, `color-analysis-new-orleans.html`, `assets/hero.mp4`, `assets/hero-poster.webp`, `assets/clothes-rack.webp`, `docs/SEO.md`.
Changed: `robots.txt`, every `.html` page, `kpi/index.html` (title only), `styles.css`, `site.js`, `sw.js`, `assets/logo.png`.
Removed: `assets/hero.mov`.

---
---

# Part 2: Being found, trusted and recommended by AI assistants

**Date:** 2026-11-14 · **By:** web agent

The goal: when someone asks ChatGPT, Claude, Gemini or Perplexity something like "free color analysis near Tulane" or "is there a color analysis app that doesn't keep my photo", the assistant can find us, check us and recommend us. Assistants trust plain answers, numbers with sources, and other websites that mention us, so those are the three things this part adds.

## 7. One FAQ page with the ten questions people ask an assistant

I rebuilt `faq-and-policies.html` instead of adding a second FAQ page, so Google and the assistants don't see two pages competing with each other (CEO's choice). The ten questions sit at the top, each answered in two or three plain sentences:

1. What is The Color Code? (what we do)
2. Who is The Color Code for?
3. How much does it cost?
4. Where are you located?
5. How do I start?
6. How long does it take?
7. What happens to my photo?
8. Who does my analysis, and how is my season chosen?
9. How does it compare with an in-person color analysis? (draping)
10. How is it different from free online color quizzes?

Below them come the numbers box (section 8) and the other questions (chapter color night, tracking, redo, warm or cool, the email list, reviews). The page title is now "FAQ: What We Do, Cost and How to Start".

**Everything is true as of 2026-11-14.** I checked each claim against the app's code and our docs: the account is required before the quiz, any email can sign up (not only Tulane addresses), the selfie is never stored, and prices after the pilot are undecided. The comparison answers describe draping and online quizzes in general terms ("usually by appointment and for a fee", "many online quizzes") and name no competitor, so there is nothing about another business we would have to prove.

## 8. Numbers with their sources

A "The Color Code in numbers" box is now on the **home page**, the new **Pricing page** and the **FAQ**. Every number names where it comes from:

| Number | Source shown on the page |
|---|---|
| $0, including a chapter's first color night | Our pilot pricing, set by our team (links to Pricing) |
| About 1 minute; a selfie adds about 15 seconds | Our app, beta tested in three rounds in September 2026 |
| 12 seasons; 8 colors to wear, 3 to skip, 2 lip, 2 blush, 3 eye shades | Our palettes, finalized by Bella and Whitney in September 2026 |
| 0 photos kept | How our app is built (links to the photo answer) |
| Live since September 2026, built and run by 5 Tulane students | Our launch and beta tests, September 2026 (links to About Us) |

**Two facts you asked for are missing on purpose:**
- **How many customers.** The database only lets signed-in team members see results, so I can't count them, and you chose to leave the number out for now. When you have it, sign in to the Team screen (`team.html`), note the count and the date, and send me something like "31 completed analyses as of Dec 1, from our team screen". There's an empty slot for it in the code of all three pages.
- **What a customer said.** We have no real quote with permission yet; the site's reviews are labeled invented examples, and I didn't present any of them as real. **To-do:** ask one or two real pilot customers for a sentence and written permission (name or initials, date, where they said it). There's an empty slot for that too. A real customer quote is probably the most convincing single thing we could add for assistants and for people.

### New Pricing page
`pricing.html` is linked in the top menu and footer of every page. It says, in its first paragraph, that everything is $0 during the Tulane pilot, then has two price cards (personal analysis $0; chapter color night $0 for your first, in exchange for a post and a tag, booked by Instagram DM), the numbers box, and "After the pilot: prices have not been decided."

## 9. Structured data (JSON-LD)

| Page | Markup | What's in it |
|---|---|---|
| Home | `Organization` | Name, description, location (New Orleans, LA, US), website, logo, Instagram and TikTok, contact (Instagram message) |
| About | `Organization` (from Part 1) | Same, plus the five team names |
| FAQ | `FAQPage` | All 16 questions and answers, word for word, linked to the organization (the 16th, "How do I join or leave your email list?", was added with the CRM sign-up form on 2026-11-16) |

**Everything in the markup is visible on its page.** I checked this with a script that compares every text field in the markup against the page's visible text (no differences). To make the contact visible on every page, the footer now says "Contact: Instagram message to @thecolorcode.collective".

Note: since 2023 Google shows FAQ rich results only for government and health sites, so ours won't get the drop-down in Google results. The markup is still valid, and assistants and other search engines read it.

Check it after deploy: https://search.google.com/test/rich-results, then paste the home page and FAQ addresses.

## 10. llms.txt

`/llms.txt` is new: a short plain-text summary of what we are, who we serve, how to contact us, and links to the pages that matter (FAQ, Pricing, Start, How It Works, About, the three guides). Google has said it doesn't use this file and the other assistants don't promise to either, so it took 10 minutes and is not the plan. The plan is sections 7–9 and 11.

## 11. Ten places assistants read where we could be mentioned (drafts only; nothing posted)

Assistants recommend businesses that **other sites** talk about. The drafts are below, written to be true today. **I posted nothing.** Before posting, check each site's rules, and always say you're on the team.

Site link to use: `https://the-color-code-site.thecolorcode-mktg4250.workers.dev/`

### 1. Google Business Profile (Gemini, Google Maps, "near me" answers)
**Check first:** Google only lists businesses that meet customers in person. Chapter color nights happen in person, so we can likely list as a **service-area business with the address hidden**. If Google says we don't qualify, skip it.
- **Name:** The Color Code
- **Category:** Image consultant (closest fit)
- **Service area:** New Orleans, LA
- **Description (750 characters max):** "The Color Code is a free personal color analysis that finds your color season, palette and makeup shades in about a minute. Five Tulane University students built it and run it. Take it on your phone: answer seven questions and add a selfie if you like (it's deleted as soon as your result is back). We also run chapter color nights for Tulane sororities; your chapter's first one is free during our pilot. Message us on Instagram @thecolorcode.collective."
- **Website:** the site link · **Owner:** Whitney

### 2. Yelp (ChatGPT, Bing and Apple Maps lean on it)
Same rules as Google: list as a service-area business with no public address. Use the description above. **Don't ask customers for Yelp reviews**; Yelp penalizes businesses that do. · **Owner:** Sofia

### 3. Reddit, r/Tulane (Perplexity and ChatGPT quote Reddit often)
**Check first:** read the subreddit rules; many ban self-promotion. If unsure, message the moderators with the post and ask. Post from a personal account and say you're on the team.
- **Title:** "We're Tulane students who built a free color analysis app. Looking for honest feedback"
- **Body:** "Hi! Five of us built The Color Code as a class venture: you answer seven questions (plus an optional selfie, deleted right after) and get your color season, a palette and makeup shades in about a minute. It's free during our pilot. We'd love honest feedback, especially from anyone whose result felt wrong, since that's how we improve the rules. [site link] (Disclosure: I'm on the team.)"
- **Owner:** Piper

### 4. Reddit, r/coloranalysis (the main color-analysis community)
**Check first:** this community is strict about self-promotion; ask the moderators before posting anything with a link. A better route than posting is answering existing undertone questions helpfully and linking our undertone guide only where it truly answers the question, with a disclosure.
- **Sample reply:** "One thing that helped us: no single sign is reliable, so we weigh four (veins, gold vs silver, white vs ivory, how you tan) and treat hair as only a light hint. We wrote it up here: [undertone guide link]. (I'm on the team that made this free quiz.)"
- **Owner:** Bella

### 5. YouTube (Gemini and Google's AI answers read video titles and descriptions)
If we post our TikToks as YouTube Shorts:
- **Channel About:** "The Color Code: free personal color analysis by five Tulane students in New Orleans. Find your season, palette and makeup shades in about a minute. [site link]"
- **Video description template:** "[One line about this video.] Find your own color season free in about a minute: [site link]. Warm or cool? [undertone guide link]. Made by Tulane students in New Orleans. #coloranalysis #colorseason"
- **Owner:** Joely

### 6. Local directories: Bing Places and Apple Business Connect (ChatGPT search uses Bing; Siri uses Apple)
Bing Places can import the Google Business Profile in one click once it exists. Apple Business Connect: same name, description and website, service area New Orleans. · **Owner:** Whitney

### 7. The Tulane Hullabaloo (student newspaper: the "student press page")
**Pitch email to the news or features editor:**
> Subject: Tulane students built a free color analysis app for Greek life
>
> Hi [name], we're five Tulane students (Whitney, Bella, Piper, Joely and Sofia) who built The Color Code, a free personal color analysis that gives you your color season, palette and makeup shades in about a minute on your phone. It's in a free pilot at Tulane since September 2026, and we run free "color nights" for sorority chapters. A few things readers may find interesting: the selfie is optional and deleted right after, and our season rules weigh seven answers instead of the usual one-question quiz. We'd be glad to talk or demo it on a phone. [site link] · Instagram @thecolorcode.collective
- **Owner:** Joely

### 8. Tulane Panhellenic (our partner: website, newsletter, council GroupMe)
**Ask:** a line plus a link on their website's resources or events page, or in the newsletter.
- **Suggested blurb for them:** "The Color Code, built by Tulane students, offers a free personal color analysis on your phone in about a minute. Chapters can book a free color night during the pilot: message @thecolorcode.collective on Instagram. [site link]"
- **Owners:** Joely and Sofia (they work with Panhellenic)

### 9. Tulane student-venture and organization pages (Lepage Center for Entrepreneurship, student organization directory, our course page)
**Ask:** a listing with our one-line description and site link wherever Tulane lists student ventures (for example, the Lepage Center at Freeman, or the course's venture showcase on mktg4250.pages.dev). University pages carry a lot of trust with assistants.
- **One-liner:** "The Color Code: free personal color analysis for Tulane students. Find your season, palette and makeup shades in about a minute. [site link]"
- **Owner:** Whitney

### 10. LinkedIn (company page, plus each team member's profile)
- **Company page About:** the Google description from #1.
- **Each of us:** add "The Color Code" under Projects or Experience, with the one-liner and the site link.
- **Owner:** everyone

**Tell me which of these you've done**, and I'll mark them here. Ask an assistant again in 4–6 weeks (for example "free color analysis Tulane" in ChatGPT, Perplexity and Gemini) and note whether we come up. That's the simplest way to see if this is working.

## Files changed in Part 2

New: `pricing.html`, `llms.txt`.
Changed: `faq-and-policies.html` (rebuilt), `index.html` (numbers box, Organization JSON-LD), every page's top menu and footer (Pricing link; Instagram contact in the footer line), `sitemap.xml` (Pricing added; 11 pages), `styles.css`, `sw.js` (cache `tcc-v10`, `styles.css?v=5`), `docs/SEO.md`.
