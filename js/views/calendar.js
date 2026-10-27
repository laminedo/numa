import * as E from '../engine.js';
import { num } from '../content.js';
import { dayReading, forecast, scoreColor } from '../insights.js';
import { icon } from '../icons.js';
import { esc, list, sectionTitle } from '../ui.js';
import { store } from '../store.js';

export function calendar({ profile, date, params }) {
  const b = E.parseISO(profile.birth);
  const view = params.get('view') || 'today';
  const sel = E.parseISO(params.get('d')) || date;
  const body = view === 'monthly' ? monthly(b, sel, date) : view === 'yearly' ? yearly(b, sel) : todayView(b, sel, date, params.get('u') || 'lifepath');
  return `
  <header class="cal-top">
    <nav class="seg glass">${['today', 'monthly', 'yearly'].map((v) => `<a class="${view === v ? 'on' : ''}" href="#/calendar?view=${v}&d=${E.toISO(sel)}">${v[0].toUpperCase() + v.slice(1)}</a>`).join('')}</nav>
    <div class="seg glass icons">
      <a href="#/search" aria-label="Search">${icon('search', 20)}</a>
      <button data-action="notifications" aria-label="Highlights">${icon('bell', 20)}</button>
      <button data-action="share-day" data-d="${E.toISO(sel)}" aria-label="Share">${icon('share', 20)}</button>
    </div>
  </header>
  ${body}`;
}

function todayView(b, sel, now, under) {
  const start = E.addDays(sel, -E.weekday(sel));
  const week = Array.from({ length: 7 }, (_, i) => E.addDays(start, i));
  const r = dayReading(b, sel);
  const f = forecast(b, sel, 14);
  const isToday = E.cmp(sel, now) === 0;
  const lpN = num(r.lp), dayN = num(r.ud);
  const tabsHref = (u) => `#/calendar?view=today&d=${E.toISO(sel)}&u=${u}`;
  const under_ = {
    lifepath: { badge: r.ud, eyebrow: `${r.ud} Life Path Day`, title: r.title, kw: r.keywords, bring: r.bring, good: r.good, watch: r.watch },
    day: { badge: r.pd, eyebrow: `Personal Day ${r.pd}`, title: r.personal.title, kw: r.personal.keywords, bring: `Your own cycle today: ${r.personal.text}`, good: r.personal.good, watch: r.personal.watch },
    combo: { badge: r.lp, eyebrow: `Life Path ${r.lp} × Day ${r.ud}`, title: r.combo.title, kw: [lpN.title.replace(' (Master)', ''), dayN.day.keywords[0], `${r.score}%`], bring: r.combo.text, good: r.combo.good, watch: r.combo.watch },
  }[under] || {};

  return `
  <div class="week-head">
    <a class="icon-btn" href="#/calendar?view=today&d=${E.toISO(E.addDays(sel, -7))}" aria-label="Previous week">${icon('left')}</a>
    <b>${E.WEEKDAYS[E.weekday(sel)]} - ${E.fmtLong(sel)}</b>
    <a class="icon-btn" href="#/calendar?view=today&d=${E.toISO(E.addDays(sel, 7))}" aria-label="Next week">${icon('right')}</a>
  </div>
  <div class="week">${week.map((d) => `<a href="#/calendar?view=today&d=${E.toISO(d)}" class="${E.cmp(d, sel) === 0 ? 'on' : ''} ${E.cmp(d, now) === 0 ? 'now' : ''}"><small>${E.WEEKDAYS[E.weekday(d)][0]}</small><b>${d.d}</b></a>`).join('')}</div>
  ${isToday ? '' : `<a class="link center" href="#/calendar">Back to today</a>`}

  ${sectionTitle(isToday ? "Today's Energy" : `Energy for ${E.MONTHS[sel.m - 1]} ${sel.d}`)}
  <div class="glass card energy">
    <div class="energy-top">
      <div class="stat"><b class="hot">${r.ud}</b><span>Life Path Day</span></div>
      <div class="ring" style="--p:${r.score};--c:${scoreColor(r.score)}"><span>${r.score}%</span><small>for you</small></div>
      <div class="stat"><b class="hot">${sel.d}<sup>${E.ordinal(sel.d).slice(-2)}</sup></b><span>Of the Month</span></div>
    </div>
    <h3>${esc(r.title)}</h3>
    <p>${esc(r.text)}</p>
    <div class="theme-pills">${r.themes.map((t) => `<span class="pill2">${icon(themeIcon(t), 18)} ${esc(t)}</span>`).join('')}</div>
    <a class="btn gold wide" href="#/chat?q=${encodeURIComponent(isToday ? 'What is my energy today?' : 'Tell me about this week')}">Get ${isToday ? "Today's" : 'This Day\'s'} Reading</a>
  </div>

  ${r.events.map((e) => `<div class="glass card event ${e.kind}"><span class="ev-ic">${icon(e.kind === 'warn' ? 'alert' : e.kind === 'good' ? 'zap' : 'moon', 34)}</span><div><small>ENERGY EVENT</small><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p></div></div>`).join('')}

  ${sectionTitle('Energy Forecast')}
  <div class="glass card">
    <div class="fc">${f.map((d) => `<a href="#/calendar?view=today&d=${E.toISO(d.date)}" class="${E.cmp(d.date, sel) === 0 ? 'on' : ''}" title="${E.fmtShort(d.date)}: ${d.score}%"><span class="fc-bar"><i style="height:${d.score}%;background:${scoreColor(d.score)}"></i></span><small>${E.WEEKDAYS[E.weekday(d.date)][0]}</small><b>${d.date.d}</b></a>`).join('')}</div>
    <p class="muted">Best upcoming: ${[...f].slice(1).sort((a, c) => c.score - a.score).slice(0, 3).map((d) => `<b>${E.WEEKDAYS[E.weekday(d.date)].slice(0, 3)} ${d.date.d}</b> (${d.score}%)`).join(', ')}</p>
  </div>

  ${sectionTitle('Understand Today')}
  <div class="glass card">
    <nav class="seg3">${[['lifepath', 'Life Path'], ['day', 'Day'], ['combo', 'Combo']].map(([k, l]) => `<a class="${under === k ? 'on' : ''}" href="${tabsHref(k)}">${l}</a>`).join('')}</nav>
    <div class="under">
      <span class="hex">${under_.badge}</span>
      <div><small class="eyebrow">${esc(under_.eyebrow)}</small><h3>${esc(under_.title)}</h3><p class="kw">${under_.kw.map(esc).join(' • ')}</p></div>
    </div>
    <h4 class="cap">What today may bring</h4><p>${esc(under_.bring)}</p><hr>
    <h4 class="cap good">Good for</h4>${list(under_.good, 'good')}
    <h4 class="cap bad">Watch for</h4>${list(under_.watch, 'bad')}
  </div>

  ${journal(sel, r, now)}`;
}

const themeIcon = (t) => ({ Emotion: 'heart', Love: 'heart', Spirituality: 'lotus', Intuition: 'eye', Completion: 'check', Release: 'check', Reflection: 'moon', Study: 'book', Money: 'bank', Power: 'zap', Abundance: 'bank', Achievement: 'trophy', Home: 'home', Travel: 'plane', Change: 'pulse', Freedom: 'plane', Adventure: 'globe', Partnership: 'users', Creativity: 'palette', Expression: 'chat', Joy: 'sun' }[t] || 'sparkle');

function journal(sel, r, now) {
  const iso = E.toISO(sel);
  const j = store.journal(iso) || {};
  const picked = j.themes || [];
  const hoursLeft = E.cmp(sel, now) === 0 ? (() => { const n = new Date(); const m = 24 * 60 - (n.getHours() * 60 + n.getMinutes()); return `${Math.floor(m / 60)}H ${m % 60}M`; })() : '';
  const past = store.journalDates.filter((d) => d !== iso).slice(0, 5);
  return `
  ${sectionTitle('Morning Energy Journal')}
  <form class="glass card journal" data-action="journal" data-d="${iso}">
    ${hoursLeft ? `<span class="timer">${icon('clock', 18)} ${hoursLeft}</span>` : ''}
    <h3>How will you use ${E.cmp(sel, now) === 0 ? "today's" : 'this day\'s'} energy?</h3>
    <p class="muted">Pick a theme (optional) or just write. Select one or more.</p>
    <div class="themes">${r.themes.map((t) => `<label class="theme ${picked.includes(t) ? 'on' : ''}"><input type="checkbox" name="theme" value="${esc(t)}" ${picked.includes(t) ? 'checked' : ''}>${icon(themeIcon(t), 44)}<span>${esc(t.toUpperCase())}</span></label>`).join('')}</div>
    <label class="ta"><textarea name="text" maxlength="280" placeholder="What do you want to do today?">${esc(j.text || '')}</textarea><small class="count">${(j.text || '').length} OF 280</small></label>
    <label class="ta"><textarea name="evening" maxlength="280" placeholder="Evening reflection: how did it go?">${esc(j.evening || '')}</textarea></label>
    <button class="btn gold wide">${j.at ? 'Update Journal' : 'Log Morning Plan'}</button>
    <p class="muted small">Your journal is saved only in this browser.</p>
  </form>
  ${past.length ? `<div class="glass card"><h4>Recent entries</h4>${past.map((d) => { const e = store.journal(d); return `<a class="past" href="#/calendar?view=today&d=${d}"><b>${E.fmtShort(E.parseISO(d))}</b><span>${esc((e.themes || []).join(', '))}</span><p>${esc(e.text || '')}</p></a>`; }).join('')}</div>` : ''}`;
}

function monthly(b, sel, now) {
  const first = { y: sel.y, m: sel.m, d: 1 };
  const n = E.daysInMonth(sel.y, sel.m);
  const lead = E.weekday(first);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => ({ y: sel.y, m: sel.m, d: i + 1 }))];
  const pm = E.personalMonthInfo(b, { ...sel, d: Math.min(Math.max(b.d, 1), n) });
  const prev = sel.m === 1 ? { y: sel.y - 1, m: 12, d: 1 } : { y: sel.y, m: sel.m - 1, d: 1 };
  const next = sel.m === 12 ? { y: sel.y + 1, m: 1, d: 1 } : { y: sel.y, m: sel.m + 1, d: 1 };
  const scores = Array.from({ length: n }, (_, i) => ({ d: i + 1, s: E.dayScore(b, { y: sel.y, m: sel.m, d: i + 1 }) }));
  const top = [...scores].sort((a, c) => c.s - a.s).slice(0, 5).sort((a, c) => a.d - c.d);
  const low = [...scores].sort((a, c) => a.s - c.s).slice(0, 3).sort((a, c) => a.d - c.d);
  return `
  <div class="week-head">
    <a class="icon-btn" href="#/calendar?view=monthly&d=${E.toISO(prev)}">${icon('left')}</a><b>${E.MONTHS[sel.m - 1]} ${sel.y}</b><a class="icon-btn" href="#/calendar?view=monthly&d=${E.toISO(next)}">${icon('right')}</a>
  </div>
  <div class="glass card">
    <div class="month">
      ${E.WEEKDAYS.map((w) => `<small class="wd">${w[0]}</small>`).join('')}
      ${cells.map((d) => d ? (() => { const s = E.dayScore(b, d); return `<a class="mc ${E.cmp(d, now) === 0 ? 'now' : ''}" href="#/calendar?view=today&d=${E.toISO(d)}" style="--c:${scoreColor(s)}"><b>${d.d}</b><i>${E.universalDay(d)}</i><span>${s}%</span>${store.journal(E.toISO(d)) ? '<em class="jdot"></em>' : ''}</a>`; })() : '<span></span>').join('')}
    </div>
    <div class="legend"><span style="--c:var(--teal)">90+</span><span style="--c:var(--green)">75+</span><span style="--c:var(--amber)">62+</span><span style="--c:var(--rose)">lower</span></div>
  </div>
  <div class="glass card"><small class="eyebrow">Personal Month ${pm.value}</small><h3>${esc(num(pm.value).day.title)}</h3><p>${esc(num(pm.value).month)}</p><p class="muted">Universal Month ${E.universalMonth(sel)} • Your cycle runs ${E.fmtShort(pm.start)} – ${E.fmtShort(pm.end)}</p>
    <h4 class="cap good">Best days</h4><p>${top.map((t) => `<b>${E.MONTHS[sel.m - 1].slice(0, 3)} ${t.d}</b> (${t.s}%)`).join(', ')}</p>
    <h4 class="cap bad">Go gently</h4><p>${low.map((t) => `${E.MONTHS[sel.m - 1].slice(0, 3)} ${t.d} (${t.s}%)`).join(', ')}</p></div>`;
}

function yearly(b, sel) {
  const y = sel.y;
  const py = E.personalYearInfo(b, { y, m: b.m, d: Math.min(b.d, 28) });
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = { y, m: i + 1, d: Math.min(b.d, E.daysInMonth(y, i + 1)) };
    const pm = E.personalMonthInfo(b, d);
    const avg = Math.round(Array.from({ length: E.daysInMonth(y, i + 1) }, (_, k) => E.dayScore(b, { y, m: i + 1, d: k + 1 })).reduce((a, c) => a + c, 0) / E.daysInMonth(y, i + 1));
    return `<a class="ym glass" href="#/calendar?view=monthly&d=${y}-${E.pad(i + 1)}-01"><small>${E.MONTHS[i].slice(0, 3).toUpperCase()}</small><b>${pm.value}</b><span>${esc(num(pm.value).day.title)}</span><i class="meter"><i style="width:${avg}%;background:${scoreColor(avg)}"></i></i><em>${avg}% avg</em></a>`;
  }).join('');
  return `
  <div class="week-head">
    <a class="icon-btn" href="#/calendar?view=yearly&d=${y - 1}-01-01">${icon('left')}</a><b>${y}</b><a class="icon-btn" href="#/calendar?view=yearly&d=${y + 1}-01-01">${icon('right')}</a>
  </div>
  <div class="glass card"><small class="eyebrow">Personal Year ${py.value} from your ${y} birthday</small><h3>${esc(num(py.value).year.title)}</h3><p>${esc(num(py.value).year.text)}</p><p class="muted">Universal Year ${E.universalYear(y)} • ${E.fmtShort(py.start)} – ${E.fmtShort(py.end)}</p></div>
  <div class="ygrid">${months}</div>`;
}
