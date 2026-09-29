// The Color Code — shared Supabase client for every page.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export var accountsOn = /^https:\/\//.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20;
export var supabase = null;

if (accountsOn) {
  try {
    var mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error('Could not load Supabase', e);
  }
}

export async function currentUser() {
  if (!supabase) return null;
  var res = await supabase.auth.getSession();
  return res.data.session ? res.data.session.user : null;
}

export async function isTeam() {
  if (!supabase) return false;
  var res = await supabase.rpc('is_team');
  return res.data === true;
}

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
