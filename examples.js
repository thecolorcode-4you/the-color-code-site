// The Color Code — simulated examples so a new customer sees the app working.
// Every person here is INVENTED by our app development agent for the pilot and is
// labeled as an example wherever it appears. Seasons are not typed in by hand: they
// come from running each person's quiz answers through the app's real season rules.
import { SEASONS } from './palettes.js';
import { pickSeason, reasonFor } from './season-rules.js';

export var EXAMPLE_LABEL = 'Example — simulated tester, not a real customer';

// The four customer personas (see docs/personas.md).
export var EXAMPLE_PEOPLE = [
  { name: 'Maddie', about: 'Sophomore, shopping for a formal dress',
    answers: { veins: 'blue_purple', jewelry: 'silver', sun: 'burn', hair: 'ash', eyes: 'light_blue_gray', white: 'both', colors: 'soft' },
    review: { stars: 5, text: 'I\'d been buying emerald because everyone said it was "my color." Light Summer told me why it always looked a little heavy on me. Found a powder-blue formal dress in one weekend.' } },
  { name: 'Aaliyah', about: 'Junior, wants makeup shades that actually work on deep skin',
    answers: { veins: 'green', jewelry: 'gold', sun: 'tan', hair: 'black', eyes: 'black_brown', white: 'ivory', colors: 'both' },
    review: { stars: 4, text: 'Every other quiz calls me a Winter by default. This read my warm undertone and put me in Deep Autumn, and the brick lip is the one I already love. I\'d want more foundation guidance before I pay for anything.' } },
  { name: 'Priya', about: 'Senior, pre-med, took the quiz without a photo',
    answers: { veins: 'mix', jewelry: 'silver', sun: 'burn_then_tan', hair: 'dark_brown', eyes: 'hazel', white: 'bright', colors: 'bold' },
    review: { stars: 4, text: 'I skipped the selfie and still got a season in under a minute, which is the only reason I finished. The "why" was two sentences, which is exactly as much as I wanted to read.' } },
  { name: 'Chloe', about: 'Freshman, just got her bid, found it on TikTok',
    answers: { veins: 'green', jewelry: 'gold', sun: 'burn', hair: 'golden', eyes: 'bright_blue', white: 'bright', colors: 'both' },
    review: { stars: 5, text: 'Took it with my pledge class during bid week and three of us got Spring seasons. I just wish I could post my palette to my story in one tap.' } },
];

EXAMPLE_PEOPLE.forEach(function (p) {
  p.season = pickSeason(p.answers);
  p.reason = reasonFor(p.season, p.answers);
});

// A simulated chapter for the "chapter color night" example: 24 invented members,
// each with quiz answers, run through the same rules.
var FIRST = ['Ava', 'Brooke', 'Caroline', 'Dani', 'Ella', 'Grace', 'Harper', 'Isabel', 'Jade', 'Kate', 'Lily', 'Mia', 'Nora', 'Olivia', 'Paige', 'Quinn', 'Riley', 'Sara', 'Tess', 'Uma', 'Vivian', 'Whitley', 'Yasmin', 'Zoe'];
var CHOICES = {
  veins: ['blue_purple', 'green', 'mix'], jewelry: ['silver', 'gold', 'both'], sun: ['burn', 'burn_then_tan', 'tan'],
  hair: ['platinum', 'golden', 'ash', 'light_brown', 'medium_brown', 'dark_brown', 'black', 'red'],
  eyes: ['light_blue_gray', 'bright_blue', 'green', 'hazel', 'light_brown', 'dark_brown', 'black_brown'], white: ['bright', 'ivory', 'both'], colors: ['bold', 'soft', 'both'],
};
var seed = 20260929;
function rand() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
export var EXAMPLE_CHAPTER = FIRST.map(function (name) {
  var a = {};
  Object.keys(CHOICES).forEach(function (k) { a[k] = CHOICES[k][Math.floor(rand() * CHOICES[k].length)]; });
  return { name: name, season: pickSeason(a) };
});

function dots(list) {
  return list.map(function (c) { return '<span class="mini-dot" style="background:' + c[1] + '" title="' + c[0] + '"></span>'; }).join('');
}

// Results & Benefits: example result cards.
var resultsEl = document.querySelector('[data-example-results]');
if (resultsEl) {
  resultsEl.innerHTML = EXAMPLE_PEOPLE.map(function (p) {
    var s = SEASONS[p.season];
    return '<div class="card example-card"><span class="example-flag">' + EXAMPLE_LABEL + '</span>' +
      '<h3 style="font-size:22px;">' + p.name + ' · ' + p.season + '</h3>' +
      '<p class="form-note">' + p.about + '</p>' +
      '<p style="margin-top:10px;font-size:14.5px;color:var(--text-muted);">' + p.reason + '</p>' +
      '<div class="mini-row"><span class="mini-label">Wear</span>' + dots(s.wear) + '</div>' +
      '<div class="mini-row"><span class="mini-label">Lip</span>' + dots(s.lip) + '<span class="mini-label" style="margin-left:10px;">Blush</span>' + dots(s.blush) + '</div></div>';
  }).join('');
}

// Customer Reviews: example reviews.
var reviewsEl = document.querySelector('[data-example-reviews]');
if (reviewsEl) {
  reviewsEl.innerHTML = EXAMPLE_PEOPLE.map(function (p) {
    return '<div class="card example-card"><span class="example-flag">' + EXAMPLE_LABEL + '</span>' +
      '<p class="stars" aria-label="' + p.review.stars + ' out of 5">' + '★★★★★'.slice(0, p.review.stars) + '<span class="stars-off">' + '★★★★★'.slice(p.review.stars) + '</span></p>' +
      '<p style="margin-top:8px;">"' + p.review.text + '"</p>' +
      '<p class="form-note" style="margin-top:10px;">— ' + p.name + ', ' + p.season + '</p></div>';
  }).join('');
}

// Chapter color night: the season spread for the simulated chapter.
var chapterEl = document.querySelector('[data-example-chapter]');
if (chapterEl) {
  var groups = {};
  EXAMPLE_CHAPTER.forEach(function (m) { (groups[m.season] = groups[m.season] || []).push(m.name); });
  var order = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; });
  var max = groups[order[0]].length;
  chapterEl.innerHTML = '<span class="example-flag">Example — simulated chapter of 24 invented members</span>' +
    '<h3 style="font-size:22px;">Example chapter: season spread</h3>' +
    '<p class="form-note" style="margin-top:4px;">' + order.length + ' of the 12 seasons in one chapter. Everyone sees who shares her season.</p>' +
    '<div class="spread">' + order.map(function (k) {
      return '<div class="spread-row"><span class="spread-name">' + k + '</span>' +
        '<span class="spread-bar"><span style="width:' + Math.round(groups[k].length / max * 100) + '%;background:' + SEASONS[k].wear[1][1] + '"></span></span>' +
        '<span class="spread-count">' + groups[k].length + '</span>' +
        '<span class="spread-who">' + groups[k].join(', ') + '</span></div>';
    }).join('') + '</div>';
}
