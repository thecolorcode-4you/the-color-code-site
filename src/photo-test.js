// TEMPORARY team test: selfie-only analysis, no quiz answers.
// Used by photo-test.html to check whether the AI is really reading the photo.
// It returns what the AI says it sees plus its raw reply. Remove this file, the
// /api/photo-test route in worker.js and photo-test.html once testing is done.
//
// Same privacy as the real analysis: the photo exists only in memory for this request
// and is never stored or logged.

import { SEASONS, SEASON_NAMES } from '../palettes.js';

var MAX_PHOTO_CHARS = 3000000;

export async function photoTest(request, env, model) {
  var started = Date.now();
  var body;
  try { body = await request.json(); } catch (e) { return reply({ error: 'Bad request' }, 400); }
  var photo = body && body.photo;
  if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(photo) || photo.length > MAX_PHOTO_CHARS) {
    return reply({ error: 'That photo could not be opened.' }, 400);
  }
  if (!env.AI) return reply({ error: 'The AI is not connected on this deployment.' }, 500);

  var seasonGuide = SEASON_NAMES.map(function (n) { return '- ' + n + ': ' + SEASONS[n].summary; }).join('\n');
  var system =
    'You are Bella, the color analyst for The Color Code. You place a person in exactly one of these twelve seasons:\n' + seasonGuide + '\n\n' +
    'You get ONLY a selfie, no questionnaire. Look carefully at the photo itself and describe what you actually see before deciding. ' +
    'Skin depth is not undertone: deep, medium and light skin can each be warm, cool or neutral. ' +
    'Never choose a Winter season just because skin is deep, or a Spring or Summer just because skin is light. ' +
    'Never guess or mention ethnicity, age, weight or attractiveness. ' +
    'If there is no face, or the coloring cannot be read, set photo_usable to false and say what you see instead.\n\n' +
    'Reply with only a JSON object: {"seen": {"what_is_in_photo": "<one short phrase>", "skin_depth": "light|medium|deep", ' +
    '"skin_undertone": "warm|cool|neutral", "eye_color": "<color>", "hair_color": "<color>", "lighting": "<short>"}, ' +
    '"photo_usable": true, "season": "<one of the twelve names exactly>", "reason": "<two plain sentences to her>"}';

  var raw;
  try {
    raw = await env.AI.run(model, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: [
          { type: 'text', text: 'Here is the selfie. What do you see, and which season is she?' },
          { type: 'image_url', image_url: { url: photo } },
        ] },
      ],
      max_tokens: 400,
      temperature: 0.1,
    });
  } catch (e) {
    return reply({ error: 'AI error: ' + (e && e.message), model: model, ms: Date.now() - started });
  } finally {
    photo = null;
    body = null;
  }

  var text = raw && raw.response !== undefined ? raw.response : raw;
  var parsed = null;
  if (typeof text === 'object' && text) parsed = text;
  else if (typeof text === 'string') {
    var m = text.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch (e) {} }
  }
  var rawText = typeof text === 'string' ? text : JSON.stringify(text);
  return reply({ model: model, ms: Date.now() - started, parsed: parsed, raw: String(rawText).slice(0, 3000) });
}

function reply(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
