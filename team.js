// The Color Code — team screen: every result and every set of answers, with a reply box.
import { supabase, currentUser, isTeam, esc } from './supabase-client.js';
import { LABELS } from './analysis.js';

var root = document.querySelector('[data-team]');
var user = await currentUser();
if (!supabase || !user) {
  root.innerHTML = '<h1 class="page-title">Team screen</h1><p class="lede">Log in with your team account to see customer results.</p><p style="margin-top:18px;"><a class="btn-primary" href="account.html?mode=login&next=team.html">Log in</a></p>';
} else if (!(await isTeam())) {
  root.innerHTML = '<h1 class="page-title">Team screen</h1><p class="lede">This page is only for The Color Code team.</p>';
} else {
  var res = await supabase.from('analyses').select('*').order('created_at', { ascending: false });
  var rows = res.data || [];
  var counts = {};
  rows.forEach(function (r) { counts[r.season] = (counts[r.season] || 0) + 1; });
  var customers = new Set(rows.map(function (r) { return r.user_id; })).size;
  root.innerHTML = '<p class="eyebrow">Team only</p><h1 class="page-title">Every result</h1>' +
    '<p class="lede">' + rows.length + ' results from ' + customers + ' customers. ' + rows.filter(function (r) { return r.research_consent; }).length + ' said yes to research.</p>' +
    '<div class="season-counts">' + Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).map(function (k) { return '<span>' + esc(k) + ' <strong>' + counts[k] + '</strong></span>'; }).join('') + '</div>' +
    rows.map(function (r) {
      var ans = Object.keys(LABELS).map(function (k) { return '<li>' + esc((LABELS[k] && LABELS[k][r.answers[k]]) || r.answers[k] || '—') + '</li>'; }).join('');
      return '<div class="card team-row"><div class="team-row-head"><strong>' + esc(r.season) + '</strong><span class="form-note">' + new Date(r.created_at).toLocaleString() + '</span></div>' +
        '<p class="form-note">' + esc(r.email) + (r.research_consent ? ' · research OK' : '') + '</p>' +
        '<ul class="team-answers">' + ans + '</ul>' +
        '<label class="form-note" for="n-' + r.id + '">Reply to customer (shows on her result)</label>' +
        '<textarea id="n-' + r.id + '" data-note="' + r.id + '">' + esc(r.team_note) + '</textarea>' +
        '<button class="btn-small" type="button" data-save="' + r.id + '">Save reply</button> <span class="form-note" data-saved="' + r.id + '"></span></div>';
    }).join('');
  root.addEventListener('click', async function (e) {
    var id = e.target.getAttribute('data-save');
    if (!id) return;
    var text = root.querySelector('[data-note="' + id + '"]').value.trim() || null;
    var up = await supabase.from('analyses').update({ team_note: text }).eq('id', id);
    root.querySelector('[data-saved="' + id + '"]').textContent = up.error ? 'Could not save' : 'Saved';
  });
}
