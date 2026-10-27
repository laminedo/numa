// Run with: node tests/run.mjs
import assert from 'node:assert/strict';
import * as E from '../js/engine.js';
import * as A from '../js/astro.js';
import * as H from '../js/horoscope.js';
import { jpegsToPdf } from '../js/pdf.js';
import { search } from '../js/views/search.js';
import { calendar } from '../js/views/calendar.js';
import { calculator } from '../js/views/calculator.js';
import { readings } from '../js/views/readings.js';

let passed = 0;
const test = async (name, fn) => {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
};
const D = (y, m, d) => ({ y, m, d });
const iso = (d) => E.toISO(d);

console.log('numerology');
await test('core numbers for 3/3/1986 on 10/27/2026', () => {
  const c = E.chart(D(1986, 3, 3), D(2026, 10, 27));
  assert.equal(c.lifePath, 3);
  assert.equal(c.personalYear.value, 7);
  assert.equal(iso(c.personalYear.end), '2027-03-02');
  assert.equal(c.personalMonth.value, 8);
  assert.equal(iso(c.personalMonth.end), '2026-11-02');
  assert.equal(E.universalDay(D(2026, 10, 27)), 11);
});
await test('master numbers are kept', () => {
  assert.equal(E.reduce(29), 11);
  assert.equal(E.reduce(22), 22);
  assert.equal(E.lifePath(D(1985, 11, 29)).value, E.reduce(11 + 11 + E.reduce(1985)));
});
await test('nine-year cycle is right for birthdays on the 29th-31st', () => {
  const b = D(1990, 5, 30);
  assert.equal(E.personalYearInfo(b, E.birthdayIn(b, 2026)).year, 2026);
  assert.equal(E.personalYearInfo(b, D(2026, 5, 29)).year, 2025);
});
await test('Feb 29 birthdays fall on Feb 28 in common years', () => {
  assert.deepEqual(E.birthdayIn(D(1988, 2, 29), 2027), D(2027, 2, 28));
  assert.equal(E.personalYearInfo(D(1988, 2, 29), D(2027, 2, 28)).year, 2027);
});

console.log('astrology');
await test('Chinese and Western signs', () => {
  assert.deepEqual(E.chineseYear(D(1986, 3, 3)), { animal: 'Tiger', element: 'Fire', polarity: 'Yang', year: 1986 });
  assert.equal(E.chineseYear(D(1986, 2, 3)).animal, 'Ox');
  assert.equal(E.chineseMonth(D(1986, 3, 3)), 'Tiger');
  assert.equal(E.sunSign(D(2000, 1, 19)).name, 'Capricorn');
  assert.equal(E.sunSign(D(2000, 12, 22)).name, 'Capricorn');
  assert.equal(E.sunSign(D(2000, 3, 21)).name, 'Aries');
});
await test('Moon phases match the 2026 eclipses', () => {
  assert.equal(E.moonPhase(D(2026, 3, 3)).name, 'Full Moon');
  assert.equal(E.moonPhase(D(2026, 8, 12)).name, 'New Moon');
  assert.equal(E.moonPhase(D(2026, 8, 28)).name, 'Full Moon');
});
await test('planet sign changes and retrogrades in 2026', () => {
  const ev = A.events(D(2026, 1, 1), 365);
  const find = (type, body, retro, month) => ev.find((e) => e.type === type && e.body === body && (retro === undefined || e.retro === retro) && e.date.m === month);
  assert.ok(find('station', 'Mercury', true, 2), 'Mercury retrograde late Feb');
  assert.ok(find('station', 'Mercury', true, 6), 'Mercury retrograde late Jun');
  assert.ok(find('station', 'Mercury', true, 10), 'Mercury retrograde late Oct');
  assert.equal(find('ingress', 'Saturn', undefined, 2)?.sign, 'Aries');
  assert.equal(find('ingress', 'Jupiter', undefined, 6)?.sign, 'Leo');
  // March equinox 2026: 14:46 UTC. Checked in UTC so the result doesn't depend on the machine's time zone.
  const lon = A.longitude('Sun', Date.UTC(2026, 2, 20, 14, 46) / 864e5 + 2440587.5);
  assert.ok(Math.min(lon, 360 - lon) < 0.1, `Sun at 0° Aries on the equinox (got ${lon.toFixed(3)})`);
});

console.log('horoscopes');
await test('every sign, period and date produces clean text', () => {
  for (const p of ['daily', 'weekly', 'monthly']) for (let i = 0; i < 24; i++) {
    const d = D(2026 + Math.floor(i / 12), (i % 12) + 1, 1 + (i * 9) % 28);
    for (const r of H.allSigns(p, d)) {
      const t = H.captionFor(r, 'https://example.com/');
      assert.doesNotMatch(t, /undefined|NaN|\.\.(?!\.)|\[object/, `${p} ${r.sign} ${iso(d)}`);
      assert.ok(r.rating >= 2 && r.rating <= 5);
    }
  }
});
await test('weekly readings start on Monday', () => {
  assert.equal(E.weekday(H.weekStart(D(2026, 10, 27))), 1);
  assert.equal(E.weekday(H.weekStart(D(2026, 11, 1))), 1);
});

console.log('pdf');
await test('PDF cross-reference offsets point at their objects', async () => {
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const blob = jpegsToPdf([{ bytes: fakeJpeg, w: 1, h: 1 }, { bytes: fakeJpeg, w: 1, h: 1 }], { width: 432, height: 540, title: 'Test (1)' });
  const bin = Buffer.from(await blob.arrayBuffer()).toString('latin1');
  const at = +bin.match(/startxref\n(\d+)/)[1];
  assert.ok(bin.startsWith('xref', at));
  const offsets = bin.slice(at).split('\n').filter((l) => / n $/.test(l)).map((l) => +l.slice(0, 10));
  assert.equal(offsets.length, 3 + 2 * 3);
  offsets.forEach((o, i) => assert.ok(bin.startsWith(`${i + 1} 0 obj`, o), `object ${i + 1}`));
  assert.match(bin, /\/Count 2/);
  assert.match(bin, /\/Title \(Test \\\(1\\\)\)/);
});

console.log('screens');
const profile = { name: 'Test', birth: '1986-03-03', time: '' };
const P = (qs) => new URLSearchParams(qs);
await test('search treats names as names, not categories', () => {
  assert.doesNotMatch(search({ profile, date: D(2026, 10, 27), params: P('q=Carlos') }), /Cars ranked/);
  assert.match(search({ profile, date: D(2026, 10, 27), params: P('q=best cars for me') }), /Cars ranked/);
  assert.match(search({ profile, date: D(2026, 10, 27), params: P('q=cities that match me') }), /Locations ranked/);
});
await test('calendar survives an unknown tab parameter', () => {
  assert.match(calendar({ profile, date: D(2026, 10, 27), params: P('u=oops') }), /Understand Today/);
});
await test('calculator falls back to the profile on a bad date', () => {
  assert.match(calculator({ profile, date: D(2026, 10, 27), params: P('d=nonsense') }), /value="1986-03-03"/);
});
await test('horoscope screen renders all periods', () => {
  for (const p of ['daily', 'weekly', 'monthly']) assert.equal((readings({ profile, date: D(2026, 10, 27), params: P(`p=${p}`) }).match(/class="glass sign-card/g) || []).length, 12);
});

console.log(`\n${passed} passed${process.exitCode ? ', some failed' : ''}`);
