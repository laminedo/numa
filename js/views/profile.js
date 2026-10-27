import * as E from '../engine.js';
import { num, ANIMAL_INFO } from '../content.js';
import { icon, logo } from '../icons.js';
import { esc } from '../ui.js';
import { store } from '../store.js';

export function profileView({ profile, date, params }) {
  const b = E.parseISO(profile.birth);
  const c = E.chart(b, date, profile);
  const hide = params.get('hide') === '1';
  const since = profile.createdAt ? new Date(profile.createdAt) : new Date();
  return `
  <header class="center-head"><h2>Your Energy Profile</h2><button class="icon-btn" data-action="settings" aria-label="Edit profile">${icon('sliders')}</button></header>
  <div class="glass card idcard">
    <div class="idtop"><span class="brand">${logo(30)}<b>NUMA</b></span><small>${icon('star', 14)} Free forever</small></div>
    <hr>
    <h2>${esc(profile.name || 'Your name')}</h2>
    ${profile.email ? `<p class="muted">${esc(profile.email)}</p>` : ''}
    <p class="muted">Member since ${E.MONTHS[since.getMonth()].slice(0, 3)} ${since.getFullYear()}</p>
    <div class="trio">
      <a href="#/calc"><b class="huge thin">${c.lifePath}</b><span>Life Path</span></a>
      <a href="#/calc?tab=chinese"><b class="glyph cn">${ANIMAL_INFO[c.chinese.animal].char}</b><span>${c.chinese.animal}</span></a>
      <a href="#/calc?tab=western"><b class="glyph">${c.sign.glyph}&#xFE0E;</b><span>${c.sign.name}</span></a>
    </div>
    <div class="rows">
      <div><span>Birthday</span><b>${hide ? '•••• ••, ••••' : E.fmtLong(b)} <a class="icon-btn sm" href="#/profile${hide ? '' : '?hide=1'}" aria-label="Toggle birthday">${icon('eye', 18)}</a></b></div>
      <div><span>Time Born</span>${profile.time ? `<b>${esc(profile.time)} · ${c.chineseHour} hour</b>` : `<button class="btn ghost small" data-action="settings">${icon('plus', 16)} Add</button>`}</div>
      <div><span>Earth Astrology</span><b>Year of the ${c.chinese.element} ${c.chinese.animal}</b></div>
      <div><span>Earth Month</span><b>${c.chineseMonth} Month</b></div>
      <div><span>Western Zodiac</span><b>${c.sign.name} Season</b></div>
      ${c.name ? `<div><span>Expression</span><b>${c.name.expression} · ${esc(num(c.name.expression).title)}</b></div>` : ''}
      <div><span>Lucky Numbers</span><b class="lucky">${c.lucky.join(' · ')}</b></div>
    </div>
  </div>
  <button class="btn gold wide" data-action="share-card">${icon('share', 20)} Share my card</button>
  <div class="glass card timing">
    <small class="eyebrow">YOUR TIMING</small>
    <div class="split">
      <div><b class="huge thin">${c.personalYear.value}</b><span>Personal Year</span><small>Until ${E.fmtShort(c.personalYear.end)}</small><p>${esc(num(c.personalYear.value).year.title)}</p></div>
      <div><b class="huge thin">${c.personalMonth.value}</b><span>Personal Month</span><small>Until ${E.fmtShort(c.personalMonth.end)}</small><p>${esc(num(c.personalMonth.value).day.title)}</p></div>
    </div>
  </div>
  <div class="glass card">
    <h4>Saved charts</h4>
    ${store.saved.length ? store.saved.map((s) => `<a class="past" href="#/calc?d=${s.date}"><b>${esc(s.label)}</b><span>${E.fmtLong(E.parseISO(s.date))} · LP ${E.lifePath(E.parseISO(s.date)).value}</span></a>`).join('') : '<p class="muted">Bookmark any chart in the Calculator to keep it here.</p>'}
  </div>
  <div class="glass card">
    <h4>Your data</h4>
    <p class="muted">Profile, journal and saved charts live only in this browser. Nothing is sent anywhere.</p>
    <p class="muted small">App version ${esc(document.querySelector('meta[name=app-version]')?.content || 'dev')}</p>
    <div class="row-btns"><button class="btn ghost small" data-action="export">Export journal</button><button class="btn ghost small danger" data-action="reset">Reset app</button></div>
  </div>`;
}

export const onboarding = (p = {}) => `
  <div class="onboard">
    ${logo(72)}
    <h1>Welcome to Numa</h1>
    <p class="muted">Your numerology, Chinese and Western astrology in one place. Everything stays on this device.</p>
    <form class="glass card" data-action="profile">
      <label>Your name<input name="name" value="${esc(p.name || '')}" placeholder="Full birth name" autocomplete="name"></label>
      <label>Email (optional)<input name="email" type="email" value="${esc(p.email || '')}" placeholder="you@example.com" autocomplete="email"></label>
      <label>Birthdate<input name="birth" type="date" value="${esc(p.birth || '')}" required max="2100-12-31"></label>
      <label>Birth time (optional)<input name="time" type="time" value="${esc(p.time || '')}"></label>
      <button class="btn gold wide">${p.birth ? 'Save' : 'Reveal my numbers'}</button>
    </form>
  </div>`;
