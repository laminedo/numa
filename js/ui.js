import { icon } from './icons.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Minimal markdown: **bold**, bullets and line breaks.
export const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

export const list = (items, kind) => `<ul class="ticks ${kind}">${items.map((t) => `<li>${icon(kind === 'bad' ? 'xcircle' : 'check', 18)}<span>${esc(t)}</span></li>`).join('')}</ul>`;

export const accordion = (title, ic, color, body, open = false) => `
  <details class="acc glass" ${open ? 'open' : ''} style="--accent:${color}">
    <summary>${icon(ic, 26)}<span>${esc(title)}</span>${icon('down', 22, 'chev')}</summary>
    <div class="acc-body">${body}</div>
  </details>`;

export const chips = (arr) => `<div class="chips">${arr.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>`;

export const sectionTitle = (t, right = '') => `<div class="sec-head"><h2>${esc(t)}</h2>${right}</div>`;

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2200);
}

export function sheet(html, onMount) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet glass"><button class="icon-btn sheet-x" aria-label="Close">${icon('x')}</button>${html}</div>`;
  const close = () => { wrap.classList.remove('show'); setTimeout(() => wrap.remove(), 250); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('.sheet-x')) close(); });
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('show'));
  onMount?.(wrap.querySelector('.sheet'), close);
  return close;
}
