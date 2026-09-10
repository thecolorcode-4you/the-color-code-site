// The Color Code — light JS only, per WEBSITE-BRAINSTORM.md Decision 12 (plain HTML/CSS + light JS).
//
// Funnel-event stub per Decision 14: instruments the events research-analytics asked for
// (PREPARE-WEBSITE.md) now, gated behind consent, so a real analytics account can be plugged
// in later without re-instrumenting. No real analytics account exists yet — this only logs
// locally. TODO: research-analytics (Sofia) to confirm exact event names/taxonomy, and
// web-development to wire a real provider once a human sets one up (Decision 10).

function hasAnalyticsConsent() {
  try {
    return localStorage.getItem('tcc_analytics_consent') === 'true';
  } catch (e) {
    return false;
  }
}

function trackEvent(name, detail) {
  if (!hasAnalyticsConsent()) return;
  // TODO: replace with a real analytics call once a provider account exists (Decision 10, 14).
  console.log('[analytics stub]', name, detail || {});
}

document.addEventListener('DOMContentLoaded', function () {
  trackEvent('page_view', { path: window.location.pathname });

  var intakeForm = document.querySelector('[data-intake-form]');
  if (intakeForm) {
    var started = false;
    intakeForm.addEventListener('focusin', function () {
      if (!started) {
        started = true;
        trackEvent('intake_started');
      }
    });
    intakeForm.addEventListener('submit', function (e) {
      e.preventDefault();
      trackEvent('intake_completed');
      var note = intakeForm.querySelector('[data-preview-note]');
      if (note) note.hidden = false;
    });
  }

  var reviewForm = document.querySelector('[data-review-form]');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      trackEvent('review_submitted');
      var note = reviewForm.querySelector('[data-preview-note]');
      if (note) note.hidden = false;
    });
  }
});
