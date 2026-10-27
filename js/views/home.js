import * as E from '../engine.js';
import { num } from '../content.js';
import { forecast, scoreColor, dayReading } from '../insights.js';
import { icon, logo } from '../icons.js';
import { esc, sectionTitle } from '../ui.js';

const TOOLS = [
  ['Compatibility', 'rings', '#/search?tool=checker'],
  ['Forecasts', 'chart', '#/calendar?view=monthly'],
  ['Study', 'book', '#/calc?tab=study'],
  ['Explore', 'globe', '#/search'],
  ['Horoscopes', 'sun', '#/readings'],
  ['Western', 'target', '#/calc?tab=western'],
  ['For You', 'sparkle', '#/search?cat=people'],
  ['Ask Numa', 'chat', '#/chat'],
];

export function home({ profile, date }) {
  const b = E.parseISO(profile.birth);
  const ud = E.universalDay(date);
  const sign = E.sunSign(date);
  const days = forecast(b, date, 14);
  const r = dayReading(b, date);
  const moon = E.moonPhase(date);

  return `
  <header class="top">
    <div class="brand">${logo(44)}<div><div class="muted-strong">${E.WEEKDAYS[E.weekday(date)]},</div><div class="muted-strong">${E.MONTHS[date.m - 1]} ${date.d}</div></div></div>
    <button class="icon-btn round" data-action="notifications" aria-label="Today's highlights">${icon('bell')}${r.events.length ? '<i class="dot"></i>' : ''}</button>
  </header>

  <section class="hero">
    <div class="hero-copy">
      <div class="eyebrow">Your energy calendar</div>
      <h1>See what's<br>ahead</h1>
      <a class="btn gold" href="#/calendar">Plan ${icon('calendar', 20)}</a>
    </div>
    <div class="strip glass" role="list">
      ${days.map((d, i) => `
        <a class="strip-day ${i === 0 ? 'is-today' : ''}" role="listitem" href="#/calendar?d=${E.toISO(d.date)}">
          <span class="dow">${E.WEEKDAYS[E.weekday(d.date)].slice(0, 3).toUpperCase()}</span>
          <span class="dnum">${d.date.d}</span>
          <span class="bar"><i style="height:${d.score}%;background:${scoreColor(d.score)}"></i></span>
          <span class="pct" style="color:${scoreColor(d.score)}">${d.score}%</span>
        </a>`).join('')}
    </div>
  </section>

  <a class="uday glass" href="#/calendar">
    <span class="badge-num">${ud}</span>
    <span class="uday-text"><b>Universal ${ud} Day</b><small>The ${E.ordinal(date.d)} • ${sign.name} Season • ${moon.name}</small></span>
    ${icon('right')}
  </a>

  <div class="today-row">
    <div class="mini glass"><small>Your day</small><b style="color:${scoreColor(r.score)}">${r.score}%</b><span>${esc(r.title)}</span></div>
    <div class="mini glass"><small>Personal day</small><b>${r.pd}</b><span>${esc(num(r.pd).day.title)}</span></div>
    <div class="mini glass"><small>Moon</small><b>${moon.illumination}%</b><span>${moon.name}</span></div>
  </div>

  ${sectionTitle('Explore your tools', '<a class="link" href="#/search">All tools</a>')}
  <div class="tools">
    ${TOOLS.map(([label, ic, href]) => `<a class="tool" href="${href}"><span class="tool-ic glass">${icon(ic, 30)}</span><span>${label}</span></a>`).join('')}
  </div>

  <form class="ask" data-action="ask">
    <span class="orb"></span>
    <input name="q" placeholder="Ask Numa anything" autocomplete="off" aria-label="Ask Numa anything">
    <button class="icon-btn" aria-label="Send">${icon('arrow')}</button>
  </form>`;
}
