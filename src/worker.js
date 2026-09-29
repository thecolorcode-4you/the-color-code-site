// The Color Code — backend for free accounts and saved quiz results.
//
// Static pages in /public are served directly by Cloudflare. Only /api/* requests reach this
// Worker (see run_worker_first in wrangler.jsonc).
//
// Storage: DB (D1) — users, sessions and saved quiz results. No photos are collected.

import { QUIZ_KEYS, pickSeason, validAnswers } from '../public/season-rules.js';

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
  `CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    season TEXT NOT NULL,
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
  if (pathname === '/api/results' && method === 'POST') return saveResult(request, env);

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
    'SELECT id, season, answers, created_at FROM results WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return json({
    user: { name: user.name, email: user.email, role: user.role },
    results: results.map((r) => ({
      id: r.id,
      season: r.season,
      answers: JSON.parse(r.answers),
      created_at: r.created_at,
    })),
  });
}

// ---------- Quiz results ----------

// Saves a quiz result to the signed-in account. The season is worked out again here from the
// answers with the same rules the quiz uses, so a saved season always matches its answers.
async function saveResult(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Please sign in to save your palette.' }, 401);

  const body = await readJson(request);
  if (body.consent_analysis !== true) {
    return json({ error: 'Please agree to how your answers will be used.' }, 400);
  }
  if (!validAnswers(body.answers)) {
    return json({ error: 'Some quiz answers were missing. Please retake the quiz.' }, 400);
  }
  const answers = {};
  for (const key of QUIZ_KEYS) answers[key] = body.answers[key];

  const id = crypto.randomUUID();
  const season = pickSeason(answers);
  await env.DB.prepare(
    `INSERT INTO results (id, user_id, season, answers, consent_analysis, consent_research, privacy_policy_version, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?)`
  ).bind(id, user.id, season, JSON.stringify(answers), body.consent_research === true ? 1 : 0,
    PRIVACY_POLICY_VERSION, now()).run();

  return json({ ok: true, id, season }, 201);
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
