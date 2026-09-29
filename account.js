// The Color Code — sign up, log in, forgot password, reset password, and "My palettes".
import { accountsOn, supabase, currentUser, isTeam, esc } from './supabase-client.js';

var root = document.querySelector('[data-account]');
var resetRoot = document.querySelector('[data-reset]');
var params = new URLSearchParams(location.search);
var next = params.get('next');
if (!next || !/^[a-z0-9-]+\.html$/i.test(next)) next = 'account.html';
var base = location.origin + '/';

function msg(el, text, bad) {
  el.innerHTML = '<p class="form-msg' + (bad ? ' bad' : '') + '">' + text + '</p>';
}
function friendly(err) {
  var m = (err && err.message) || 'Something went wrong. Please try again.';
  if (/invalid login/i.test(m)) return 'That email and password don\'t match. Try again, or reset your password below.';
  if (/already registered/i.test(m)) return 'There\'s already an account with that email. Log in instead.';
  if (/rate limit/i.test(m)) return 'Too many emails sent just now. Please wait a few minutes and try again.';
  if (/email not confirmed/i.test(m)) return 'Please confirm your email first — check your inbox for the link we sent.';
  return esc(m);
}

function authForms(mode) {
  var title = { signup: 'Create your free account', login: 'Log in', forgot: 'Reset your password' }[mode];
  var btn = { signup: 'Create free account', login: 'Log in', forgot: 'Email me a reset link' }[mode];
  root.innerHTML =
    '<p class="eyebrow">My Account</p><h1 class="page-title">' + title + '</h1>' +
    (mode === 'signup' ? '<p class="lede">Free during the Tulane pilot. Your palette is saved here, and you can open it from any phone.</p>' : '') +
    (mode === 'forgot' ? '<p class="lede">Enter the email you signed up with and we\'ll send you a link to choose a new password.</p>' : '') +
    '<form class="form-block" data-auth-form>' +
      '<div class="field"><label for="email">Email</label><input type="email" id="email" name="email" autocomplete="email" required></div>' +
      (mode !== 'forgot' ? '<div class="field"><label for="password">Password</label><input type="password" id="password" name="password" minlength="6" autocomplete="' + (mode === 'signup' ? 'new-password' : 'current-password') + '" required>' + (mode === 'signup' ? '<p class="form-note" style="margin-top:6px;">At least 6 characters.</p>' : '') + '</div>' : '') +
      '<div><button class="btn-primary" type="submit">' + btn + '</button></div><div data-auth-msg></div>' +
    '</form>' +
    '<p class="auth-links">' +
      (mode !== 'login' ? '<a href="?mode=login&next=' + next + '">Log in</a>' : '') +
      (mode !== 'signup' ? '<a href="?mode=signup&next=' + next + '">Create a free account</a>' : '') +
      (mode !== 'forgot' ? '<a href="?mode=forgot">Forgot password?</a>' : '') +
    '</p>';

  var f = root.querySelector('[data-auth-form]');
  var out = root.querySelector('[data-auth-msg]');
  f.addEventListener('submit', async function (e) {
    e.preventDefault();
    var b = f.querySelector('button');
    b.disabled = true;
    var email = f.email.value.trim();
    var res;
    if (mode === 'signup') {
      res = await supabase.auth.signUp({ email: email, password: f.password.value, options: { emailRedirectTo: base + next } });
      if (!res.error && !res.data.session) {
        msg(out, 'Almost done — we sent a confirmation link to <strong>' + esc(email) + '</strong>. Open it on this phone to finish creating your account.');
        b.disabled = false; return;
      }
    } else if (mode === 'login') {
      res = await supabase.auth.signInWithPassword({ email: email, password: f.password.value });
    } else {
      res = await supabase.auth.resetPasswordForEmail(email, { redirectTo: base + 'reset-password.html' });
      if (!res.error) { msg(out, 'If there\'s an account for <strong>' + esc(email) + '</strong>, a reset link is on its way. Check your inbox (and spam).'); b.disabled = false; return; }
    }
    if (res.error) { msg(out, friendly(res.error), true); b.disabled = false; return; }
    location.href = next;
  });
}

async function myPalettes(user) {
  var team = await isTeam();
  root.innerHTML = '<p class="eyebrow">My Account</p><h1 class="page-title">My palettes</h1>' +
    '<p class="lede">Signed in as <strong>' + esc(user.email) + '</strong>.</p>' +
    (team ? '<p style="margin-top:14px;"><a class="btn-primary" href="team.html">Open the team screen</a></p>' : '') +
    '<div data-list style="margin-top:28px;"><p class="form-note">Loading…</p></div>' +
    '<p class="auth-links" style="margin-top:32px;"><a href="start-your-analysis.html">Take the quiz again</a><a href="#" data-logout>Log out</a></p>';
  root.querySelector('[data-logout]').addEventListener('click', async function (e) {
    e.preventDefault();
    await supabase.auth.signOut();
    location.href = 'index.html';
  });
  var res = await supabase.from('analyses').select('id, created_at, season, reason, team_note').eq('user_id', user.id).order('created_at', { ascending: false });
  var list = root.querySelector('[data-list]');
  if (res.error) { list.innerHTML = '<p class="form-msg bad">We couldn\'t load your palettes. Please refresh.</p>'; return; }
  if (!res.data.length) {
    list.innerHTML = '<div class="empty-state"><h3>No palettes yet</h3><p>Take the seven-question quiz — your result will be saved here.</p><p style="margin-top:18px;"><a class="btn-primary" href="start-your-analysis.html">Start your analysis →</a></p></div>';
    return;
  }
  list.innerHTML = res.data.map(function (r) {
    return '<a class="card palette-row" href="result.html?id=' + r.id + '"><span class="palette-season">' + esc(r.season) + '</span>' +
      '<span class="form-note">' + new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + '</span>' +
      (r.team_note ? '<span class="palette-note">New note from our team</span>' : '') + '</a>';
  }).join('');
}

async function resetPage() {
  // Supabase signs the person in from the emailed link, then they choose a new password.
  await new Promise(function (r) { setTimeout(r, 400); });
  var user = await currentUser();
  if (!user) {
    resetRoot.innerHTML = '<p class="eyebrow">My Account</p><h1 class="page-title">This link has expired</h1><p class="lede">Reset links only work once and for a short time.</p><p style="margin-top:18px;"><a class="btn-primary" href="account.html?mode=forgot">Send a new link</a></p>';
    return;
  }
  resetRoot.innerHTML = '<p class="eyebrow">My Account</p><h1 class="page-title">Choose a new password</h1>' +
    '<form class="form-block" data-new-pw><div class="field"><label for="pw">New password</label><input type="password" id="pw" minlength="6" autocomplete="new-password" required><p class="form-note" style="margin-top:6px;">At least 6 characters.</p></div>' +
    '<div><button class="btn-primary" type="submit">Save new password</button></div><div data-auth-msg></div></form>';
  var f = resetRoot.querySelector('[data-new-pw]');
  f.addEventListener('submit', async function (e) {
    e.preventDefault();
    var res = await supabase.auth.updateUser({ password: f.pw.value });
    if (res.error) msg(f.querySelector('[data-auth-msg]'), friendly(res.error), true);
    else { msg(f.querySelector('[data-auth-msg]'), 'Password saved. Taking you to your palettes…'); setTimeout(function () { location.href = 'account.html'; }, 1200); }
  });
}

var off = '<p class="eyebrow">My Account</p><h1 class="page-title">Accounts are coming soon</h1><p class="lede">For now your quiz result is kept on your phone.</p><p style="margin-top:18px;"><a class="btn-primary" href="start-your-analysis.html">Take the quiz</a></p>';
if (root) {
  if (!accountsOn || !supabase) root.innerHTML = off;
  else {
    var u = await currentUser();
    if (u) myPalettes(u);
    else authForms(['signup', 'login', 'forgot'].indexOf(params.get('mode')) >= 0 ? params.get('mode') : 'login');
  }
}
if (resetRoot) {
  if (!accountsOn || !supabase) resetRoot.innerHTML = off;
  else resetPage();
}
