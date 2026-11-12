# SEO work log: The Color Code site

**Date:** 2026-11-12 · **By:** web agent · **Live site:** https://the-color-code-site.thecolorcode-mktg4250.workers.dev/

> This file belongs at `ceo/web/SEO.md`. This repository is only `ceo/web/site/`, so it is saved here as `docs/SEO.md` (the `docs/` folder is never published). Copy it up one level.

The course's five-point SEO checklist, done in order, plus structured data. Everything below is in one commit on `main`.

---

## 0. A decision this reverses

The site was deliberately hidden from search: `robots.txt` said `Disallow: /` and every page had `<meta name="robots" content="noindex, nofollow">`, per **WEBSITE-BRAINSTORM.md Decision 13** ("block indexing during the free pilot"). On 2026-11-12 the CEO approved opening it to search engines. Update Decision 13 in the brainstorm so the two documents agree.

Pages that **stay hidden** (noindex): `account.html`, `result.html`, `reset-password.html`, `team.html`, `kpi/`. They are private or show one person's result.

---

## 1. Letting Google in

| File | What changed |
|---|---|
| `robots.txt` | Rewritten. Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot and PerplexityBot are each named and allowed, and so is every other crawler. Only `/api/` (the selfie endpoint) is blocked. Ends with the `Sitemap:` line. |
| `sitemap.xml` | **New.** Lists all 10 public pages: home, Start Your Analysis, How It Works, Results & Benefits, the 3 new guides, About, FAQ, Customer Reviews. The 5 noindex pages are left out on purpose: a sitemap tells Google "please index this", which would contradict their noindex tag. |
| Every public page | `noindex, nofollow` → `index, follow`, plus a `<link rel="canonical">` to its full address. |

### Steps you have to do yourself (Google Search Console)

I can't sign in to Google for you. About 10 minutes:

1. Go to https://search.google.com/search-console and sign in with the team Google account.
2. Click **Add property** and choose **URL prefix** (not Domain: a `workers.dev` address is shared, so the Domain option won't work). Paste `https://the-color-code-site.thecolorcode-mktg4250.workers.dev/`.
3. ✅ **Done 2026-11-12:** verification tag added to `index.html`. Choose the **HTML tag** verification method. Google shows a line like `<meta name="google-site-verification" content="abc123…">`. **Send me that line** (or paste it into the `<head>` of `index.html` yourself), push it to main, wait for the Cloudflare build to finish, then click **Verify**.
4. In the left menu, open **Sitemaps**, type `sitemap.xml`, and click **Submit**. The status should say "Success" within a day.
5. Open **URL inspection**, paste the home page address, and click **Request indexing**. Do the same for the three guide pages.
6. Optional, same idea for Bing (it also powers ChatGPT search): https://www.bing.com/webmasters → **Import from Google Search Console**. It copies the site and sitemap in one click.

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

**Please record the real PageSpeed Insights score** (it measures through Cloudflare, which my local test can't): open https://pagespeed.web.dev/, paste the home page address, choose **Mobile**, and write the number here: `Mobile performance on live site after deploy: **100** (2026-11-12, run by the team on pagespeed.web.dev)`. It may be a few points lower than mine because of real network latency; the fixes are the same.

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
