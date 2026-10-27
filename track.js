// The Color Code — our own first-party usage tracker. Writes directly to the
// `events` table in our Supabase project (see supabase/schema.sql). No cookies,
// no third-party analytics tool. See ceo/analytics/KPI-PLAN.md and QUERIES.md.
//
// visitor_id is a random id kept in this browser's localStorage — not tied to a
// person until they create an account, at which point account.js attaches it
// (and the first link tag below) to their user record.
import { supabase } from './supabase-client.js';

var VISITOR_KEY = 'tcc_visitor_id';
var TAG_KEY = 'tcc_first_tag';

function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function visitorId() {
  try {
    var id = localStorage.getItem(VISITOR_KEY);
    if (!id) { id = uuid(); localStorage.setItem(VISITOR_KEY, id); }
    return id;
  } catch (e) {
    return uuid(); // storage blocked: this page view still gets tracked, just not linked to the next one
  }
}

// The first utm_source/medium/campaign this visitor ever arrived with — kept
// even once they browse on to pages that don't have the tag in the address.
export function firstTag() {
  var params = new URLSearchParams(location.search);
  var seen = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
  var hasTag = seen.utm_source || seen.utm_medium || seen.utm_campaign;
  try {
    var stored = JSON.parse(localStorage.getItem(TAG_KEY) || 'null');
    if (stored) return stored;
    if (hasTag) { localStorage.setItem(TAG_KEY, JSON.stringify(seen)); return seen; }
  } catch (e) {
    if (hasTag) return seen; // storage blocked: still use it for this one page view
  }
  return { utm_source: null, utm_medium: null, utm_campaign: null };
}

function device() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'phone' : 'computer';
}

window.trackEvent = function (name) {
  if (!supabase) return; // no Supabase project connected yet — see config.js
  var tag = firstTag();
  supabase.from('events').insert({
    visitor_id: visitorId(),
    event: name,
    page: location.pathname,
    source: document.referrer ? new URL(document.referrer).hostname : null,
    utm_source: tag.utm_source,
    utm_medium: tag.utm_medium,
    utm_campaign: tag.utm_campaign,
    device: device(),
  }).then(function (res) { if (res.error) console.error('[track]', res.error); });
};

// Even without storage, a tag in the address keeps working as long as it's
// carried forward from link to link — so copy it onto every link to the
// sign-up page that doesn't already specify its own tag.
function propagateTag() {
  var tag = firstTag();
  if (!tag.utm_source && !tag.utm_medium && !tag.utm_campaign) return;
  document.querySelectorAll('a[href^="account.html"]').forEach(function (a) {
    var url = new URL(a.getAttribute('href'), location.href);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
      if (!url.searchParams.get(k) && tag[k]) url.searchParams.set(k, tag[k]);
    });
    a.setAttribute('href', url.pathname + '?' + url.searchParams.toString() + url.hash);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  window.trackEvent('page_view');
  propagateTag();

  // Reviews open after the pilot (customer-reviews.html); this records interest
  // and confirms receipt until feedback-learning wires the real submit.
  var reviewForm = document.querySelector('[data-review-form]');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      window.trackEvent('review_submitted');
      var note = reviewForm.querySelector('[data-preview-note]');
      if (note) note.hidden = false;
    });
  }
});
