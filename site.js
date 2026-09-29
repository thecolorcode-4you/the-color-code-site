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

// Installable app: register the service worker and show an "Add to Home Screen" prompt.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
}

(function () {
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) return;
  var dismissed = false;
  try { dismissed = localStorage.getItem('tcc_install_dismissed') === '1'; } catch (e) {}
  if (dismissed) return;

  var deferred = null;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function show(html, onInstall) {
    if (document.querySelector('.install-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'install-bar';
    bar.innerHTML = '<img src="/assets/icon-192.png" alt=""><div class="install-text">' + html + '</div>' +
      (onInstall ? '<button type="button" class="install-go">Install</button>' : '') +
      '<button type="button" class="install-x" aria-label="Close">×</button>';
    document.body.appendChild(bar);
    bar.querySelector('.install-x').addEventListener('click', function () {
      bar.remove();
      try { localStorage.setItem('tcc_install_dismissed', '1'); } catch (e) {}
    });
    if (onInstall) bar.querySelector('.install-go').addEventListener('click', onInstall);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    show('<strong>Get The Color Code app</strong>Free — opens from your home screen.', function () {
      deferred.prompt();
      deferred.userChoice.finally(function () { var b = document.querySelector('.install-bar'); if (b) b.remove(); });
    });
  });

  if (isIOS) {
    document.addEventListener('DOMContentLoaded', function () {
      show('<strong>Get The Color Code app</strong>Tap <span class="ios-share" aria-label="Share">Share ⬆︎</span> then <b>Add to Home Screen</b>.');
    });
  }
})();
