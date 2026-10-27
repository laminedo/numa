import { skyAt } from './astro.js';

// Numerology + astrology calculations. Dates are plain {y, m, d} objects
// (month 1-12) so nothing depends on the browser's time zone.

export const MASTER = [11, 22, 33];
export const KARMIC = [13, 14, 16, 19];

export const digitSum = (n) => String(Math.abs(n)).split('').reduce((a, c) => a + Number(c), 0);

export function reduce(n, keepMaster = true) {
  while (n > 9 && !(keepMaster && MASTER.includes(n))) n = digitSum(n);
  return n;
}

// Master numbers collapse to their root for table lookups (11 -> 2).
export const root = (n) => (n > 9 ? reduce(n, false) : n);

// ---------- dates ----------
export const pad = (n) => String(n).padStart(2, '0');
export const toISO = (dt) => `${dt.y}-${pad(dt.m)}-${pad(dt.d)}`;
export function parseISO(s) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s || '');
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}
export function today() {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
}
const toUTC = (dt) => Date.UTC(dt.y, dt.m - 1, dt.d);
const fromUTC = (t) => { const x = new Date(t); return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() }; };
export const addDays = (dt, n) => fromUTC(toUTC(dt) + n * 864e5);
export const diffDays = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 864e5);
export const cmp = (a, b) => toUTC(a) - toUTC(b);
export const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export const weekday = (dt) => new Date(toUTC(dt)).getUTCDay();

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const fmtLong = (dt) => `${MONTHS[dt.m - 1]} ${dt.d}, ${dt.y}`;
export const fmtShort = (dt) => `${MONTHS[dt.m - 1].slice(0, 3)} ${dt.d}, ${dt.y}`;
export const fmtNumeric = (dt) => `${dt.m}/${dt.d}/${dt.y}`;
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---------- core numbers ----------
export function lifePath(b) {
  const compound = reduce(b.m) + reduce(b.d) + reduce(b.y);
  return { value: reduce(compound), compound };
}

export const birthdayNumber = (b) => reduce(b.d);

export function karmicDebt(b) {
  const out = new Set();
  if (KARMIC.includes(b.d)) out.add(b.d);
  const { compound } = lifePath(b);
  if (KARMIC.includes(compound)) out.add(compound);
  return [...out];
}

// Personal years run birthday to birthday.
export function personalYearInfo(b, date) {
  let year = date.y;
  if (cmp(date, { y: date.y, m: b.m, d: clampDay(date.y, b.m, b.d) }) < 0) year--;
  const value = reduce(reduce(b.m) + reduce(b.d) + reduce(year));
  const start = { y: year, m: b.m, d: clampDay(year, b.m, b.d) };
  const next = { y: year + 1, m: b.m, d: clampDay(year + 1, b.m, b.d) };
  return { value, year, start, end: addDays(next, -1) };
}

const clampDay = (y, m, d) => Math.min(d, daysInMonth(y, m));
// The birthday as it falls in year y (Feb 29 -> Feb 28 in common years).
export const birthdayIn = (b, y) => ({ y, m: b.m, d: clampDay(y, b.m, b.d) });

// Personal months start on the birth day-of-month.
export function personalMonthInfo(b, date) {
  let { y, m } = date;
  if (date.d < clampDay(y, m, b.d)) { m--; if (m === 0) { m = 12; y--; } }
  const start = { y, m, d: clampDay(y, m, b.d) };
  let ny = y, nm = m + 1; if (nm === 13) { nm = 1; ny++; }
  const end = addDays({ y: ny, m: nm, d: clampDay(ny, nm, b.d) }, -1);
  const py = personalYearInfo(b, date).value;
  return { value: reduce(py + m), month: m, start, end };
}

export const personalDay = (b, date) => reduce(personalMonthInfo(b, date).value + reduce(date.d));

export const universalDay = (date) => reduce(reduce(date.m) + reduce(date.d) + reduce(date.y));
export const universalMonth = (date) => reduce(reduce(date.m) + reduce(date.y));
export const universalYear = (y) => reduce(y);

// Pinnacles and challenges (classic Pythagorean method).
export function pinnacles(b) {
  const m = reduce(b.m, false), d = reduce(b.d, false), y = reduce(b.y, false);
  const lp = root(lifePath(b).value);
  const p1 = reduce(m + d), p2 = reduce(d + y), p3 = reduce(p1 + p2), p4 = reduce(m + y);
  const c1 = Math.abs(m - d), c2 = Math.abs(d - y), c3 = Math.abs(c1 - c2), c4 = Math.abs(m - y);
  const end1 = 36 - lp;
  return [
    { pinnacle: p1, challenge: c1, from: 0, to: end1 },
    { pinnacle: p2, challenge: c2, from: end1 + 1, to: end1 + 9 },
    { pinnacle: p3, challenge: c3, from: end1 + 10, to: end1 + 18 },
    { pinnacle: p4, challenge: c4, from: end1 + 19, to: null },
  ];
}

export function ageOn(b, date) {
  let a = date.y - b.y;
  if (date.m < b.m || (date.m === b.m && date.d < b.d)) a--;
  return a;
}

// ---------- name numerology ----------
const letterValue = (ch) => ((ch.charCodeAt(0) - 65) % 9) + 1;
const VOWELS = 'AEIOU';
export function nameNumbers(name) {
  const letters = (name || '').toUpperCase().normalize('NFD').replace(/[^A-Z]/g, '');
  if (!letters) return null;
  let all = 0, vow = 0, con = 0;
  for (const ch of letters) {
    const v = letterValue(ch);
    all += v;
    if (VOWELS.includes(ch)) vow += v; else con += v;
  }
  return { expression: reduce(all), soulUrge: vow ? reduce(vow) : null, personality: con ? reduce(con) : null, raw: all };
}

// ---------- compatibility ----------
const FRIENDS = { 1: [3, 5, 7, 9], 2: [4, 6, 8, 9], 3: [1, 5, 6, 9], 4: [2, 6, 7, 8], 5: [1, 3, 7, 9], 6: [2, 3, 4, 8, 9], 7: [1, 4, 5], 8: [2, 4, 6], 9: [1, 2, 3, 5, 6] };
const CHALLENGES = { 1: [4, 6], 2: [5, 7], 3: [4, 8], 4: [1, 3, 5], 5: [2, 4, 6], 6: [1, 5, 7], 7: [2, 6, 8], 8: [3, 7, 9], 9: [8] };

export function numberRelation(a, b) {
  const x = root(a), y = root(b);
  if (x === y) return 'same';
  if (FRIENDS[x].includes(y)) return 'friend';
  if (CHALLENGES[x].includes(y)) return 'challenge';
  return 'neutral';
}
const REL_SCORE = { friend: 92, same: 86, neutral: 74, challenge: 58 };
export const numberCompat = (a, b) => REL_SCORE[numberRelation(a, b)];
export const friendNumbers = (n) => FRIENDS[root(n)];
export const challengeNumbers = (n) => CHALLENGES[root(n)];

// Small deterministic wobble so neighbouring days don't look identical.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

export function dayScore(b, date) {
  const lp = lifePath(b).value;
  const ud = universalDay(date), pd = personalDay(b, date);
  let s = 0.6 * numberCompat(lp, ud) + 0.4 * numberCompat(lp, pd);
  if (MASTER.includes(ud)) s += 3;
  if (root(ud) === root(lp)) s += 4;
  s += (hash(toISO(date) + toISO(b)) - 0.5) * 10;
  return Math.max(41, Math.min(99, Math.round(s)));
}

export function nameScore(lp, name) {
  const nn = nameNumbers(name);
  if (!nn) return null;
  const s = numberCompat(lp, nn.expression) + (hash(name.toLowerCase()) - 0.5) * 8;
  return { score: Math.max(40, Math.min(99, Math.round(s))), number: nn.expression };
}

// ---------- Chinese (solar) astrology ----------
export const ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
export const ELEMENTS5 = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

// The solar year starts at Li Chun (about Feb 4).
export function chineseYear(b) {
  let y = b.y;
  if (b.m < 2 || (b.m === 2 && b.d < 4)) y--;
  const animal = ANIMALS[(((y - 4) % 12) + 12) % 12];
  const stem = (((y - 4) % 10) + 10) % 10;
  return { animal, element: ELEMENTS5[Math.floor(stem / 2)], polarity: stem % 2 ? 'Yin' : 'Yang', year: y };
}

// Approximate solar-term starts for each Chinese month.
const MONTH_STARTS = [[1, 6, 'Ox'], [2, 4, 'Tiger'], [3, 6, 'Rabbit'], [4, 5, 'Dragon'], [5, 6, 'Snake'], [6, 6, 'Horse'], [7, 7, 'Goat'], [8, 8, 'Monkey'], [9, 8, 'Rooster'], [10, 8, 'Dog'], [11, 7, 'Pig'], [12, 7, 'Rat']];
export function chineseMonth(b) {
  let animal = 'Rat';
  for (const [m, d, a] of MONTH_STARTS) if (b.m > m || (b.m === m && b.d >= d)) animal = a;
  return animal;
}

export function chineseHour(hhmm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
  if (!m) return null;
  return ANIMALS[Math.floor(((+m[1] + 1) % 24) / 2)];
}

const TRINES = [['Rat', 'Dragon', 'Monkey'], ['Ox', 'Snake', 'Rooster'], ['Tiger', 'Horse', 'Dog'], ['Rabbit', 'Goat', 'Pig']];
const SECRET = [['Rat', 'Ox'], ['Tiger', 'Pig'], ['Rabbit', 'Dog'], ['Dragon', 'Rooster'], ['Snake', 'Monkey'], ['Horse', 'Goat']];
const CLASH = [['Rat', 'Horse'], ['Ox', 'Goat'], ['Tiger', 'Monkey'], ['Rabbit', 'Rooster'], ['Dragon', 'Dog'], ['Snake', 'Pig']];
const pairIn = (list, a, b) => list.some((p) => p.includes(a) && p.includes(b));

export function animalRelation(a, b) {
  if (a === b) return 'same';
  if (pairIn(CLASH, a, b)) return 'clash';
  if (pairIn(SECRET, a, b)) return 'secret friend';
  if (TRINES.some((t) => t.includes(a) && t.includes(b))) return 'trine';
  return 'neutral';
}
export const animalCompat = (a, b) => ({ trine: 94, 'secret friend': 91, same: 80, neutral: 70, clash: 42 })[animalRelation(a, b)];
export const animalAllies = (a) => [...TRINES.find((t) => t.includes(a)).filter((x) => x !== a), SECRET.find((p) => p.includes(a)).find((x) => x !== a)];
export const animalClash = (a) => CLASH.find((p) => p.includes(a)).find((x) => x !== a);

// ---------- Western astrology ----------
export const SIGNS = [
  { name: 'Capricorn', glyph: '♑', start: [12, 22], element: 'Earth', modality: 'Cardinal', ruler: 'Saturn' },
  { name: 'Aquarius', glyph: '♒', start: [1, 20], element: 'Air', modality: 'Fixed', ruler: 'Uranus & Saturn' },
  { name: 'Pisces', glyph: '♓', start: [2, 19], element: 'Water', modality: 'Mutable', ruler: 'Neptune & Jupiter' },
  { name: 'Aries', glyph: '♈', start: [3, 21], element: 'Fire', modality: 'Cardinal', ruler: 'Mars' },
  { name: 'Taurus', glyph: '♉', start: [4, 20], element: 'Earth', modality: 'Fixed', ruler: 'Venus' },
  { name: 'Gemini', glyph: '♊', start: [5, 21], element: 'Air', modality: 'Mutable', ruler: 'Mercury' },
  { name: 'Cancer', glyph: '♋', start: [6, 21], element: 'Water', modality: 'Cardinal', ruler: 'Moon' },
  { name: 'Leo', glyph: '♌', start: [7, 23], element: 'Fire', modality: 'Fixed', ruler: 'Sun' },
  { name: 'Virgo', glyph: '♍', start: [8, 23], element: 'Earth', modality: 'Mutable', ruler: 'Mercury' },
  { name: 'Libra', glyph: '♎', start: [9, 23], element: 'Air', modality: 'Cardinal', ruler: 'Venus' },
  { name: 'Scorpio', glyph: '♏', start: [10, 23], element: 'Water', modality: 'Fixed', ruler: 'Pluto & Mars' },
  { name: 'Sagittarius', glyph: '♐', start: [11, 22], element: 'Fire', modality: 'Mutable', ruler: 'Jupiter' },
];
const ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

export function sunSign(dt) {
  let sign = SIGNS[0];
  for (const s of SIGNS.slice(1)) if (dt.m > s.start[0] || (dt.m === s.start[0] && dt.d >= s.start[1])) sign = s;
  if (dt.m === 12 && dt.d >= 22) sign = SIGNS[0];
  return sign;
}
export const signByName = (n) => SIGNS.find((s) => s.name === n);

export function signRelation(a, b) {
  if (a.name === b.name) return 'same sign';
  const dist = Math.abs(ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
  if (dist === 6) return 'opposites';
  if (a.element === b.element) return 'same element';
  const pair = [a.element, b.element].sort().join('-');
  if (pair === 'Air-Fire' || pair === 'Earth-Water') return 'complementary';
  if (dist === 3 || dist === 9) return 'square';
  return 'neutral';
}
export const signCompat = (a, b) => ({ 'same element': 92, complementary: 86, 'same sign': 82, opposites: 76, neutral: 66, square: 54 })[signRelation(a, b)];

// ---------- moon phase ----------
export function moonPhase(dt) {
  const sky = skyAt(dt, 12);
  return { ...sky.phase, sign: sky.Moon.signName };
}

// ---------- bundled profile ----------
export function chart(b, date = today(), opts = {}) {
  const lp = lifePath(b);
  const cy = chineseYear(b);
  return {
    birth: b,
    lifePath: lp.value,
    compound: lp.compound,
    birthday: birthdayNumber(b),
    karmic: karmicDebt(b),
    personalYear: personalYearInfo(b, date),
    personalMonth: personalMonthInfo(b, date),
    personalDay: personalDay(b, date),
    chinese: cy,
    chineseMonth: chineseMonth(b),
    chineseHour: chineseHour(opts.time),
    sign: sunSign(b),
    name: nameNumbers(opts.name),
    pinnacles: pinnacles(b),
    age: ageOn(b, date),
    lucky: luckyNumbers(b, lp.value),
  };
}

export function luckyNumbers(b, lp) {
  const r = root(lp);
  const a = r * 12;
  const c = ((b.d * b.m + r * 7) % 80) + 10;
  return a === c ? [a, c + 9] : [a, c].sort((x, y) => x - y);
}

export function overallCompat(b1, b2) {
  const c1 = chart(b1), c2 = chart(b2);
  const num = numberCompat(c1.lifePath, c2.lifePath);
  const ani = animalCompat(c1.chinese.animal, c2.chinese.animal);
  const sig = signCompat(c1.sign, c2.sign);
  return {
    score: Math.round(num * 0.5 + ani * 0.25 + sig * 0.25),
    num, ani, sig,
    numRel: numberRelation(c1.lifePath, c2.lifePath),
    aniRel: animalRelation(c1.chinese.animal, c2.chinese.animal),
    sigRel: signRelation(c1.sign, c2.sign),
    a: c1, b: c2,
  };
}
