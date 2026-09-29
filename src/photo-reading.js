// The Color Code — reading a selfie with Cloudflare's image AI.
//
// The AI only DESCRIBES the photo (undertone, depth, brightness, contrast, eye and hair
// color). It never picks the season: season-rules.js does that from what it saw plus the
// customer's answers, so a cool reading can never turn into a warm season and the same
// reading always gives the same season. The AI never sees the customer's answers.

import { SEEN_VALUES } from '../season-rules.js';

export var VISION_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

var INSTRUCTIONS =
  'You are the careful assistant to a personal color analyst. Describe only the natural coloring of the person in the selfie. You do NOT choose a color season.\n\n' +
  'undertone: judge it from the skin itself (jaw, neck, forehead), never from hair, clothes or makeup. warm = golden, peachy or yellow; cool = pink, rosy or bluish; neutral = a balance of both. ' +
  'Hair color never decides undertone: red, auburn or golden hair often belongs to someone with a cool undertone. ' +
  'Skin depth is not undertone: light, medium and deep skin can each be warm, cool or neutral.\n' +
  'clarity: bright = the eyes look clear and sparkling with crisp whites, the skin looks luminous, and the features look vivid and saturated; ' +
  'muted = the eyes look soft or smoky and the features look blended, greyed or dusty. If you are not sure, answer in_between.\n' +
  'contrast: how different in lightness the hair, eyes and skin are. high = for example dark hair or eyes against light skin, or light hair against deep skin; low = hair, eyes and skin are all similar in lightness.\n' +
  'If lamps, sunset light, a filter or heavy makeup make the skin hard to judge, set undertone_confidence to unsure. If there is no human face, set face_visible to false.\n' +
  'Never guess or mention ethnicity, age, weight or attractiveness.\n\n' +
  'Reply with only this JSON object and nothing else:\n' +
  '{"face_visible": true, "what_is_in_photo": "<short phrase>", "undertone": "warm|cool|neutral", "undertone_confidence": "sure|unsure", ' +
  '"depth": "light|medium|deep", "clarity": "bright|in_between|muted", "contrast": "high|medium|low", ' +
  '"eye_color": "<simple color>", "hair_color": "<simple color>", "lighting": "<short phrase>"}';

// Ask the AI to describe the photo. Returns { seen, raw } — seen is null if the reply
// can't be used. Throws if the AI call itself fails.
export async function describePhoto(env, photo) {
  var raw = await env.AI.run(VISION_MODEL, {
    messages: [
      { role: 'system', content: INSTRUCTIONS },
      { role: 'user', content: [
        { type: 'text', text: 'Describe the natural coloring of the person in this selfie.' },
        { type: 'image_url', image_url: { url: photo } },
      ] },
    ],
    max_tokens: 300,
    temperature: 0,
  });
  return { seen: readSeen(raw), raw: raw };
}

function cleanColor(v) {
  var s = String(v || '').toLowerCase().replace(/[^a-z \-]/g, '').replace(/\s+/g, ' ').trim();
  return s.length > 0 && s.length <= 25 ? s : '';
}

// Pull the description out of the model's reply and check every field is one we expect.
export function readSeen(raw) {
  var obj = raw && raw.response !== undefined ? raw.response : raw;
  if (typeof obj === 'string') {
    var m = obj.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { obj = JSON.parse(m[0]); } catch (e) { return null; }
  }
  if (!obj || typeof obj !== 'object') return null;
  var seen = {
    face_visible: obj.face_visible !== false,
    what_is_in_photo: String(obj.what_is_in_photo || '').slice(0, 120),
    eye_color: cleanColor(obj.eye_color),
    hair_color: cleanColor(obj.hair_color),
    lighting: String(obj.lighting || '').slice(0, 60),
  };
  for (var k in SEEN_VALUES) {
    var v = String(obj[k] || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    if (k === 'undertone_confidence' && SEEN_VALUES[k].indexOf(v) < 0) v = 'sure';
    if (SEEN_VALUES[k].indexOf(v) < 0) return seen.face_visible ? null : seen;
    seen[k] = v;
  }
  return seen;
}
