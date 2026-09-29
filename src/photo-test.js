// TEMPORARY team test: selfie-only analysis, no quiz answers.
// Used by photo-test.html to check whether the AI is really reading the photo. Uses the
// same photo reading and season rules as the real app, minus the answers, and returns
// what the AI says it sees plus its raw reply. Remove this file, the /api/photo-test
// route in worker.js and photo-test.html once testing is done.
//
// Same privacy as the real analysis: the photo exists only in memory for this request
// and is never stored or logged.

import { pickSeasonWithPhoto, reasonFromPhoto, goodLight } from '../season-rules.js';
import { describePhoto, VISION_MODEL } from './photo-reading.js';

var MAX_PHOTO_CHARS = 3000000;

export async function photoTest(request, env) {
  var started = Date.now();
  var body;
  try { body = await request.json(); } catch (e) { return reply({ error: 'Bad request' }, 400); }
  var photo = body && body.photo;
  body = null;
  if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(photo) || photo.length > MAX_PHOTO_CHARS) {
    return reply({ error: 'That photo could not be opened.' }, 400);
  }
  if (!env.AI) return reply({ error: 'The AI is not connected on this deployment.' }, 500);

  var result;
  try {
    result = await describePhoto(env, photo);
  } catch (e) {
    return reply({ error: 'AI error: ' + (e && e.message), model: VISION_MODEL, ms: Date.now() - started });
  } finally {
    photo = null;
  }

  var raw = result.raw && result.raw.response !== undefined ? result.raw.response : result.raw;
  var rawText = String(typeof raw === 'string' ? raw : JSON.stringify(raw)).slice(0, 3000);
  var seen = result.seen;
  var out = { model: VISION_MODEL, ms: Date.now() - started, raw: rawText, seen: seen };
  if (seen && seen.face_visible && seen.undertone) {
    out.season = pickSeasonWithPhoto(null, seen);
    out.reason = reasonFromPhoto(out.season, seen, null);
    if (!goodLight(seen)) out.reason += ' (Indoor light: this photo counted for half. In the real app the answers would carry more weight; retake by a window.)';
  } else {
    out.note = seen && !seen.face_visible ? 'No face found — the app would fall back to the answers.' : 'The AI reply could not be used — the app would fall back to the answers.';
  }
  return reply(out);
}

function reply(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
