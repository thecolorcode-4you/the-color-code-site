// The Color Code — quiz analysis and result page.
// Picks one of the twelve seasons from the six quiz answers using fixed rules
// (same answers always give the same season). Colors come only from palettes.js.
import { SEASONS, PALETTES_ARE_PLACEHOLDER } from './palettes.js';
import { QUIZ_KEYS, pickSeason, reasonFor } from './season-rules.js';

var STORE_KEY = 'tcc_last_result';

function save(result) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(result)); } catch (e) {}
}
function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
}
function track(name) { if (typeof window.trackEvent === 'function') window.trackEvent(name); }

function swatches(list) {
  return list.map(function (p) {
    return '<div class="swatch"><span class="swatch-dot" style="background:' + p[1] + '"></span><span class="swatch-name">' + p[0] + '</span></div>';
  }).join('');
}

// Quiz page
var form = document.querySelector('[data-analysis-form]');
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var a = {};
    QUIZ_KEYS.forEach(function (k) { a[k] = fd.get(k); });
    var season = pickSeason(a);
    save({
      season: season,
      reason: reasonFor(season, a),
      answers: a,
      consentResearch: fd.get('consent-research') === 'on',
      at: new Date().toISOString(),
    });
    track('intake_completed');
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Bella is reading your answers…';
    setTimeout(function () { window.location.href = 'result.html'; }, 900);
  });
}

// Result page
function getAccount() {
  return fetch('/api/me', { credentials: 'same-origin' })
    .then(function (res) { return res.ok ? res.json() : null; })
    .catch(function () { return null; });
}

function saveToAccount(r) {
  return fetch('/api/results', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: r.answers, consent_analysis: true, consent_research: !!r.consentResearch }),
  }).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (body) {
      if (!res.ok) throw new Error(body.error || 'We couldn\'t save your palette. Please try again.');
      return body;
    });
  });
}

function usesSection(s) {
  var warm = s.family === 'Spring' || s.family === 'Autumn';
  var hair = warm
    ? 'Stay with warm tones like golden, honey, caramel and copper. Show your stylist your season.'
    : 'Stay with cool tones like ash, beige, cool brown and blue-black. Show your stylist your season.';
  var metal = warm ? 'Gold, brass and rose gold' : 'Silver, platinum and white gold';
  return '<section class="result-block"><h2 class="section-title">Use your palette everywhere</h2>' +
    '<p class="lede">Your palette is a guide for every color choice you make, not just one outfit.</p>' +
    '<div class="uses-grid">' +
      '<div class="use-card"><h3>Outfits, all year</h3><p>Build outfits from your colors to wear. Lean on the lighter shades in spring and summer and the deeper ones in fall and winter, and keep the colors to avoid away from your face.</p></div>' +
      '<div class="use-card"><h3>Nail color</h3><p>Pick polish from your lip shades or your colors to wear. They are already matched to your skin.</p><div class="swatch-grid swatch-grid-small">' + swatches([s.lip[0], s.wear[0], s.wear[1]]) + '</div></div>' +
      '<div class="use-card"><h3>Hair color</h3><p>' + hair + '</p></div>' +
      '<div class="use-card"><h3>Makeup</h3><p>Use the lip, blush and eye shades above when you shop, or bring this page to the makeup counter.</p></div>' +
      '<div class="use-card"><h3>Accessories</h3><p>' + metal + ' flatter you most. Choose bags, scarves and glasses from your colors to wear.</p></div>' +
    '</div>' +
    '<p class="form-note" style="margin-top:14px;">General guidance based on your season.</p></section>';
}

function renderResult(out, r) {
  var s = SEASONS[r.season];
  out.innerHTML =
    '<p class="eyebrow">Your season</p>' +
    '<h1 class="page-title">' + r.season + '</h1>' +
    '<p class="lede">' + reasonFor(r.season, r.answers) + '</p>' +
    (PALETTES_ARE_PLACEHOLDER ? '<p class="example-flag" style="margin-top:18px;">Pilot palette — Bella\'s final shades coming soon</p>' : '') +
    '<div data-save-box></div>' +
    '<section class="result-block"><h2 class="section-title">Colors to wear</h2><div class="swatch-grid">' + swatches(s.wear) + '</div></section>' +
    '<section class="result-block"><h2 class="section-title">A few to avoid</h2><div class="swatch-grid">' + swatches(s.avoid) + '</div></section>' +
    '<section class="result-block"><h2 class="section-title">Your makeup shades</h2>' +
      '<h3 class="result-sub">Lip</h3><div class="swatch-grid">' + swatches(s.lip) + '</div>' +
      '<h3 class="result-sub">Blush</h3><div class="swatch-grid">' + swatches(s.blush) + '</div>' +
      '<h3 class="result-sub">Eye</h3><div class="swatch-grid">' + swatches(s.eye) + '</div></section>' +
    usesSection(s) +
    '<section class="result-block"><p><a class="btn-secondary" href="start-your-analysis.html">Retake the quiz</a></p></section>';
  track('result_viewed');
  return out.querySelector('[data-save-box]');
}

function saveBox(box, html) {
  box.innerHTML = '<div class="card account-prompt save-box">' + html + '</div>';
}

var SAVED_HTML = '<h3>Saved to your account ✓</h3><p>Open it any time, from any phone, in <a href="my-analysis.html">My Analysis</a>.</p>';

var out = document.querySelector('[data-result]');
if (out) {
  var savedId = new URLSearchParams(window.location.search).get('id');
  getAccount().then(function (account) {
    // A result opened from My Analysis comes from the account.
    if (savedId) {
      var saved = account && account.results.filter(function (x) { return x.id === savedId; })[0];
      if (!saved || !SEASONS[saved.season]) {
        out.innerHTML = '<div class="empty-state"><h3>We couldn\'t find that result</h3><p>Sign in to see the palettes saved to your account.</p><p style="margin-top:18px;"><a class="btn-primary" href="my-analysis.html">Go to My Analysis</a></p></div>';
        return;
      }
      saveBox(renderResult(out, saved), SAVED_HTML);
      return;
    }

    var r = load();
    if (!r || !SEASONS[r.season]) {
      out.innerHTML = '<div class="empty-state"><h3>No result yet</h3><p>Take the six-question quiz to get your season.</p><p style="margin-top:18px;"><a class="btn-primary" href="start-your-analysis.html">Start your analysis →</a></p></div>';
      return;
    }
    var box = renderResult(out, r);

    if (r.savedId) {
      saveBox(box, SAVED_HTML);
    } else if (account) {
      saveBox(box, '<h3>Saving to your account…</h3>');
      saveToAccount(r).then(function (res) {
        r.savedId = res.id;
        save(r);
        track('result_saved');
        saveBox(box, SAVED_HTML);
      }).catch(function (err) {
        saveBox(box, '<h3>Not saved yet</h3><p class="form-error">' + err.message.replace(/</g, '&lt;') + '</p>');
      });
    } else {
      saveBox(box,
        '<h3>Save your palette</h3>' +
        '<p>Create a free account to keep your season and colors, and open them from any phone.</p>' +
        '<div class="button-row">' +
          '<a class="btn-primary" href="create-account.html?next=result.html">Create free account</a>' +
          '<a class="btn-secondary" href="sign-in.html?next=result.html">I already have one</a>' +
        '</div>');
    }
  });
}
