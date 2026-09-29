// The Color Code — quiz analysis and result page.
// Picks one of the twelve seasons from the six quiz answers using fixed rules
// (same answers always give the same season). Colors come only from palettes.js.
import { SEASONS, PALETTES_ARE_PLACEHOLDER } from './palettes.js';
import { accountsOn, supabase, currentUser, esc } from './supabase-client.js';
import { LABELS, QUESTIONS, pickSeason, reasonFor } from './season-rules.js';

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

// Quiz page: preview for everyone, the quiz itself once logged in.
var form = document.querySelector('[data-analysis-form]');
var sample = document.querySelector('[data-preview-sample]');
if (sample) {
  var ex = SEASONS['Soft Autumn'];
  sample.innerHTML = '<span class="example-flag">Example result</span><h3 style="font-size:22px;">Soft Autumn</h3>' +
    '<p class="form-note" style="margin-top:4px;">' + ex.summary + '</p>' +
    '<div class="swatch-grid">' + swatches(ex.wear.slice(0, 4)) + '</div>' +
    '<p class="form-note" style="margin-top:12px;">Plus a few colors to avoid and your lip, blush and eye shades.</p>';
}

if (form) {
  var user = await currentUser();
  var gate = document.querySelector('[data-account-gate]');
  var who = document.querySelector('[data-signed-in]');
  if (!accountsOn || user) {
    form.hidden = false;
    if (gate) gate.hidden = true;
    if (user && who) { who.hidden = false; who.innerHTML = 'Signed in as <strong>' + esc(user.email) + '</strong> — your result will be saved to <a href="account.html">your account</a>.'; }
  } else {
    form.hidden = true;
    if (gate) gate.hidden = false;
  }

  // Selfie: open the front camera (or pick a photo), shrink it on the phone, keep it only in memory.
  var photo = null;
  var preview = form.querySelector('[data-selfie-preview]');
  var actions = form.querySelector('[data-selfie-actions]');
  form.querySelectorAll('[data-selfie-input]').forEach(function (input) {
    input.addEventListener('change', async function () {
      var file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      try {
        photo = await shrinkPhoto(file);
        form.querySelector('[data-selfie-img]').src = photo;
        preview.hidden = false;
        actions.hidden = true;
        form.querySelector('[data-selfie-error]').hidden = true;
      } catch (err) {
        photo = null;
        alert('That photo couldn\'t be opened. Try taking it again.');
      }
    });
  });
  form.querySelector('[data-selfie-clear]').addEventListener('click', function () {
    photo = null;
    form.querySelector('[data-selfie-img]').removeAttribute('src');
    preview.hidden = true;
    actions.hidden = false;
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!photo) {
      var selfieError = form.querySelector('[data-selfie-error]');
      selfieError.hidden = false;
      form.querySelector('[data-selfie]').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    var fd = new FormData(form);
    var a = {};
    QUESTIONS.forEach(function (k) { a[k] = fd.get(k); });
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    var season = pickSeason(a);
    var result = { season: season, reason: reasonFor(season, a), answers: a, method: 'quiz', at: new Date().toISOString() };
    if (photo) {
      btn.textContent = 'Bella is looking at your photo… (about 15 seconds)';
      try {
        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, 55000);
        var res = await fetch('/api/analyze', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ photo: photo, answers: a }), signal: ctrl.signal,
        });
        clearTimeout(timer);
        var data = await res.json();
        if (res.ok && SEASONS[data.season]) {
          result.season = data.season;
          result.reason = data.reason;
          result.method = data.method;
          if (data.note) result.note = data.note;
        } else {
          result.note = 'We couldn\'t read your photo just now, so your season comes from your answers.';
        }
      } catch (err) {
        result.note = 'We couldn\'t reach photo analysis just now, so your season comes from your answers.';
      }
      // The photo is done with: drop it from the app too.
      photo = null;
      form.querySelector('[data-selfie-img]').removeAttribute('src');
    } else {
      btn.textContent = 'Bella is reading your answers…';
    }

    save(result);
    track('intake_completed');
    var next = 'result.html';
    if (supabase && user) {
      var ins = await supabase.from('analyses').insert({
        season: result.season, reason: result.reason, answers: a, method: result.method,
        research_consent: fd.get('consent-research') === 'on',
      }).select('id').single();
      if (ins.error) { console.error(ins.error); next = 'result.html?unsaved=1'; }
      else next = 'result.html?id=' + ins.data.id;
    }
    setTimeout(function () { window.location.href = next; }, 400);
  });
}

// Shrink to at most 768px and re-save as JPEG: faster to send, and it strips hidden
// photo data such as location.
function shrinkPhoto(file) {
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var scale = Math.min(1, 768 / Math.max(img.width, img.height));
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}

// "Use your palette everywhere": how the season guides outfits, nails, hair, makeup and accessories.
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

// Result page: a saved result from the account, or the last one kept on this phone.
var out = document.querySelector('[data-result]');
if (out) {
  var params = new URLSearchParams(location.search);
  var r = null, savedNote = '';
  var signedIn = await currentUser();
  if (params.get('id') && supabase) {
    var got = await supabase.from('analyses').select('*').eq('id', params.get('id')).maybeSingle();
    if (got.data) r = { season: got.data.season, reason: got.data.reason, teamNote: got.data.team_note, method: got.data.method };
    var local = load();
    if (r && local && local.season === r.season && local.note) r.note = local.note;
  }
  if (!r) r = load();
  if (params.get('id') && r) savedNote = 'Saved to <a href="account.html">your account</a> — log in from any phone to see it again.';
  else if (params.get('unsaved')) savedNote = 'We couldn\'t save this to your account just now, but it\'s kept on this phone. Try again later from <a href="start-your-analysis.html">the quiz</a>.';
  else if (accountsOn && !signedIn) savedNote = 'Kept on this phone. <a href="account.html?mode=signup">Create a free account</a> to save it and open it from any phone.';
  else if (accountsOn) savedNote = 'Kept on this phone. Your saved results are in <a href="account.html">your account</a>.';
  else savedNote = 'Your result is kept on this phone — come back to this page any time.';

  if (!r || !SEASONS[r.season]) {
    out.innerHTML = '<div class="empty-state"><h3>No result yet</h3><p>Take a selfie and answer six quick questions to get your season.</p><p style="margin-top:18px;"><a class="btn-primary" href="start-your-analysis.html">Start your analysis →</a></p></div>';
  } else {
    var s = SEASONS[r.season];
    out.innerHTML =
      '<p class="eyebrow">Your season</p>' +
      '<h1 class="page-title">' + esc(r.season) + '</h1>' +
      '<p class="lede">' + esc(r.reason) + '</p>' +
      (PALETTES_ARE_PLACEHOLDER ? '<p class="example-flag" style="margin-top:18px;">Pilot palette — Bella\'s final shades coming soon</p>' : '') +
      '<p class="method-line">' + (r.method === 'photo+quiz' ? 'Based on your selfie and your six answers. We didn\'t save your photo.' : 'Based on your six answers.') + '</p>' +
      (r.note ? '<p class="form-msg" style="margin-top:14px;">' + esc(r.note) + '</p>' : '') +
      (r.teamNote ? '<div class="card" style="margin-top:22px;"><strong>Note from The Color Code team</strong><p style="margin-top:6px;">' + esc(r.teamNote) + '</p></div>' : '') +
      '<section class="result-block"><h2 class="section-title">Colors to wear</h2><div class="swatch-grid">' + swatches(s.wear) + '</div></section>' +
      '<section class="result-block"><h2 class="section-title">A few to avoid</h2><div class="swatch-grid">' + swatches(s.avoid) + '</div></section>' +
      '<section class="result-block"><h2 class="section-title">Your makeup shades</h2>' +
        '<h3 class="result-sub">Lip</h3><div class="swatch-grid">' + swatches(s.lip) + '</div>' +
        '<h3 class="result-sub">Blush</h3><div class="swatch-grid">' + swatches(s.blush) + '</div>' +
        '<h3 class="result-sub">Eye</h3><div class="swatch-grid">' + swatches(s.eye) + '</div></section>' +
      usesSection(s) +
      '<section class="result-block"><p class="form-note">' + savedNote + '</p>' +
      '<p style="margin-top:18px;"><a class="btn-primary" href="start-your-analysis.html">Retake the analysis</a></p></section>';
  }
}
