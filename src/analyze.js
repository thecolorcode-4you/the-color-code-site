// Bella's photo analysis: sends the selfie and quiz answers to Claude and gets back one of the
// twelve seasons. The photo is only held in memory for this one request — it is never stored.
import Anthropic from '@anthropic-ai/sdk';
import { SEASONS } from '../public/palettes.js';
import { LABELS } from '../public/season-rules.js';

const MODEL = 'claude-opus-5-5';
const SEASON_NAMES = Object.keys(SEASONS);

const SYSTEM_PROMPT = `You are Bella, the color-analysis engine for The Color Code, a personal color analysis service. You look at one selfie plus the person's answers to a six-question quiz and place them in one of the twelve seasonal color palettes.

How to read the photo:
- Judge skin undertone (warm, cool or neutral leaning one way), skin depth, eye color, natural hair color, and the contrast between hair, skin and eyes.
- Lighting, white balance, filters and makeup distort color. Discount them where you can, and lean more on the quiz answers when the photo is ambiguous.
- Dyed hair: use the quiz's natural hair color answer over the photo.
- Combine the photo and the answers. When they disagree, favor what is most visible in the photo for depth and contrast, and weigh the answers more heavily for undertone.

Set photo_usable to false only when you genuinely can't analyze it: no human face, more than one face, face mostly hidden or turned away, very dark or blown-out lighting, or a heavy color filter. Then give a short, friendly retake_reason telling them what to fix. Otherwise leave retake_reason empty.

The explanation is shown directly to the customer. Write two or three warm, plain sentences, addressed to them as "you", saying what you saw and why that season fits. Describe coloring only. Never comment on attractiveness, weight, age, ethnicity or anything beyond coloring.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    photo_usable: { type: 'boolean' },
    retake_reason: { type: 'string' },
    undertone: { type: 'string', enum: ['warm', 'neutral-warm', 'neutral-cool', 'cool'] },
    depth: { type: 'string', enum: ['light', 'medium', 'deep'] },
    contrast: { type: 'string', enum: ['low', 'medium', 'high'] },
    chroma: { type: 'string', enum: ['soft', 'balanced', 'clear'] },
    season: { type: 'string', enum: SEASON_NAMES },
    explanation: { type: 'string' },
  },
  required: ['photo_usable', 'retake_reason', 'undertone', 'depth', 'contrast', 'chroma', 'season', 'explanation'],
  additionalProperties: false,
};

// Returns { status: 'ok', season, explanation, observations }, { status: 'retake', reason },
// or { status: 'unavailable' } when the AI can't be reached, so the caller can fall back to the
// quiz rules.
export async function analyzePhoto(env, photoBytes, mediaType, answers) {
  if (!env.ANTHROPIC_API_KEY) return { status: 'unavailable' };
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    baseURL: env.ANTHROPIC_BASE_URL || undefined, // only set for local testing
    maxRetries: 1,
    timeout: 60000,
  });

  const answerText = Object.keys(LABELS)
    .map((key) => `- ${key}: ${LABELS[key][answers[key]]}`)
    .join('\n');

  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: toBase64(photoBytes) } },
          { type: 'text', text: `Here is my selfie. My quiz answers:\n${answerText}` },
        ],
      }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('Anthropic API key is invalid or missing permissions.');
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error('Anthropic rate limit hit.');
    } else if (err instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${err.status}: ${err.message}`);
    } else {
      console.error('Could not reach Anthropic:', err);
    }
    return { status: 'unavailable' };
  }

  if (response.stop_reason === 'refusal') {
    console.error('Photo analysis declined:', response.stop_details?.category ?? 'unknown');
    return { status: 'unavailable' };
  }
  if (response.stop_reason !== 'end_turn') {
    console.error('Photo analysis stopped early:', response.stop_reason);
    return { status: 'unavailable' };
  }

  const text = response.content.find((b) => b.type === 'text')?.text;
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    console.error('Photo analysis returned unreadable output.');
    return { status: 'unavailable' };
  }

  if (!result.photo_usable) {
    return { status: 'retake', reason: result.retake_reason || 'Please try another photo, face-on in natural light.' };
  }
  if (!SEASONS[result.season]) return { status: 'unavailable' };

  return {
    status: 'ok',
    season: result.season,
    explanation: result.explanation,
    observations: {
      undertone: result.undertone,
      depth: result.depth,
      contrast: result.contrast,
      chroma: result.chroma,
      model: response.model,
    },
  };
}

function toBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
