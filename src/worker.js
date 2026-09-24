// The Color Code — backend for accounts and analysis submissions.
//
// Static pages in /public are served directly by Cloudflare. Only /api/* requests reach this
// Worker (see run_worker_first in wrangler.jsonc).
//
// Storage:
//   DB     (D1)  — users, sessions, submissions
//   PHOTOS (R2)  — uploaded analysis photos, never public; served only to the owner (and, in
//                  step 2, the team)

const SESSION_COOKIE = 'tcc_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000; // Workers' maximum for PBKDF2
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
// Bump whenever privacy-policy.html changes, so we know which version each person agreed to.
const PRIVACY_POLICY_VERSION = 'draft-2026-09-24';

// Draft questionnaire (pending Whitney's review). Keys must match the form in
// start-your-analysis.html. `options` lists the allowed answers; free-text questions omit it.
const QUESTIONS = {
  natural_hair: { required: true, options: ['platinum-light-blonde', 'golden-blonde', 'ash-dark-blonde', 'light-brown', 'medium-brown', 'dark-brown', 'black', 'red-auburn', 'gray-silver'] },
  hair_dyed: { required: true, options: ['no', 'yes'] },
  eye_color: { required: true, options: ['blue', 'gray', 'green', 'hazel', 'light-brown', 'dark-brown', 'black-brown', 'other'] },
  skin_depth: { required: true, options: ['fair', 'light', 'medium', 'tan', 'deep', 'very-deep'] },
  veins: { required: true, options: ['blue-purple', 'green-olive', 'mix-cant-tell'] },
  sun: { required: true, options: ['burn-rarely-tan', 'burn-then-tan', 'tan-rarely-burn', 'rarely-burn-or-tan'] },
  jewelry: { required: true, options: ['silver', 'gold', 'both', 'not-sure'] },
  white: { required: true, options: ['bright-white', 'cream', 'both', 'not-sure'] },
  compliment_colors: { required: false, maxLength: 300 },
  notes: { required: false, maxLength: 1000 },
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    photo_key TEXT NOT NULL,
    photo_type TEXT NOT NULL,
    answers TEXT NOT NULL,
    consent_analysis INTEGER NOT NULL,
    consent_research INTEGER NOT NULL,
    privacy_policy_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received',
    result TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS submissions_user ON submissions (user_id, created_at)`,
];

// Tables are created on first use, so the database needs no manual setup step.
let schemaReady = null;
function ensureSchema(env) {
  if (!schemaReady) {
    schemaReady = env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql))).catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }
    try {
      if (request.method !== 'GET' && !sameOrigin(request, url)) {
        return json({ error: 'Request blocked.' }, 403);
      }
      await ensureSchema(env);
      return await route(request, env, url);
    } catch (err) {
      console.error(err);
      return json({ error: 'Something went wrong on our end. Please try again.' }, 500);
    }
  },
};

async function route(request, env, url) {
  const { pathname } = url;
  const method = request.method;

  if (pathname === '/api/signup' && method === 'POST') return signup(request, env);
  if (pathname === '/api/login' && method === 'POST') return login(request, env);
  if (pathname === '/api/logout' && method === 'POST') return logout(request, env);
  if (pathname === '/api/me' && method === 'GET') return me(request, env);
  if (pathname === '/api/submissions' && method === 'POST') return createSubmission(request, env);

  const photoMatch = pathname.match(/^\/api\/submissions\/([\w-]+)\/photo$/);
  if (photoMatch && method === 'GET') return submissionPhoto(request, env, photoMatch[1]);

  return json({ error: 'Not found.' }, 404);
}

// ---------- Accounts ----------

async function signup(request, env) {
  const body = await readJson(request);
  const name = String(body.name || '').trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!name || name.length > 100) return json({ error: 'Please enter your name.' }, 400);
  if (!email) return json({ error: 'Please enter a valid email address.' }, 400);
  if (password.length < 8) return json({ error: 'Your password needs at least 8 characters.' }, 400);
  if (password.length > 200) return json({ error: 'That password is too long.' }, 400);
  if (body.age_confirmed !== true) return json({ error: 'You need to be 18 or older to create an account.' }, 400);

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return json({ error: 'An account with that email already exists. Try signing in instead.' }, 409);

  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt);
  const userId = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO users (id, email, name, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(userId, email, name, passwordHash, salt, now()).run();

  return withSession(env, userId, json({ ok: true }, 201));
}

async function login(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const failure = json({ error: "That email and password don't match an account." }, 401);
  if (!email || !password || password.length > 200) return failure;

  const user = await env.DB.prepare('SELECT id, password_hash, password_salt FROM users WHERE email = ?').bind(email).first();
  if (!user) return failure;
  const attempt = await hashPassword(password, user.password_salt);
  if (!timingSafeEqual(attempt, user.password_hash)) return failure;

  return withSession(env, user.id, json({ ok: true }));
}

async function logout(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
  }
  const res = json({ ok: true });
  res.headers.append('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}

async function me(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Not signed in.' }, 401);

  const { results } = await env.DB.prepare(
    'SELECT id, status, result, created_at, updated_at FROM submissions WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return json({
    user: { name: user.name, email: user.email, role: user.role },
    submissions: results.map((s) => ({
      id: s.id,
      status: s.status,
      result: s.result ? JSON.parse(s.result) : null,
      created_at: s.created_at,
      updated_at: s.updated_at,
    })),
  });
}

// ---------- Submissions ----------

async function createSubmission(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Please sign in to submit your analysis.' }, 401);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "We couldn't read that submission. Please try again." }, 400);
  }

  const photo = form.get('photo');
  if (!photo || typeof photo === 'string' || photo.size === 0) {
    return json({ error: 'Please add a photo.' }, 400);
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return json({ error: 'That photo is over 10 MB. Please choose a smaller one.' }, 400);
  }
  const photoType = (photo.type || '').toLowerCase();
  if (!PHOTO_TYPES.includes(photoType)) {
    return json({ error: 'Please upload a JPG, PNG, WebP or HEIC photo.' }, 400);
  }

  if (form.get('consent_analysis') !== 'yes') {
    return json({ error: 'Please agree to how your photo and answers will be used.' }, 400);
  }
  const consentResearch = form.get('consent_research') === 'yes';

  const answers = {};
  for (const [key, rule] of Object.entries(QUESTIONS)) {
    const value = String(form.get(key) || '').trim();
    if (!value) {
      if (rule.required) return json({ error: 'Please answer every question marked as required.' }, 400);
      continue;
    }
    if (rule.options && !rule.options.includes(value)) {
      return json({ error: 'One of your answers was not recognized. Please check the form.' }, 400);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return json({ error: 'One of your written answers is too long.' }, 400);
    }
    answers[key] = value;
  }

  const id = crypto.randomUUID();
  const photoKey = `photos/${id}`;
  await env.PHOTOS.put(photoKey, photo.stream(), { httpMetadata: { contentType: photoType } });

  const timestamp = now();
  try {
    await env.DB.prepare(
      `INSERT INTO submissions (id, user_id, photo_key, photo_type, answers, consent_analysis, consent_research,
        privacy_policy_version, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, 'received', ?, ?)`
    ).bind(id, user.id, photoKey, photoType, JSON.stringify(answers), consentResearch ? 1 : 0,
      PRIVACY_POLICY_VERSION, timestamp, timestamp).run();
  } catch (err) {
    await env.PHOTOS.delete(photoKey);
    throw err;
  }

  return json({ ok: true, id }, 201);
}

async function submissionPhoto(request, env, id) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Not signed in.' }, 401);

  const submission = await env.DB.prepare('SELECT user_id, photo_key FROM submissions WHERE id = ?').bind(id).first();
  if (!submission || (submission.user_id !== user.id && user.role !== 'team')) {
    return json({ error: 'Not found.' }, 404);
  }
  const object = await env.PHOTOS.get(submission.photo_key);
  if (!object) return json({ error: 'Not found.' }, 404);

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// ---------- Sessions ----------

async function withSession(env, userId, response) {
  const token = randomHex(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256Hex(token), userId, expires.toISOString()).run();
  response.headers.append('Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`);
  return response;
}

async function currentUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return env.DB.prepare(
    `SELECT users.id, users.email, users.name, users.role FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?`
  ).bind(await sha256Hex(token), now()).first();
}

// ---------- Helpers ----------

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return bytesToHex(new Uint8Array(digest));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function randomHex(byteCount) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(byteCount)));
}

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

// Blocks other websites from submitting forms on a signed-in visitor's behalf.
function sameOrigin(request, url) {
  const origin = request.headers.get('Origin');
  return !origin || origin === url.origin;
}

async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

function now() {
  return new Date().toISOString();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
