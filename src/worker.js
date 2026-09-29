// The Color Code — server function for selfie analysis.
//
// POST /api/analyze  { photo: "data:image/jpeg;base64,...", answers: {six quiz answers} }
// Sends the selfie and answers to Claude (Anthropic's AI), which picks one of the twelve
// seasons and explains why in two plain sentences.
//
// Privacy: the photo only exists in memory for this one request. We never write it to
// storage, a database or the logs, and it is gone as soon as the result is sent back.
// Every other path is served as a normal page of the site.

import Anthropic from '@anthropic-ai/sdk';
import { SEASONS, SEASON_NAMES } from '../palettes.js';
import { LABELS, cleanAnswers, pickSeason, reasonFor } from '../season-rules.js';

var MODEL = 'claude-opus-5-5';
// Claude's answer must match this shape, and the season must be one of our twelve names.
var REPLY_SCHEMA = {
  type: 'object',
  properties: {
    season: { type: 'string', enum: SEASON_NAMES },
    photo_usable: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['season', 'photo_usable', 'reason'],
  additionalProperties: false,
};
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
  // Each analysis is a paid call to Claude, so cap how often one visitor can run it.
  if (env.ANALYZE_LIMITER) {
    var limit = await env.ANALYZE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
    if (!limit.success) return json({ error: 'Too many tries in a row. Please wait a minute and try again.' }, 429);
  }

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
  if (!env.ANTHROPIC_API_KEY) {
    return json(Object.assign(fallback, { note: 'Photo analysis is offline right now, so your season comes from your answers.' }));
  }

  var answerText = Object.keys(answers).map(function (k) { return '- ' + LABELS[k][answers[k]]; }).join('\n');
  var seasonGuide = SEASON_NAMES.map(function (n) { return '- ' + n + ': ' + SEASONS[n].summary; }).join('\n');

  var system =
    'You are Bella, the color analyst for The Color Code, a personal seasonal color analysis service. ' +
    'You place a person in exactly one of these twelve seasons:\n' + seasonGuide + '\n\n' +
    'Look only at colors in the selfie: skin undertone (warm, cool or neutral), skin depth (light, medium or deep), ' +
    'eye color, natural hair color, and the contrast between them. Weigh the photo together with their questionnaire answers; ' +
    'when the photo and answers disagree, trust what you can clearly see, unless the lighting is colored or dim. ' +
    'Never guess or mention ethnicity, age, weight or attractiveness. ' +
    'If there is no clear face, or the lighting, a filter or heavy makeup makes the coloring impossible to read, set photo_usable to false.\n\n' +
    'The reason is shown to the customer: exactly two plain, warm sentences, using you/your, naming what you saw ' +
    'in their skin, eyes and hair and why that fits the season.';

  var user =
    'My questionnaire answers:\n' + answerText + '\n' +
    'For reference, my answers alone point to ' + quizSeason + '.\n' +
    'Here is my selfie, taken in daylight. Which season am I?';

  var dataUrl = photo.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  var client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    baseURL: env.ANTHROPIC_BASE_URL || undefined, // only set for local testing
    maxRetries: 0,
    timeout: 40000,
  });

  var raw;
  try {
    var response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // If Claude declines, Anthropic retries on its recommended backup model instead.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: REPLY_SCHEMA } },
      system: system,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: dataUrl[1], data: dataUrl[2] } },
          { type: 'text', text: user },
        ],
      }],
    });
    if (response.stop_reason === 'refusal') {
      console.error('Claude declined:', response.stop_details && response.stop_details.category);
    } else if (response.stop_reason !== 'end_turn') {
      console.error('Claude stopped early:', response.stop_reason);
    } else {
      var text = response.content.find(function (b) { return b.type === 'text'; });
      raw = text ? JSON.parse(text.text) : null;
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) console.error('Anthropic API key is missing or invalid');
    else if (e instanceof Anthropic.RateLimitError) console.error('Anthropic rate limit or spend limit reached');
    else if (e instanceof Anthropic.APIError) console.error('Anthropic API error', e.status);
    else console.error('Claude error', e && e.message);
    return json(Object.assign(fallback, { note: 'Photo analysis didn\'t respond just now, so your season comes from your answers.' }));
  } finally {
    photo = null;
    body = null;
    dataUrl = null;
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
