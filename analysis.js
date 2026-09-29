// The Color Code — quiz analysis and result page.
// Picks one of the twelve seasons from the six quiz answers using fixed rules
// (same answers always give the same season). Colors come only from palettes.js.
import { SEASONS, PALETTES_ARE_PLACEHOLDER } from './palettes.js';
import { accountsOn, supabase, currentUser, esc } from './supabase-client.js';

var STORE_KEY = 'tcc_last_result';

export var LABELS = {
  veins: { blue_purple: 'blue or purple veins', green: 'green veins', mix: 'a mix of blue and green veins' },
  jewelry: { silver: 'silver jewelry', gold: 'gold jewelry', both: 'both gold and silver' },
  sun: { burn: 'burning easily in the sun', burn_then_tan: 'burning, then tanning', tan: 'tanning easily' },
  hair: { platinum: 'platinum or light blonde hair', golden: 'golden or strawberry blonde hair', ash: 'ash or dark blonde hair', light_brown: 'light brown hair', medium_brown: 'medium brown hair', dark_brown: 'dark brown hair', black: 'black hair', red: 'red or auburn hair' },
  eyes: { light_blue_gray: 'light blue or gray eyes', bright_blue: 'bright blue eyes', green: 'green eyes', hazel: 'hazel eyes', light_brown: 'light brown eyes', dark_brown: 'dark brown eyes', black_brown: 'very dark brown eyes' },
  white: { bright: 'bright white', ivory: 'soft ivory', both: 'white or ivory alike' },
};

export function pickSeason(a) {
  // Temperature: negative = cool, positive = warm.
  var t = 0;
  t += { blue_purple: -1, green: 1, mix: 0 }[a.veins] || 0;
  t += { silver: -1, gold: 1, both: 0 }[a.jewelry] || 0;
  t += { bright: -1, ivory: 1, both: 0 }[a.white] || 0;
  t += { golden: 1, red: 1, ash: -0.5, black: -0.5 }[a.hair] || 0;
  t += { burn: -0.5, tan: 0.5 }[a.sun] || 0;

  // Depth: negative = light, positive = deep.
  var d = 0;
  d += { platinum: -2, golden: -1.5, ash: -1, light_brown: -0.5, medium_brown: 0.5, red: 0, dark_brown: 1.5, black: 2 }[a.hair] || 0;
  d += { light_blue_gray: -1, bright_blue: -0.5, green: -0.5, hazel: 0, light_brown: 0, dark_brown: 1, black_brown: 1.5 }[a.eyes] || 0;
  d += { burn: -0.5, burn_then_tan: 0, tan: 0.5 }[a.sun] || 0;

  // Clarity: negative = soft/muted, positive = bright/clear.
  var c = 0;
  c += { bright: 1, ivory: -0.5, both: 0 }[a.white] || 0;
  c += { bright_blue: 1.5, green: 0.5, light_blue_gray: 0, hazel: -1, light_brown: -0.5, dark_brown: 0, black_brown: 0.5 }[a.eyes] || 0;
  c += { ash: -1, light_brown: -1, medium_brown: -0.5, black: 1 }[a.hair] || 0;
  // High contrast between dark hair and light eyes reads as bright.
  if ((a.hair === 'black' || a.hair === 'dark_brown') && (a.eyes === 'bright_blue' || a.eyes === 'light_blue_gray' || a.eyes === 'green')) c += 1.5;

  var warm = t > 0 || (t === 0 && (a.hair === 'golden' || a.hair === 'red'));
  var strongest = [['depth', Math.abs(d)], ['clarity', Math.abs(c)]].sort(function (x, y) { return y[1] - x[1]; })[0];

  if (Math.abs(t) >= 2.5 && strongest[1] < 2) return warm ? (d > 0 ? 'True Autumn' : 'True Spring') : (d > 0.5 ? 'True Winter' : 'True Summer');
  if (strongest[0] === 'depth') {
    if (d <= -1) return warm ? 'Light Spring' : 'Light Summer';
    if (d >= 1) return warm ? 'Deep Autumn' : 'Deep Winter';
  } else {
    if (c >= 1) return warm ? 'Bright Spring' : 'Bright Winter';
    if (c <= -1) return warm ? 'Soft Autumn' : 'Soft Summer';
  }
  return warm ? (d > 0 ? 'True Autumn' : 'True Spring') : (d > 0.5 ? 'True Winter' : 'True Summer');
}

function reasonFor(season, a) {
  var s = SEASONS[season];
  var temp = s.family === 'Spring' || s.family === 'Autumn' ? 'warm' : 'cool';
  var first = 'Your ' + LABELS.veins[a.veins] + ', your pull toward ' + LABELS.jewelry[a.jewelry] + ' and ' + LABELS.white[a.white] + ' point to a ' + temp + ' undertone.';
  var second = 'Paired with your ' + LABELS.hair[a.hair] + ' and ' + LABELS.eyes[a.eyes] + ', that places you in ' + season + ': ' + s.summary.charAt(0).toLowerCase() + s.summary.slice(1);
  return first + ' ' + second;
}

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

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var a = {};
    ['veins', 'jewelry', 'sun', 'hair', 'eyes', 'white'].forEach(function (k) { a[k] = fd.get(k); });
    var season = pickSeason(a);
    var result = { season: season, reason: reasonFor(season, a), answers: a, at: new Date().toISOString() };
    save(result);
    track('intake_completed');
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Bella is reading your answers…';
    var next = 'result.html';
    if (supabase && user) {
      var ins = await supabase.from('analyses').insert({
        season: season, reason: result.reason, answers: a, method: 'quiz',
        research_consent: fd.get('consent-research') === 'on',
      }).select('id').single();
      if (ins.error) { console.error(ins.error); next = 'result.html?unsaved=1'; }
      else next = 'result.html?id=' + ins.data.id;
    }
    setTimeout(function () { window.location.href = next; }, 600);
  });
}

// Result page: a saved result from the account, or the last one kept on this phone.
var out = document.querySelector('[data-result]');
if (out) {
  var params = new URLSearchParams(location.search);
  var r = null, savedNote = '';
  var signedIn = await currentUser();
  if (params.get('id') && supabase) {
    var got = await supabase.from('analyses').select('*').eq('id', params.get('id')).maybeSingle();
    if (got.data) r = { season: got.data.season, reason: got.data.reason, note: got.data.team_note };
  }
  if (!r) r = load();
  if (params.get('id') && r) savedNote = 'Saved to <a href="account.html">your account</a> — log in from any phone to see it again.';
  else if (params.get('unsaved')) savedNote = 'We couldn\'t save this to your account just now, but it\'s kept on this phone. Try again later from <a href="start-your-analysis.html">the quiz</a>.';
  else if (accountsOn && !signedIn) savedNote = 'Kept on this phone. <a href="account.html?mode=signup">Create a free account</a> to save it and open it from any phone.';
  else if (accountsOn) savedNote = 'Kept on this phone. Your saved results are in <a href="account.html">your account</a>.';
  else savedNote = 'Your result is kept on this phone — come back to this page any time.';

  if (!r || !SEASONS[r.season]) {
    out.innerHTML = '<div class="empty-state"><h3>No result yet</h3><p>Take the six-question quiz to get your season.</p><p style="margin-top:18px;"><a class="btn-primary" href="start-your-analysis.html">Start your analysis →</a></p></div>';
  } else {
    var s = SEASONS[r.season];
    out.innerHTML =
      '<p class="eyebrow">Your season</p>' +
      '<h1 class="page-title">' + esc(r.season) + '</h1>' +
      '<p class="lede">' + esc(r.reason) + '</p>' +
      (PALETTES_ARE_PLACEHOLDER ? '<p class="example-flag" style="margin-top:18px;">Pilot palette — Bella\'s final shades coming soon</p>' : '') +
      (r.note ? '<div class="card" style="margin-top:22px;"><strong>Note from The Color Code team</strong><p style="margin-top:6px;">' + esc(r.note) + '</p></div>' : '') +
      '<section class="result-block"><h2 class="section-title">Colors to wear</h2><div class="swatch-grid">' + swatches(s.wear) + '</div></section>' +
      '<section class="result-block"><h2 class="section-title">A few to avoid</h2><div class="swatch-grid">' + swatches(s.avoid) + '</div></section>' +
      '<section class="result-block"><h2 class="section-title">Your makeup shades</h2>' +
        '<h3 class="result-sub">Lip</h3><div class="swatch-grid">' + swatches(s.lip) + '</div>' +
        '<h3 class="result-sub">Blush</h3><div class="swatch-grid">' + swatches(s.blush) + '</div>' +
        '<h3 class="result-sub">Eye</h3><div class="swatch-grid">' + swatches(s.eye) + '</div></section>' +
      '<section class="result-block"><p class="form-note">' + savedNote + '</p>' +
      '<p style="margin-top:18px;"><a class="btn-primary" href="start-your-analysis.html">Retake the quiz</a></p></section>';
  }
}
