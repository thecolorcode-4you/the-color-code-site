// The Color Code — server function for selfie analysis.
//
// POST /api/analyze  { photo: "data:image/jpeg;base64,...", answers: {six quiz answers} }
// Sends the selfie and answers to Cloudflare's free image-reading AI, which picks one of
// the twelve seasons and explains why in two plain sentences.
//
// Privacy: the photo only exists in memory for this one request. It is never written to
// storage, a database or the logs, and it is gone as soon as the result is sent back.
// Every other path is served as a normal page of the site.

import { SEASONS, SEASON_NAMES } from '../palettes.js';
import { LABELS, cleanAnswers, pickSeason, reasonFor } from '../season-rules.js';

var VISION_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';
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
  if (!answers) return json({ error: 'Please answer all six questions.' }, 400);

  var quizSeason = pickSeason(answers);
  var fallback = { season: quizSeason, reason: reasonFor(quizSeason, answers), method: 'quiz', photoUsed: false };

  var photo = body.photo;
  if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(photo) || photo.length > MAX_PHOTO_CHARS) {
    return json(Object.assign(fallback, { note: 'We couldn\'t open that photo, so your season comes from your answers.' }));
  }
  if (!env.AI) {
    return json(Object.assign(fallback, { note: 'Photo analysis is offline right now, so your season comes from your answers.' }));
  }

  var answerText = Object.keys(answers).map(function (k) { return '- ' + LABELS[k][answers[k]]; }).join('\n');
  var seasonGuide = SEASON_NAMES.map(function (n) { return '- ' + n + ': ' + SEASONS[n].summary; }).join('\n');

  var system =
    'You are Bella, the color analyst for The Color Code, a personal seasonal color analysis service. ' +
    'You place a person in exactly one of these twelve seasons:\n' + seasonGuide + '\n\n' +
    'Look only at colors in the selfie: skin undertone (warm, cool or neutral), skin depth (light, medium or deep), ' +
    'eye color, natural hair color, and the contrast between them. Weigh the photo together with her questionnaire answers; ' +
    'when the photo and answers disagree, trust what you can clearly see, unless the lighting is colored or dim. ' +
    'Skin depth is not undertone: deep, medium and light skin can each be warm, cool or neutral, and deep skin belongs in whichever season its undertone and contrast fit, often an Autumn. ' +
    'Never choose a Winter season just because skin is deep, and never choose a Spring or Summer just because skin is light. ' +
    'Never guess or mention ethnicity, age, weight or attractiveness. ' +
    'If there is no clear face, or the lighting, a filter or heavy makeup makes the coloring impossible to read, set photo_usable to false.\n\n' +
    'Reply with only a JSON object and nothing else: ' +
    '{"season": "<one of the twelve names exactly>", "photo_usable": true, ' +
    '"reason": "<exactly two plain, warm sentences to her, using you/your, naming what you saw in her skin, eyes and hair and why that fits the season>"}';

  var user =
    'Her questionnaire answers:\n' + answerText + '\n' +
    'For reference, her answers alone point to ' + quizSeason + '.\n' +
    'Here is her selfie, taken in daylight. Which season is she?';

  var raw;
  try {
    raw = await env.AI.run(VISION_MODEL, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: [
          { type: 'text', text: user },
          { type: 'image_url', image_url: { url: photo } },
        ] },
      ],
      max_tokens: 300,
      temperature: 0.1,
    });
  } catch (e) {
    console.error('AI error', e && e.message);
    return json(Object.assign(fallback, { note: 'Photo analysis didn\'t respond just now, so your season comes from your answers.' }));
  } finally {
    photo = null;
    body = null;
  }

  var parsed = readAiReply(raw);
  if (!parsed) {
    console.error('AI reply not usable');
    return json(Object.assign(fallback, { note: 'We couldn\'t read your photo clearly, so your season comes from your answers.' }));
  }
  if (parsed.photo_usable === false) {
    return json(Object.assign(fallback, { note: 'Your photo was hard to read (lighting or a filter), so your season comes from your answers. Try again by a window for a photo reading.' }));
  }

  console.log('photo analysis', parsed.season, 'quiz said', quizSeason);
  return json({ season: parsed.season, reason: parsed.reason, method: 'photo+quiz', photoUsed: true, quizSeason: quizSeason });
}

// Pull {season, reason, photo_usable} out of the model's reply and make sure the season is one of ours.
export function readAiReply(raw) {
  var obj = raw && raw.response !== undefined ? raw.response : raw;
  if (typeof obj === 'string') {
    var m = obj.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { obj = JSON.parse(m[0]); } catch (e) { return null; }
  }
  if (!obj || typeof obj !== 'object') return null;
  var season = SEASON_NAMES.find(function (n) { return n.toLowerCase() === String(obj.season || '').trim().toLowerCase(); });
  if (!season) return null;
  var reason = String(obj.reason || '').replace(/\s+/g, ' ').trim();
  var sentences = reason.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 2) reason = sentences.slice(0, 2).join('').trim();
  if (reason.length < 20) reason = 'Your coloring reads as ' + SEASONS[season].summary.charAt(0).toLowerCase() + SEASONS[season].summary.slice(1);
  return { season: season, reason: reason, photo_usable: obj.photo_usable !== false };
}
