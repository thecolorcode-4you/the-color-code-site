// The Color Code — server function for selfie analysis.
//
// POST /api/analyze  { photo: "data:image/jpeg;base64,...", answers: {seven quiz answers} }
// Cloudflare's free image AI DESCRIBES the selfie (undertone, depth, brightness, contrast,
// eye and hair color). The season is then chosen by the fixed rules in season-rules.js from
// that description plus the seven answers, so the result is consistent and never contradicts
// what was seen. The AI never sees the answers.
//
// Privacy: the photo only exists in memory for this one request. It is never written to
// storage, a database or the logs, and it is gone as soon as the result is sent back.
// Every other path is served as a normal page of the site.

import { cleanAnswers, pickSeason, reasonFor, pickSeasonWithPhoto, reasonFromPhoto, goodLight } from '../season-rules.js';
import { describePhoto, VISION_MODEL } from './photo-reading.js';

var MAX_PHOTO_CHARS = 3000000; // about 2 MB of image; the app shrinks photos well below this

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    if (url.pathname === '/api/analyze') {
      if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
      return analyze(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function analyze(request, env) {
  var body;
  try { body = await request.json(); } catch (e) { return json({ error: 'Bad request' }, 400); }

  var answers = cleanAnswers(body && body.answers);
  if (!answers) return json({ error: 'Please answer all seven questions.' }, 400);

  var quizSeason = pickSeason(answers);
  var fallback = { season: quizSeason, reason: reasonFor(quizSeason, answers), method: 'quiz', photoUsed: false };

  var photo = body.photo;
  body = null;
  if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(photo) || photo.length > MAX_PHOTO_CHARS) {
    return json(Object.assign(fallback, { note: 'We couldn\'t open that photo, so your season comes from your answers.' }));
  }
  if (!env.AI) {
    return json(Object.assign(fallback, { note: 'Photo analysis is offline right now, so your season comes from your answers.' }));
  }

  var seen;
  try {
    seen = (await describePhoto(env, photo)).seen;
  } catch (e) {
    console.error('AI error', e && e.message);
    return json(Object.assign(fallback, { note: 'Photo analysis didn\'t respond just now, so your season comes from your answers.' }));
  } finally {
    photo = null;
  }

  if (!seen) {
    console.error('AI reply not usable');
    return json(Object.assign(fallback, { note: 'We couldn\'t read your photo clearly, so your season comes from your answers.' }));
  }
  if (!seen.face_visible) {
    return json(Object.assign(fallback, { note: 'We couldn\'t find a face in your photo, so your season comes from your answers. Try again facing a window for a photo reading.' }));
  }

  var season = pickSeasonWithPhoto(answers, seen);
  console.log('photo analysis', season, 'quiz alone', quizSeason, seen.undertone, seen.depth, seen.clarity, seen.contrast);
  return json({
    season: season,
    reason: reasonFromPhoto(season, seen, answers),
    method: 'photo+quiz',
    photoUsed: true,
    quizSeason: quizSeason,
    note: !goodLight(seen) ? 'Your photo looks like it was taken in indoor light, which can shift how colors read, so your answers counted for more. For the most accurate result, retake it facing a window.'
      : seen.undertone_confidence === 'unsure' ? 'Your lighting or makeup made your undertone harder to read, so your answers counted for more. For a stronger photo reading, retake it facing a window, bare-faced.' : undefined,
  });
}

export { VISION_MODEL };
