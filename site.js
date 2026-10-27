// The Color Code — light JS only, per WEBSITE-BRAINSTORM.md Decision 12 (plain HTML/CSS + light JS).
// Usage tracking lives in track.js now (our own Supabase events table, not a stub).

// Installable app: register the service worker and show an "Add to Home Screen" prompt.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
}

(function () {
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) return;
  // Only offer the app after she has seen her result, not before she's tried anything.
  if (!/\/(result|account)\.html$/.test(location.pathname)) return;
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
