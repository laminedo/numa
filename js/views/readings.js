import * as E from '../engine.js';
import { allSigns, skySummary, stars, weekStart, SIGN_NAMES } from '../horoscope.js';
import { icon } from '../icons.js';
import { esc, sectionTitle } from '../ui.js';
import { store } from '../store.js';

const PERIODS = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']];

export function readings({ profile, date, params }) {
  const period = PERIODS.some(([p]) => p === params.get('p')) ? params.get('p') : 'daily';
  const sel = E.parseISO(params.get('d')) || date;
  const mine = SIGN_NAMES.indexOf(E.sunSign(E.parseISO(profile.birth)).name);
  const all = allSigns(period, sel);
  const sum = skySummary(period, sel);
  const order = [mine, ...SIGN_NAMES.map((_, i) => i).filter((i) => i !== mine)];
  const step = (dir) => period === 'daily' ? E.addDays(sel, dir) : period === 'weekly' ? E.addDays(weekStart(sel), 7 * dir) : { y: sel.m + dir > 12 ? sel.y + 1 : sel.m + dir < 1 ? sel.y - 1 : sel.y, m: ((sel.m + dir + 11) % 12) + 1, d: 1 };
  const href = (p, d) => `#/readings?p=${p}&d=${E.toISO(d)}`;

  return `
  <header class="cal-top">
    <nav class="seg glass">${PERIODS.map(([p, l]) => `<a class="${period === p ? 'on' : ''}" href="${href(p, sel)}">${l}</a>`).join('')}</nav>
    <a class="link" href="${href(period, date)}">Today</a>
  </header>
  <div class="week-head">
    <a class="icon-btn" href="${href(period, step(-1))}" aria-label="Previous">${icon('left')}</a>
    <b>${esc(all[0].label)}</b>
    <a class="icon-btn" href="${href(period, step(1))}" aria-label="Next">${icon('right')}</a>
  </div>

  <div class="glass card sky-card">
    <small class="eyebrow">The sky ${period === 'daily' ? 'today' : period === 'weekly' ? 'this week' : 'this month'}</small>
    <div class="sky-grid">${['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].map((b) => `<div><span>${b}</span><b>${sum.sky[b].signName}${sum.sky[b].retro ? ' <em>Rx</em>' : ''}</b></div>`).join('')}<div><span>Moon phase</span><b>${sum.phase}</b></div><div><span>${sum.number.label}</span><b>${sum.number.value}</b></div></div>
    ${sum.events.length ? `<ul class="events">${sum.events.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
  </div>

  <div class="glass card export" data-p="${period}" data-d="${E.toISO(sel)}">
    <h3>Share on Facebook</h3>
    <p class="muted">Each sign is drawn on 1080×1350 portrait pages, the size Facebook shows best, after a cover with the sky and numerology for the ${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}. Download the full set as one PDF, share the pages as photos, or copy ready-made post text.</p>
    <label class="brand-field">Name printed on the pages<input name="brand" value="${esc(store.brand)}" placeholder="Your Facebook page name (optional)" maxlength="40"></label>
    <div class="row-btns">
      <button class="btn gold small" data-action="export-pdf">${icon('book', 18)} Download PDF</button>
      <button class="btn ghost small" data-action="export-images">${icon('share', 18)} Share as photos</button>
      <button class="btn ghost small" data-action="copy-all">${icon('chat', 18)} Copy post text</button>
    </div>
  </div>

  ${sectionTitle(`${period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'} readings`)}
  <div class="signs">
    ${order.map((s) => signCard(all[s], s, s === mine)).join('')}
  </div>
  <p class="muted small center">Readings use real planetary positions counted from each sign (solar houses). For reflection and entertainment.</p>`;
}

function signCard(r, s, mine) {
  return `
  <details class="glass sign-card ${mine ? 'mine' : ''}" ${mine ? 'open' : ''}>
    <summary>
      <span class="sg el-${r.element.toLowerCase()}">${r.glyph}&#xFE0E;</span>
      <span class="sg-head"><b>${r.sign}${mine ? ' <i class="you">Your sign</i>' : ''}</b><small>${r.dates} · ${r.element}</small></span>
      <span class="sg-right"><span class="rating" aria-label="${r.rating} out of 5">${stars(r.rating)}</span><small>${esc(r.headline)}</small></span>
      ${icon('down', 20, 'chev')}
    </summary>
    <div class="sign-body">
      <h3>${esc(r.headline)}</h3>
      ${r.sections.map((x) => `<h4 class="cap">${esc(x.title)}</h4><p>${esc(x.text)}</p>`).join('')}
      <div class="facts">
        <div class="fact"><span>Focus</span><b>${esc(r.focus.join(', '))}</b></div>
        <div class="fact"><span>Avoid</span><b>${esc(r.avoid.join(', '))}</b></div>
        ${r.period === 'daily'
          ? `<div class="fact"><span>Lucky</span><b>${r.lucky.number} · ${esc(r.lucky.color)} · ${esc(r.lucky.time)}</b></div>`
          : `<div class="fact"><span>Best days</span><b>${esc(r.lucky.days.join(', '))}</b></div><div class="fact"><span>Go gently</span><b>${esc(r.lucky.gentle.join(', ') || '—')}</b></div>`}
      </div>
      <div class="row-btns">
        <button class="btn ghost small" data-action="sign-image" data-s="${s}">${icon('share', 16)} Image</button>
        <button class="btn ghost small" data-action="sign-copy" data-s="${s}">${icon('chat', 16)} Copy text</button>
      </div>
    </div>
  </details>`;
}
