// The Color Code — the seven quiz questions and the fixed season rules.
// Shared by the phone (quiz-only results) and the server, which combines them with what
// the AI saw in the selfie. The AI only describes the photo; these rules choose the season.
import { SEASONS } from './palettes.js';

export var QUESTIONS = ['veins', 'jewelry', 'sun', 'hair', 'eyes', 'white', 'colors'];

// Returns the answers if every one is a known choice, otherwise null.
export function cleanAnswers(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var a = {};
  for (var i = 0; i < QUESTIONS.length; i++) {
    var k = QUESTIONS[i];
    if (!Object.prototype.hasOwnProperty.call(LABELS[k], raw[k])) return null;
    a[k] = raw[k];
  }
  return a;
}

export var LABELS = {
  veins: { blue_purple: 'blue or purple veins', green: 'green veins', mix: 'a mix of blue and green veins', cant_tell: 'veins she couldn\'t make out' },
  jewelry: { silver: 'silver jewelry', gold: 'gold jewelry', both: 'both gold and silver' },
  sun: { burn: 'burning easily in the sun', burn_then_tan: 'burning, then tanning', tan: 'tanning easily', rarely_burn: 'skin that rarely burns and just deepens' },
  hair: { platinum: 'platinum or light blonde hair', golden: 'golden or strawberry blonde hair', ash: 'ash or dark blonde hair', light_brown: 'light brown hair', medium_brown: 'medium brown hair', dark_brown: 'dark brown hair', black: 'black hair', red: 'red or auburn hair' },
  eyes: { light_blue_gray: 'light blue or gray eyes', bright_blue: 'bright blue eyes', green: 'green eyes', hazel: 'hazel eyes', light_brown: 'light brown eyes', dark_brown: 'dark brown eyes', black_brown: 'very dark brown eyes' },
  white: { bright: 'bright white', ivory: 'soft ivory', both: 'white or ivory alike' },
  colors: { bold: 'bold, saturated colors', soft: 'soft, dusty colors', both: 'both bold and soft colors' },
};

// Scores from the seven answers. t: cool (−) to warm (+). d: light (−) to deep (+).
// c: soft/muted (−) to bright/clear (+).
export function scoreAnswers(a) {
  var t = 0;
  t += { blue_purple: -1, green: 1, mix: 0 }[a.veins] || 0;
  t += { silver: -1, gold: 1, both: 0 }[a.jewelry] || 0;
  t += { bright: -1, ivory: 1, both: 0 }[a.white] || 0;
  // Hair is only a light hint for warmth: red or golden hair can belong to a cool Winter.
  t += { golden: 0.5, red: 0.5, ash: -0.5, black: -0.5 }[a.hair] || 0;
  t += { burn: -0.5, tan: 0.5 }[a.sun] || 0;

  var d = 0;
  d += { platinum: -2, golden: -1.5, ash: -1, light_brown: -0.5, medium_brown: 0.5, red: 0, dark_brown: 1.5, black: 2 }[a.hair] || 0;
  d += { light_blue_gray: -1, bright_blue: -0.5, green: -0.5, hazel: 0, light_brown: 0, dark_brown: 1, black_brown: 1.5 }[a.eyes] || 0;
  d += { burn: -0.5, burn_then_tan: 0, tan: 0.5, rarely_burn: 1 }[a.sun] || 0;

  var c = 0;
  c += { bright: 1, ivory: -0.5, both: 0 }[a.white] || 0;
  c += { bright_blue: 1.5, green: 0.5, light_blue_gray: 0, hazel: -1, light_brown: -0.5, dark_brown: 0, black_brown: 0.5 }[a.eyes] || 0;
  c += { ash: -1, light_brown: -1, medium_brown: -0.5, black: 1 }[a.hair] || 0;
  // High contrast between dark hair and light eyes reads as bright.
  if ((a.hair === 'black' || a.hair === 'dark_brown') && (a.eyes === 'bright_blue' || a.eyes === 'light_blue_gray' || a.eyes === 'green')) c += 1.5;
  // The most direct brightness question: bold, saturated colors vs soft, dusty ones.
  c += { bold: 1.5, soft: -1.5, both: 0 }[a.colors] || 0;

  return { t: t, d: d, c: c, tieWarm: a.hair === 'golden' || a.hair === 'red' };
}

// What the AI saw in the photo (it only describes; these rules decide). Photo readings
// count for more than a single answer, and "unsure" readings count for half.
export var SEEN_VALUES = {
  undertone: ['warm', 'cool', 'neutral'],
  undertone_confidence: ['sure', 'unsure'],
  depth: ['light', 'medium', 'deep'],
  clarity: ['bright', 'in_between', 'muted'],
  contrast: ['high', 'medium', 'low'],
};

export function scorePhoto(seen) {
  var sure = seen.undertone_confidence === 'unsure' ? 1 : 2;
  var t = { warm: 1, cool: -1, neutral: 0 }[seen.undertone] * sure;
  var d = { light: -2, medium: 0, deep: 2 }[seen.depth];
  var c = { bright: 2, in_between: 0, muted: -2 }[seen.clarity] + { high: 1.5, medium: 0, low: -1.5 }[seen.contrast];
  return { t: t, d: d, c: c, tieWarm: seen.undertone === 'warm' };
}

export function seasonFromScores(s) {
  var t = s.t, d = s.d, c = s.c;
  var warm = t > 0 || (t === 0 && s.tieWarm);
  var strongest = [['depth', Math.abs(d)], ['clarity', Math.abs(c)]].sort(function (x, y) { return y[1] - x[1]; })[0];

  if (Math.abs(t) >= 2.5 && strongest[1] < 2) return warm ? (d > 0 ? 'True Autumn' : 'True Spring') : (d > 0.5 ? 'True Winter' : 'True Summer');
  if (strongest[0] === 'depth') {
    if (d <= -1) return warm ? 'Light Spring' : 'Light Summer';
    if (d >= 1) return warm ? 'Deep Autumn' : 'Deep Winter';
  } else {
    if (c >= 1) return warm ? 'Bright Spring' : 'Bright Winter';
    if (c <= -1) return warm ? 'Soft Autumn' : 'Soft Summer';
  }
  return warm ? (d > 0 ? 'True Autumn' : 'True Spring') : (d > 0.5 ? 'True Winter' : 'True Summer');
}

export function pickSeason(a) {
  return seasonFromScores(scoreAnswers(a));
}

// Photo + answers together (answers may be null for the selfie-only test).
export function pickSeasonWithPhoto(a, seen) {
  var p = scorePhoto(seen);
  if (!a) return seasonFromScores(p);
  var q = scoreAnswers(a);
  return seasonFromScores({ t: q.t + p.t, d: q.d + p.d, c: q.c + p.c, tieWarm: p.t !== 0 ? p.tieWarm : q.tieWarm });
}

var DEPTH_WORD = { light: 'light', medium: 'medium', deep: 'deep' };
var CLARITY_WORD = { bright: 'clear, bright', in_between: 'balanced', muted: 'soft, muted' };

// Two plain sentences from what the photo showed and the season the rules chose.
export function reasonFromPhoto(season, seen, a) {
  var s = SEASONS[season];
  var temp = s.family === 'Spring' || s.family === 'Autumn' ? 'warm' : 'cool';
  var features = [seen.hair_color ? seen.hair_color + ' hair' : '', seen.eye_color ? seen.eye_color + ' eyes' : ''].filter(Boolean).join(' and ');
  var first = 'In your photo, your skin reads as ' + seen.undertone + ' with ' + DEPTH_WORD[seen.depth] + ' depth, ' +
    (features ? 'and your ' + features + ' give ' + seen.contrast + ' contrast and ' : 'with ') + CLARITY_WORD[seen.clarity] + ' coloring.';
  var lead;
  if (!a || seen.undertone === temp) lead = 'That ' + temp + ' reading';
  else if (seen.undertone === 'neutral') lead = 'Your answers tip that toward ' + temp + ', which';
  else lead = 'Your answers point more strongly to a ' + temp + ' undertone, which';
  var second = lead + ' places you in ' + season + ': ' + s.summary.charAt(0).toLowerCase() + s.summary.slice(1);
  return first + ' ' + second;
}

var VEIN_PHRASE = { blue_purple: 'your blue-purple veins', green: 'your green veins', mix: 'veins that look both blue and green' };
var JEWELRY_PHRASE = { silver: 'the way silver jewelry flatters you', gold: 'the way gold jewelry flatters you', both: 'looking good in both gold and silver' };
var WHITE_PHRASE = { bright: 'your pull toward bright white', ivory: 'your pull toward soft ivory', both: 'looking fine in white or ivory' };

export function reasonFor(season, a) {
  var s = SEASONS[season];
  var temp = s.family === 'Spring' || s.family === 'Autumn' ? 'warm' : 'cool';
  // Only name what she actually told us: "I can't tell" leaves the veins out.
  var signs = [VEIN_PHRASE[a.veins], JEWELRY_PHRASE[a.jewelry], WHITE_PHRASE[a.white]].filter(Boolean);
  var first = signs.slice(0, -1).join(', ') + ' and ' + signs[signs.length - 1] + ' point to a ' + temp + ' undertone.';
  first = first.charAt(0).toUpperCase() + first.slice(1);
  var clarity = a.colors === 'bold' ? ', and the way bold, saturated colors suit you' : a.colors === 'soft' ? ', and the way soft, dusty colors suit you' : '';
  var second = 'Paired with your ' + LABELS.hair[a.hair] + ' and ' + LABELS.eyes[a.eyes] + clarity + ', that places you in ' + season + ': ' + s.summary.charAt(0).toLowerCase() + s.summary.slice(1);
  return first + ' ' + second;
}

