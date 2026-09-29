// The Color Code — backend for Bella's photo analysis, free accounts and saved results.
//
// Static pages in /public are served directly by Cloudflare. Only /api/* requests reach this
// Worker (see run_worker_first in wrangler.jsonc).
//
// Storage: DB (D1) — users, sessions and analysis results. Photos are sent to Claude for the
// analysis and never stored anywhere.

import { QUIZ_KEYS, pickSeason, reasonFor, validAnswers } from '../public/season-rules.js';
import { analyzePhoto } from './analyze.js';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // Claude's per-image limit; the page shrinks photos first
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const SESSION_COOKIE = 'tcc_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000; // Workers' maximum for PBKDF2
// Bump whenever privacy-policy.html changes, so we know which version each person agreed to.
const PRIVACY_POLICY_VERSION = 'draft-2026-09-29';

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
  // user_id is empty until the person saves the result to a free account.
  `CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    season TEXT NOT NULL,
    explanation TEXT NOT NULL,
    source TEXT NOT NULL,
    observations TEXT,
    answers TEXT NOT NULL,
    consent_analysis INTEGER NOT NULL,
    consent_research INTEGER NOT NULL,
    privacy_policy_version TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS results_user ON results (user_id, created_at)`,
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
  if (pathname === '/api/analyze' && method === 'POST') return analyze(request, env);
  if (pathname === '/api/results/save' && method === 'POST') return saveResult(request, env);

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
    'SELECT id, season, explanation, answers, created_at FROM results WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return json({
    user: { name: user.name, email: user.email, role: user.role },
    results: results.map((r) => ({
      id: r.id,
      season: r.season,
      explanation: r.explanation,
      answers: JSON.parse(r.answers),
      created_at: r.created_at,
    })),
  });
}

// ---------- Analysis ----------

// Takes the selfie plus the six quiz answers and returns a season. Claude reads the photo; if
// Claude can't be reached, the quiz's fixed rules pick the season so nobody gets stuck. The
// photo is never written anywhere. No account is needed; the result can be saved later.
async function analyze(request, env) {
  if (env.ANALYZE_LIMITER) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.ANALYZE_LIMITER.limit({ key: ip });
    if (!success) return json({ error: 'Too many tries in a row. Please wait a minute and try again.' }, 429);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "We couldn't read that. Please try again." }, 400);
  }

  const photo = form.get('photo');
  if (!photo || typeof photo === 'string' || photo.size === 0) {
    return json({ error: 'Please add your selfie first.' }, 400);
  }
  const photoType = (photo.type || '').toLowerCase();
  if (!PHOTO_TYPES.includes(photoType)) {
    return json({ error: 'Please use a JPG, PNG or WebP photo.' }, 400);
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return json({ error: 'That photo is too large. Please try another one.' }, 400);
  }

  if (form.get('consent_analysis') !== 'yes') {
    return json({ error: 'Please agree to how your photo and answers will be used.' }, 400);
  }
  let answers;
  try {
    answers = JSON.parse(form.get('answers') || '');
  } catch {
    answers = null;
  }
  if (!validAnswers(answers)) {
    return json({ error: 'Please answer all six questions.' }, 400);
  }
  const clean = {};
  for (const key of QUIZ_KEYS) clean[key] = answers[key];

  const ai = await analyzePhoto(env, new Uint8Array(await photo.arrayBuffer()), photoType, clean);
  if (ai.status === 'retake') return json({ retake: true, reason: ai.reason }, 422);

  let season, explanation, source, observations = null;
  if (ai.status === 'ok') {
    ({ season, explanation, observations } = ai);
    source = 'ai';
  } else {
    season = pickSeason(clean);
    explanation = reasonFor(season, clean);
    source = 'rules';
  }

  const user = await currentUser(request, env);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO results (id, user_id, season, explanation, source, observations, answers,
      consent_analysis, consent_research, privacy_policy_version, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
  ).bind(id, user ? user.id : null, season, explanation, source,
    observations ? JSON.stringify(observations) : null, JSON.stringify(clean),
    form.get('consent_research') === 'yes' ? 1 : 0, PRIVACY_POLICY_VERSION, now()).run();

  return json({ ok: true, id, season, explanation, source, saved: !!user }, 201);
}

// Attaches an analysis done while signed out to the account that just signed in.
async function saveResult(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Please sign in to save your palette.' }, 401);

  const body = await readJson(request);
  const id = String(body.id || '');
  const row = await env.DB.prepare('SELECT user_id FROM results WHERE id = ?').bind(id).first();
  if (!row || (row.user_id && row.user_id !== user.id)) {
    return json({ error: "We couldn't find that result. Please retake the analysis." }, 404);
  }
  if (!row.user_id) {
    await env.DB.prepare('UPDATE results SET user_id = ? WHERE id = ? AND user_id IS NULL').bind(user.id, id).run();
  }
  return json({ ok: true, id });
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
