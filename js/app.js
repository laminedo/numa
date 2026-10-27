import * as E from './engine.js';
import { num, ANIMAL_INFO } from './content.js';
import { answer, dayReading } from './insights.js';
import { store } from './store.js';
import { icon } from './icons.js';
import { esc, md, toast, sheet } from './ui.js';
import { home } from './views/home.js';
import { calculator } from './views/calculator.js';
import { calendar } from './views/calendar.js';
import { search } from './views/search.js';
import { profileView, onboarding } from './views/profile.js';
import { readings } from './views/readings.js';
import { exportPdf, exportImages, exportSign, signCaption, allCaption } from './export.js';

const NAV = [['home', 'Home', 'home'], ['calc', 'Calculator', 'calculator'], ['calendar', 'Calendar', 'calendar'], ['search', 'Search', 'search'], ['profile', 'Profile', 'user']];
const ROUTES = { home, calc: calculator, calendar, search, profile: profileView, chat: chatView, readings };

const app = document.getElementById('app');

function parseHash() {
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  return { route: path || 'home', params: new URLSearchParams(qs || '') };
}

// Re-rendering after an action, or switching tabs inside the same view, keeps
// the scroll position; navigating to a different view starts at the top.
let lastView = '';
let keepNext = false;
document.addEventListener('click', (e) => { if (e.target.closest('a[data-keep]')) keepNext = true; }, true);
const viewKey = ({ route, params }) => { const p = new URLSearchParams(params); p.delete('u'); p.delete('tab'); return `${route}?${p}`; };

function render({ keepScroll = false } = {}) {
  const profile = store.profile;
  if (!profile?.birth) {
    app.innerHTML = `<main class="screen">${onboarding()}</main>`;
    return;
  }
  const parsed = parseHash();
  const { route, params } = parsed;
  const key = viewKey(parsed);
  const y = window.scrollY;
  const stay = keepScroll || keepNext || key === lastView;
  keepNext = false;
  lastView = key;
  const view = ROUTES[route] || home;
  const date = E.today();
  app.innerHTML = `
    <main class="screen r-${route}">${view({ profile, date, params })}</main>
    ${route === 'home' || route === 'chat' ? '' : `<a class="fab" href="#/chat" aria-label="Ask Numa"><span class="orb"></span></a>`}
    <nav class="bottom">${NAV.map(([id, label, ic]) => `<a href="#/${id}" class="${route === id ? 'on' : ''}">${icon(ic, 30)}<span>${label}</span></a>`).join('')}</nav>`;
  if (route === 'chat') mountChat(params);
  else window.scrollTo(0, stay ? y : 0);
}

// ---------- chat ----------
function chatView() {
  const msgs = store.chat;
  return `
  <header class="center-head"><h2>Ask Numa</h2><button class="icon-btn" data-action="clear-chat" aria-label="Clear chat">${icon('x')}</button></header>
  <div class="chat">
    ${msgs.length ? '' : `<div class="glass card"><p>I read your numbers, Chinese animal and sun sign to answer. Try one of these:</p></div>`}
    <div class="msgs">${msgs.map((m) => `<div class="msg ${m.who}">${m.who === 'bot' ? md(m.text) : esc(m.text)}</div>`).join('')}</div>
    <div class="suggest">${['What is my energy today?', 'Tell me about this week', 'Love advice for me', 'What career suits me?', 'Explain my personal year', 'My lucky numbers'].map((s) => `<button class="chip" data-action="ask-chip">${s}</button>`).join('')}</div>
  </div>
  <form class="ask docked" data-action="ask"><span class="orb"></span><input name="q" placeholder="Ask anything about your numbers" autocomplete="off" aria-label="Message"><button class="icon-btn" aria-label="Send">${icon('arrow')}</button></form>`;
}

function mountChat(params) {
  const q = params.get('q');
  if (q) {
    history.replaceState(null, '', '#/chat');
    ask(q, { date: E.parseISO(params.get('d')), birth: E.parseISO(params.get('b')) });
  }
  document.querySelector('.msgs')?.lastElementChild?.scrollIntoView({ block: 'end' });
}

// ctx.date: answer about another day; ctx.birth: answer about another person's chart.
function ask(q, ctx = {}) {
  const who = ctx.birth ? { ...store.profile, birth: E.toISO(ctx.birth), name: '', time: '' } : store.profile;
  const date = ctx.date || E.today();
  const prefix = ctx.birth ? `For someone born ${E.fmtLong(ctx.birth)}:\n\n` : '';
  store.pushChat({ who: 'me', text: q });
  store.pushChat({ who: 'bot', text: prefix + answer(q, who, date) });
  if (parseHash().route === 'chat') render(); else location.hash = '#/chat';
  requestAnimationFrame(() => document.querySelector('.msgs')?.lastElementChild?.scrollIntoView({ block: 'end', behavior: 'smooth' }));
}

// ---------- share card ----------
async function shareCard() {
  const p = store.profile, b = E.parseISO(p.birth), c = E.chart(b, E.today(), p);
  const cv = document.createElement('canvas');
  cv.width = 1080; cv.height = 1350;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 1350);
  grd.addColorStop(0, '#2a0f3a'); grd.addColorStop(0.5, '#8a2a2a'); grd.addColorStop(0.75, '#e2692a'); grd.addColorStop(1, '#130a2a');
  g.fillStyle = grd; g.fillRect(0, 0, 1080, 1350);
  g.fillStyle = 'rgba(20,12,40,.55)'; roundRect(g, 70, 90, 940, 1170, 48); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = '600 46px Inter, system-ui'; g.fillText('NUMA ENERGY CARD', 540, 190);
  g.font = '700 72px Inter, system-ui'; g.fillText(p.name || 'My numbers', 540, 300);
  g.font = '200 260px Inter, system-ui'; g.fillText(String(c.lifePath), 540, 580);
  g.font = '500 44px Inter, system-ui'; g.fillText(`Life Path · ${num(c.lifePath).title}`, 540, 650);
  g.font = '400 150px serif'; g.fillText(ANIMAL_INFO[c.chinese.animal].char, 330, 860); g.fillText(c.sign.glyph + '︎', 750, 860);
  g.font = '500 40px Inter, system-ui'; g.fillText(`${c.chinese.element} ${c.chinese.animal}`, 330, 930); g.fillText(c.sign.name, 750, 930);
  g.fillStyle = '#ffd45c'; g.font = '600 44px Inter, system-ui';
  g.fillText(`Personal Year ${c.personalYear.value} · Month ${c.personalMonth.value}`, 540, 1060);
  g.fillText(`Lucky ${c.lucky.join(' · ')}`, 540, 1140);
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  const file = new File([blob], 'numa-card.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'My Numa card' }); return; } catch { /* cancelled */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'numa-card.png'; a.click();
  toast('Card image saved');
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------- events ----------
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-action]');
  if (!f) return;
  e.preventDefault();
  const data = new FormData(f);
  switch (f.dataset.action) {
    case 'profile': {
      const birth = data.get('birth');
      if (!E.parseISO(birth)) return toast('Please enter a valid birthdate');
      store.setProfile({ name: data.get('name').trim(), email: data.get('email').trim(), birth, time: data.get('time'), createdAt: store.profile?.createdAt || Date.now() });
      document.querySelector('.sheet-x')?.click();
      location.hash = location.hash || '#/home';
      render();
      break;
    }
    case 'ask': { const q = data.get('q').trim(); if (q) ask(q); break; }
    case 'search': location.hash = `#/search?q=${encodeURIComponent(data.get('q').trim())}`; break;
    case 'calc-date': {
      const d = data.get('d'); if (!E.parseISO(d)) return toast('Pick a date');
      const n = data.get('name').trim();
      location.hash = `#/calc?d=${d}${n ? `&name=${encodeURIComponent(n)}` : ''}`;
      break;
    }
    case 'checker': location.hash = `#/search?tool=checker&a=${data.get('a')}&b=${data.get('b')}`; break;
    case 'journal': {
      store.setJournal(f.dataset.d, { themes: data.getAll('theme'), text: data.get('text').trim(), evening: data.get('evening').trim() });
      toast('Journal saved');
      render({ keepScroll: true });
      break;
    }
  }
});

document.addEventListener('change', (e) => {
  if (e.target.name === 'brand') { store.setBrand(e.target.value.trim()); return; }
  const t = e.target.closest('.theme input');
  if (t) t.closest('.theme').classList.toggle('on', t.checked);
});
document.addEventListener('input', (e) => {
  if (e.target.name === 'text' && e.target.closest('.journal')) e.target.parentElement.querySelector('.count').textContent = `${e.target.value.length} OF 280`;
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'FORM') return;
  const a = el.dataset.action;
  if (a === 'bookmark') { store.toggleSaved(el.dataset.d, el.dataset.label); toast(store.isSaved(el.dataset.d) ? 'Chart saved' : 'Removed'); render({ keepScroll: true }); }
  if (['export-pdf', 'export-images', 'copy-all', 'sign-image', 'sign-copy'].includes(a)) exportAction(el, a);
  if (a === 'ask-chip') ask(el.textContent);
  if (a === 'clear-chat') { store.clearChat(); render(); }
  if (a === 'share-card') shareCard();
  if (a === 'share-day') shareDay(el.dataset.d);
  if (a === 'settings') sheet(onboarding(store.profile));
  if (a === 'notifications') notifications();
  if (a === 'export') exportJournal();
  if (a === 'reset' && confirm('Erase your profile, journal and saved charts from this browser?')) { store.clearAll(); location.hash = ''; render(); }
});

// ---------- horoscope exports ----------
async function exportAction(el, a) {
  const box = el.closest('[data-p]') || document.querySelector('.export[data-p]');
  const period = box.dataset.p, date = E.parseISO(box.dataset.d);
  const brandInput = document.querySelector('.export input[name=brand]');
  if (brandInput) store.setBrand(brandInput.value.trim());
  const opts = { brand: store.brand, link: `${location.origin}${location.pathname}` };
  if (a === 'copy-all' || a === 'sign-copy') {
    const text = a === 'copy-all' ? allCaption(period, date) : signCaption(+el.dataset.s, period, date);
    try { await navigator.clipboard.writeText(text); toast('Post text copied. Paste it into Facebook.'); }
    catch { sheet(`<h3>Copy this text</h3><textarea class="copybox" readonly>${esc(text)}</textarea>`, (s) => s.querySelector('textarea').select()); }
    return;
  }
  const label = el.innerHTML;
  el.disabled = true; el.textContent = 'Preparing…';
  try {
    if (a === 'export-pdf') { const r = await exportPdf(period, date, opts); toast(`PDF ready: ${r.pages} pages, ${(r.bytes / 1048576).toFixed(1)} MB`); }
    if (a === 'export-images') { const r = await exportImages(period, date, opts); if (r === 'saved') toast('Images saved'); }
    if (a === 'sign-image') { const r = await exportSign(+el.dataset.s, period, date, opts); if (r === 'saved') toast('Image saved'); }
  } catch (err) {
    console.error(err);
    toast('Export failed. Please try again.');
  } finally {
    el.disabled = false; el.innerHTML = label;
  }
}

function notifications() {
  const b = E.parseISO(store.profile.birth), d = E.today();
  const r = dayReading(b, d);
  const items = [
    { t: `Universal ${r.ud} day · ${r.score}% for you`, s: r.title },
    ...r.events.map((e) => ({ t: e.title, s: e.text })),
    { t: `Personal Day ${r.pd}`, s: num(r.pd).day.text },
  ];
  sheet(`<h3>Today's highlights</h3>${items.map((i) => `<div class="note"><b>${esc(i.t)}</b><p>${esc(i.s)}</p></div>`).join('')}<a class="btn gold wide" href="#/calendar">Open calendar</a>`, (s, close) => s.querySelector('a').addEventListener('click', close));
}

async function shareDay(iso) {
  const r = dayReading(E.parseISO(store.profile.birth), E.parseISO(iso));
  const text = `${E.fmtLong(E.parseISO(iso))}: Universal ${r.ud} day, "${r.title}". ${r.score}% for my Life Path ${r.lp}. ${r.text}`;
  if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* cancelled */ } }
  try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); } catch { toast(text); }
}

function exportJournal() {
  const rows = store.journalDates.map((d) => { const j = store.journal(d); return `${d}\n  Themes: ${(j.themes || []).join(', ')}\n  Plan: ${j.text || ''}\n  Reflection: ${j.evening || ''}`; });
  const blob = new Blob([rows.join('\n\n') || 'No entries yet.'], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'numa-journal.txt'; a.click();
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelector('.sheet-x')?.click(); });
window.addEventListener('hashchange', () => render());
render();
