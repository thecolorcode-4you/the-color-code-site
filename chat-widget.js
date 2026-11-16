// The Color Code — customer-service chat box (talks to /api/chat; see src/chat.js).
// The panel is only built when someone opens it, so it costs nothing on page load.
(function () {
  var GREETING = "Hi! I'm The Color Code's automated assistant, not a person. I can answer questions using our FAQ and Pricing pages. What would you like to know?";
  var history = [];
  var conv = null;
  var panel, log, form, input, sendBtn;

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'c' + Date.now().toString(16) + Math.random().toString(16).slice(2, 12);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function addBubble(role, text) {
    var b = el('div', 'chat-msg ' + (role === 'user' ? 'chat-user' : 'chat-bot'), text);
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  function offerHandoff(question) {
    if (log.querySelector('.chat-handoff:not([data-done])')) return;
    var box = el('form', 'chat-handoff');
    box.appendChild(el('p', null, 'Want a person on our team to answer by email? We use your email only to reply to this question.'));
    var row = el('div', 'chat-handoff-row');
    var email = el('input');
    email.type = 'email'; email.required = true; email.placeholder = 'Your email'; email.setAttribute('aria-label', 'Your email'); email.autocomplete = 'email';
    var go = el('button', null, 'Send to a person');
    go.type = 'submit';
    row.appendChild(email); row.appendChild(go);
    box.appendChild(row);
    box.addEventListener('submit', async function (e) {
      e.preventDefault();
      go.disabled = true;
      try {
        var res = await fetch('/api/chat/handoff', { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ conversation_id: conv, email: email.value, question: question }) });
        if (!res.ok) throw new Error('bad');
        box.setAttribute('data-done', '1');
        box.textContent = 'Thanks! A person on our team will reply by email.';
        if (window.trackEvent) window.trackEvent('chat_handoff');
      } catch (err) {
        go.disabled = false;
        box.querySelector('p').textContent = "Sorry, that didn't go through. Check your email address, or message us on Instagram at @thecolorcode.collective.";
      }
    });
    log.appendChild(box);
    log.scrollTop = log.scrollHeight;
  }

  async function send(text) {
    history.push({ role: 'user', content: text });
    addBubble('user', text);
    var wait = addBubble('bot', '…');
    wait.setAttribute('aria-label', 'The assistant is typing');
    sendBtn.disabled = true;
    var reply = "Sorry, I can't answer right now. You can read our FAQ, or ask for a person below.";
    var handoff = true;
    try {
      var res = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversation_id: conv, messages: history }) });
      var data = await res.json();
      if (data && data.reply) { reply = data.reply; handoff = !!data.handoff; }
    } catch (e) {}
    wait.textContent = reply;
    wait.removeAttribute('aria-label');
    history.push({ role: 'assistant', content: reply });
    sendBtn.disabled = false;
    if (handoff) offerHandoff(text);
  }

  function build() {
    conv = newId();
    panel = el('section', 'chat-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with our automated assistant');
    var head = el('div', 'chat-head');
    var title = el('div');
    title.appendChild(el('strong', null, 'Questions? Ask our assistant'));
    title.appendChild(el('span', null, 'Automated, answers from our FAQ and Pricing pages'));
    var close = el('button', 'chat-close', '×');
    close.type = 'button'; close.setAttribute('aria-label', 'Close chat');
    close.addEventListener('click', function () { panel.hidden = true; toggle.hidden = false; toggle.focus(); });
    head.appendChild(title); head.appendChild(close);
    log = el('div', 'chat-log');
    log.setAttribute('aria-live', 'polite');
    form = el('form', 'chat-form');
    input = el('input');
    input.type = 'text'; input.maxLength = 600; input.placeholder = 'Type your question'; input.setAttribute('aria-label', 'Your question'); input.autocomplete = 'off';
    sendBtn = el('button', null, 'Send');
    sendBtn.type = 'submit';
    form.appendChild(input); form.appendChild(sendBtn);
    var note = el('p', 'chat-note', "Please don't share passwords or payment details. Chats are saved without names or emails.");
    panel.appendChild(head); panel.appendChild(log); panel.appendChild(form); panel.appendChild(note);
    document.body.appendChild(panel);
    addBubble('bot', GREETING);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || sendBtn.disabled) return;
      input.value = '';
      send(text);
    });
    if (window.trackEvent) window.trackEvent('chat_opened');
  }

  var toggle = el('button', 'chat-toggle', 'Questions? Chat');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Open chat with our automated assistant');
  toggle.addEventListener('click', function () {
    if (!panel) build();
    panel.hidden = false; toggle.hidden = true; input.focus();
  });
  document.body.appendChild(toggle);
})();
