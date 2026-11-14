// The Color Code — email list sign-up form. Writes to our customer record (the
// `customers` table, see supabase/crm.sql) through join_customer_list(), which adds
// today's date and refuses anything without a ticked consent box. Browsers can't
// read the list; only the team can, from Supabase.
import { supabase } from './supabase-client.js';
import { visitorId, firstTag, firstReferrer } from './track.js';

// Where they came from, in one plain word: the link tag if they arrived with one,
// otherwise the site that sent them, otherwise "direct".
function source() {
  var tag = firstTag();
  if (tag.utm_source) return String(tag.utm_source).toLowerCase().slice(0, 60);
  var host = firstReferrer();
  if (!host) return 'direct';
  var known = [['instagram', 'instagram'], ['tiktok', 'tiktok'], ['google', 'google'], ['bing', 'bing'],
    ['groupme', 'groupme'], ['facebook', 'facebook'], ['t.co', 'x'], ['twitter', 'x'], ['x.com', 'x'],
    ['reddit', 'reddit'], ['youtube', 'youtube'], ['linkedin', 'linkedin'], ['chatgpt', 'chatgpt'],
    ['perplexity', 'perplexity'], ['tulane', 'tulane']];
  for (var i = 0; i < known.length; i++) if (host.indexOf(known[i][0]) !== -1) return known[i][1];
  return host.slice(0, 60);
}

document.querySelectorAll('[data-email-signup]').forEach(function (form) {
  var status = form.querySelector('[data-signup-status]');
  var button = form.querySelector('button[type="submit"]');
  function say(text, ok) { status.textContent = text; status.className = 'signup-status ' + (ok ? 'ok' : 'err'); }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    if (!form.elements.consent.checked) { say('Please tick the box to agree to receive our emails.', false); return; }
    if (!name || !form.elements.email.checkValidity()) { say('Please enter your name and a valid email.', false); return; }
    if (!supabase) { say("Sorry, we couldn't save that just now. Please try again in a minute.", false); return; }

    button.disabled = true;
    var tag = firstTag();
    var res = await supabase.rpc('join_customer_list', {
      p_name: name, p_email: email, p_consent: true, p_source: source(),
      p_utm_source: tag.utm_source, p_utm_medium: tag.utm_medium, p_utm_campaign: tag.utm_campaign,
      p_referrer: firstReferrer(), p_visitor_id: visitorId(),
    });
    button.disabled = false;
    if (res.error) {
      console.error('[signup]', res.error);
      say("Sorry, we couldn't save that just now. Please check your email address and try again.", false);
      return;
    }
    if (window.trackEvent) window.trackEvent('email_signup');
    form.reset();
    say('Thank you, ' + name + "! You're on our email list.", true);
  });
});
