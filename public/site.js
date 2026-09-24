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

// ---------- Accounts ----------

var STATUS_LABELS = {
  received: 'Received — our team is working on your palette',
  ready: 'Your palette is ready',
};

// Resolves to { user, submissions } when signed in, or null.
var accountPromise = null;
function loadAccount() {
  if (!accountPromise) {
    accountPromise = fetch('/api/me', { credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; });
  }
  return accountPromise;
}

// Only allow redirects back to our own pages.
function nextPage(fallback) {
  var next = new URLSearchParams(window.location.search).get('next');
  return next && /^[\w-]+\.html$/.test(next) ? next : fallback;
}

function showError(form, message) {
  var box = form.querySelector('[data-form-error]');
  if (!box) return;
  box.textContent = message;
  box.hidden = !message;
}

function setBusy(form, busy, label) {
  var button = form.querySelector('button[type="submit"]');
  if (!button) return;
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = busy;
  button.textContent = busy ? label : button.dataset.label;
}

// Returns the first unfilled required field's message, or '' when the form is complete.
function missingRequired(form) {
  var fields = form.querySelectorAll('[required]');
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var empty = field.type === 'checkbox' ? !field.checked : !field.value.trim();
    if (empty) {
      field.focus();
      if (field.type === 'checkbox') return 'Please tick the required box to continue.';
      if (field.type === 'file') return 'Please add your photo.';
      return 'Please fill in every required field.';
    }
  }
  return '';
}

// Clear a stale error as soon as the person starts fixing the form.
function clearErrorOnEdit(form) {
  var clear = function () { showError(form, ''); };
  form.addEventListener('input', clear);
  form.addEventListener('change', clear);
}

function postJson(url, data) {
  return fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  }).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (body) {
      if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
      return body;
    });
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function initAccountLink() {
  var link = document.querySelector('[data-account-link]');
  if (!link) return;
  loadAccount().then(function (account) {
    if (account) link.textContent = 'My Analysis';
  });
}

function initAuthForm() {
  var form = document.querySelector('[data-auth-form]');
  if (!form) return;
  var mode = form.getAttribute('data-auth-form');
  clearErrorOnEdit(form);

  // Carry ?next= across the sign-in / create-account links.
  var next = new URLSearchParams(window.location.search).get('next');
  if (next) {
    form.querySelectorAll('[data-keep-next]').forEach(function (a) {
      a.href = a.getAttribute('href') + '?next=' + encodeURIComponent(next);
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var missing = missingRequired(form);
    if (missing) return showError(form, missing);
    showError(form, '');
    setBusy(form, true, mode === 'signup' ? 'Creating your account…' : 'Signing in…');

    var data = {
      email: form.email.value,
      password: form.password.value,
    };
    if (mode === 'signup') {
      data.name = form.name.value;
      data.age_confirmed = form.age_confirmed.checked;
    }

    postJson(mode === 'signup' ? '/api/signup' : '/api/login', data)
      .then(function () {
        trackEvent(mode === 'signup' ? 'account_created' : 'signed_in');
        window.location.href = nextPage('my-analysis.html');
      })
      .catch(function (err) {
        setBusy(form, false);
        showError(form, err.message);
      });
  });
}

function initIntakeForm() {
  var intakeForm = document.querySelector('[data-intake-form]');
  if (!intakeForm) return;
  var signedOut = document.querySelector('[data-signed-out]');
  var submitted = document.querySelector('[data-submitted]');
  clearErrorOnEdit(intakeForm);

  loadAccount().then(function (account) {
    if (!account) {
      signedOut.hidden = false;
      return;
    }
    intakeForm.hidden = false;
    intakeForm.querySelector('[data-signed-in-as]').textContent =
      'Signed in as ' + account.user.email + '.';
  });

  var started = false;
  intakeForm.addEventListener('focusin', function () {
    if (!started) {
      started = true;
      trackEvent('intake_started');
    }
  });

  intakeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var missing = missingRequired(intakeForm);
    if (missing) return showError(intakeForm, missing);
    var photo = intakeForm.photo.files[0];
    if (photo && photo.size > 10 * 1024 * 1024) {
      return showError(intakeForm, 'That photo is over 10 MB. Please choose a smaller one.');
    }
    showError(intakeForm, '');
    setBusy(intakeForm, true, 'Uploading…');

    fetch('/api/submissions', {
      method: 'POST',
      credentials: 'same-origin',
      body: new FormData(intakeForm),
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
        });
      })
      .then(function () {
        trackEvent('intake_completed');
        intakeForm.hidden = true;
        submitted.hidden = false;
        submitted.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function (err) {
        setBusy(intakeForm, false);
        showError(intakeForm, err.message);
      });
  });
}

function initDashboard() {
  var dashboard = document.querySelector('[data-dashboard]');
  if (!dashboard) return;

  loadAccount().then(function (account) {
    if (!account) {
      window.location.replace('sign-in.html?next=my-analysis.html');
      return;
    }
    dashboard.hidden = false;
    dashboard.querySelector('[data-greeting]').textContent = 'Hi, ' + account.user.name.split(' ')[0] + '.';
    dashboard.querySelector('[data-account-email]').textContent = 'Signed in as ' + account.user.email;

    var list = dashboard.querySelector('[data-submission-list]');
    if (!account.submissions.length) {
      dashboard.querySelector('[data-no-submissions]').hidden = false;
      return;
    }
    account.submissions.forEach(function (s) {
      var card = document.createElement('article');
      card.className = 'card submission-card';

      var img = document.createElement('img');
      img.src = '/api/submissions/' + encodeURIComponent(s.id) + '/photo';
      img.alt = 'The photo you submitted';
      img.className = 'submission-photo';
      img.loading = 'lazy';

      var info = document.createElement('div');
      var title = document.createElement('h3');
      title.textContent = 'Analysis submitted ' + formatDate(s.created_at);
      var status = document.createElement('p');
      status.className = 'status-pill status-' + s.status;
      status.textContent = STATUS_LABELS[s.status] || s.status;
      var note = document.createElement('p');
      note.className = 'form-note';
      note.textContent = s.status === 'ready'
        ? ''
        : "We'll show your season and palette right here as soon as it's ready.";
      info.appendChild(title);
      info.appendChild(status);
      info.appendChild(note);

      card.appendChild(img);
      card.appendChild(info);
      list.appendChild(card);
    });
  });

  dashboard.querySelector('[data-sign-out]').addEventListener('click', function () {
    postJson('/api/logout').finally(function () {
      window.location.href = 'index.html';
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  trackEvent('page_view', { path: window.location.pathname });

  initAccountLink();
  initAuthForm();
  initIntakeForm();
  initDashboard();

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
