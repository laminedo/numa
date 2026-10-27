// Renders horoscope readings as 1080x1350 pages (Facebook's portrait size)
// and packages them as a PDF, images or post text.
import { allSigns, skySummary, stars, captionFor, captionAll, GENERATORS, SIGN_NAMES, weekStart } from './horoscope.js';
import { jpegsToPdf } from './pdf.js';

const W = 1080, H = 1350, M = 84;
const TEXT_W = W - M * 2;
const BODY_BOTTOM = H - 140;
const SANS = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
const SYMBOL = '"Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Noto Sans Symbols", serif';
const C = { text: '#f4f0ff', muted: '#c6bbea', orange: '#ffad42', gold: '#ffd24a', green: '#4ff0a0', rose: '#ff8a9a' };

export const siteLink = () => `${location.origin}${location.pathname}`;
const cap = (t) => t[0].toUpperCase() + t.slice(1);

async function fontsReady() {
  try { await Promise.all(['400', '600', '700', '800'].map((w) => document.fonts.load(`${w} 32px Inter`))); } catch { /* falls back to system font */ }
}

function canvas() {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  return [cv, cv.getContext('2d')];
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function backdrop(g, seed) {
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#24092e'); sky.addColorStop(0.3, '#55162f'); sky.addColorStop(0.52, '#b4441f'); sky.addColorStop(0.62, '#e27a2a'); sky.addColorStop(0.7, '#3a1a5e'); sky.addColorStop(1, '#0d0820');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.62, H * 0.62, 10, W * 0.62, H * 0.62, 520);
  glow.addColorStop(0, 'rgba(255,200,90,.55)'); glow.addColorStop(1, 'rgba(255,200,90,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.75)';
  for (let i = 0; i < 40; i++) { const x = ((seed * 97 + i * 241) % W), y = ((seed * 53 + i * 137) % (H * 0.45)); g.fillRect(x, y, i % 5 ? 2 : 3, i % 5 ? 2 : 3); }
  const ridge = (pts, color) => { g.beginPath(); g.moveTo(0, H); pts.forEach(([x, y]) => g.lineTo(x * W, y * H)); g.lineTo(W, H); g.closePath(); g.fillStyle = color; g.fill(); };
  ridge([[0, 0.7], [0.15, 0.64], [0.3, 0.69], [0.47, 0.6], [0.62, 0.68], [0.78, 0.62], [1, 0.66]], 'rgba(90,42,122,.85)');
  ridge([[0, 0.78], [0.2, 0.72], [0.38, 0.77], [0.56, 0.71], [0.74, 0.79], [1, 0.73]], '#3a1a5e');
  ridge([[0, 0.86], [0.25, 0.82], [0.5, 0.86], [0.75, 0.83], [1, 0.86]], '#170c35');
  g.fillStyle = 'rgba(18,10,38,.72)';
  roundRect(g, 44, 140, W - 88, H - 140 - 96, 40); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; g.stroke();
}

function topBar(g, left, right) {
  g.textBaseline = 'alphabetic';
  g.font = `800 30px ${SANS}`; g.fillStyle = C.text; g.textAlign = 'left'; g.fillText(left, M - 20, 92);
  g.font = `600 24px ${SANS}`; g.fillStyle = C.orange; g.textAlign = 'right'; g.fillText(right.toUpperCase(), W - M + 20, 90);
  g.textAlign = 'left';
}

function footer(g, opts, page) {
  g.font = `500 22px ${SANS}`; g.fillStyle = C.muted; g.textAlign = 'center';
  g.fillText(`${opts.brand ? `${opts.brand} · ` : ''}${opts.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}`, W / 2, H - 58);
  g.font = `400 18px ${SANS}`; g.fillStyle = 'rgba(198,187,234,.7)';
  g.fillText(`For reflection and entertainment${page ? ` · ${page}` : ''}`, W / 2, H - 30);
  g.textAlign = 'left';
}

function wrap(g, text, font, width) {
  g.font = font;
  const out = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > width && line) { out.push(line); line = word; } else line = test;
  }
  if (line) out.push(line);
  return out;
}

function glyphBadge(g, x, y, r, glyph, element) {
  const tint = { Fire: ['#ff8a3c', '#c2261f'], Earth: ['#9fd36b', '#2f6b3a'], Air: ['#8fd3ff', '#4b5bd6'], Water: ['#6ee7d6', '#2a4f9e'] }[element];
  const grd = g.createLinearGradient(x - r, y - r, x + r, y + r);
  grd.addColorStop(0, tint[0]); grd.addColorStop(1, tint[1]);
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = grd; g.fill();
  g.fillStyle = '#fff'; g.font = `400 ${Math.round(r * 1.15)}px ${SYMBOL}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(`${glyph}︎`, x, y + 4);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}

// ---------- sign pages ----------
export async function signPages(r, opts) {
  await fontsReady();
  const P = `400 29px ${SANS}`, T = `700 24px ${SANS}`, LH = 41;
  const blocks = [];
  // Sections shared by all 12 signs (numerology) are printed once, on the cover.
  for (const s of r.sections.filter((x) => !x.shared)) {
    blocks.push({ kind: 'title', text: s.title.toUpperCase() });
    blocks.push({ kind: 'para', lines: null, text: s.text });
  }
  const luck = r.period === 'daily'
    ? `Lucky number ${r.lucky.number} · ${r.lucky.color} · Best time: ${r.lucky.time}`
    : `Best days: ${r.lucky.days.join(', ')} · Color: ${r.lucky.color}`;
  blocks.push({ kind: 'meta', rows: [['Focus', r.focus.join(', '), C.green], ['Avoid', r.avoid.join(', '), C.rose], ['Lucky', luck, C.gold]] });

  const pages = [];
  let g, cv, y;
  const newPage = (first) => {
    [cv, g] = canvas();
    backdrop(g, r.sign.length * 7 + pages.length);
    topBar(g, opts.brand || 'NUMA', `${r.period} horoscope`);
    if (first) {
      glyphBadge(g, M + 66, 262, 72, r.glyph, r.element);
      g.font = `800 66px ${SANS}`; g.fillStyle = C.text; g.fillText(r.sign, M + 162, 258);
      g.font = `500 27px ${SANS}`; g.fillStyle = C.muted; g.fillText(`${r.dates} · ${r.element} · ${r.ruler}`, M + 164, 302);
      g.font = `400 38px ${SYMBOL}`; g.fillStyle = C.gold; g.fillText(stars(r.rating), M + 162, 352);
      g.font = `600 27px ${SANS}`; g.fillStyle = C.orange; g.fillText(r.label, M, 420);
      const head = wrap(g, r.headline, `800 46px ${SANS}`, TEXT_W);
      g.fillStyle = C.text; head.forEach((l, i) => g.fillText(l, M, 478 + i * 54));
      y = 478 + head.length * 54 + 6;
    } else {
      glyphBadge(g, M + 34, 214, 36, r.glyph, r.element);
      g.font = `800 40px ${SANS}`; g.fillStyle = C.text; g.fillText(r.sign, M + 88, 226);
      const nameW = g.measureText(r.sign).width;
      g.font = `500 24px ${SANS}`; g.fillStyle = C.muted; g.fillText(`continued · ${r.label}`, M + 104 + nameW, 224);
      y = 300;
    }
    pages.push(cv);
  };
  newPage(true);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.kind === 'title') {
      // Keep a section on one page when it fits on a fresh page; otherwise
      // only require the heading plus two lines before breaking.
      const lines = wrap(g, blocks[i + 1].text, P, TEXT_W).length;
      const whole = 48 + LH * lines;
      const fitsFresh = whole <= BODY_BOTTOM - 300;
      if (y + (fitsFresh ? whole : 48 + LH * 2) > BODY_BOTTOM) newPage(false);
      g.font = T; g.fillStyle = C.orange;
      if ('letterSpacing' in g) g.letterSpacing = '2px';
      g.fillText(b.text, M, y + 30);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
      y += 48;
    } else if (b.kind === 'para') {
      for (const line of wrap(g, b.text, P, TEXT_W)) {
        if (y + LH > BODY_BOTTOM) newPage(false);
        g.font = P; g.fillStyle = C.text; g.fillText(line, M, y + 30);
        y += LH;
      }
      y += 16;
    } else {
      const rowsH = b.rows.reduce((t, [, v]) => t + wrap(g, v, `500 26px ${SANS}`, TEXT_W - 130).length * 36 + 14, 22);
      if (y + rowsH > BODY_BOTTOM) newPage(false);
      g.strokeStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(M, y + 4); g.lineTo(W - M, y + 4); g.stroke();
      y += 22;
      for (const [k, v, color] of b.rows) {
        g.font = `700 24px ${SANS}`; g.fillStyle = color; g.fillText(k.toUpperCase(), M, y + 28);
        const lines = wrap(g, v, `500 26px ${SANS}`, TEXT_W - 130);
        g.fillStyle = C.text; lines.forEach((l, j) => g.fillText(l, M + 130, y + 28 + j * 36));
        y += lines.length * 36 + 14;
      }
    }
  }
  pages.forEach((p, i) => footer(p.getContext('2d'), opts, pages.length > 1 ? `${i + 1}/${pages.length}` : ''));
  return pages;
}

// ---------- cover ----------
export async function coverPage(period, date, readings, opts) {
  await fontsReady();
  const sum = skySummary(period, date);
  const [cv, g] = canvas();
  backdrop(g, 3);
  topBar(g, opts.brand || 'NUMA', 'All 12 signs');
  g.textAlign = 'center';
  g.font = `800 76px ${SANS}`; g.fillStyle = C.text; g.fillText(`${cap(period)} Horoscope`, W / 2, 262);
  g.font = `600 32px ${SANS}`; g.fillStyle = C.orange; g.fillText(readings[0].label, W / 2, 318);
  g.font = `500 26px ${SANS}`; g.fillStyle = C.muted;
  g.fillText(`${sum.lines.slice(0, 2).join(' · ')} · ${sum.phase}`, W / 2, 372);
  g.fillText(`${sum.lines.slice(2).join(' · ')}`, W / 2, 410);
  g.fillStyle = C.gold; g.font = `700 26px ${SANS}`; g.fillText(`Numerology: ${sum.number.label} ${sum.number.value}`, W / 2, 456);
  let y = 494;
  for (const line of wrap(g, sum.number.text, `400 24px ${SANS}`, TEXT_W - 60).slice(0, 3)) { g.fillStyle = C.text; g.fillText(line, W / 2, y); y += 32; }
  g.textAlign = 'left';
  y += 22;
  if (sum.events.length) {
    const evs = sum.events.slice(0, 4);
    g.font = `500 23px ${SANS}`; g.fillStyle = C.text;
    evs.forEach((e, i) => { g.textAlign = 'center'; g.fillText(e, W / 2, y + i * 33); });
    g.textAlign = 'left';
    y += evs.length * 33 + 14;
  }
  const colW = (W - M * 2) / 3, rowH = Math.min(150, (H - 140 - y) / 4);
  readings.forEach((r, i) => {
    const cx = M + (i % 3) * colW + colW / 2, cy = y + Math.floor(i / 3) * rowH + 32;
    glyphBadge(g, cx, cy, 30, r.glyph, r.element);
    g.textAlign = 'center';
    g.font = `700 25px ${SANS}`; g.fillStyle = C.text; g.fillText(r.sign, cx, cy + 60);
    g.font = `400 21px ${SYMBOL}`; g.fillStyle = C.gold; g.fillText(stars(r.rating), cx, cy + 88);
  });
  g.textAlign = 'left';
  footer(g, opts, '');
  return cv;
}

const toJpeg = (cv, q = 0.88) => new Promise((res) => cv.toBlob(res, 'image/jpeg', q));

export async function buildAll(period, date, opts) {
  const readings = allSigns(period, date);
  const pages = [await coverPage(period, date, readings, opts)];
  for (const r of readings) pages.push(...await signPages(r, opts));
  return { readings, pages };
}

const stamp = (period, date) => {
  const d = period === 'weekly' ? weekStart(date) : date;
  return `${period}-horoscope-${d.y}-${String(d.m).padStart(2, '0')}${period === 'monthly' ? '' : `-${String(d.d).padStart(2, '0')}`}`;
};

function save(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
}

async function shareOrSave(files) {
  if (navigator.canShare?.({ files })) {
    try { await navigator.share({ files }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  for (const f of files) { save(f, f.name); await new Promise((r) => setTimeout(r, 350)); }
  return 'saved';
}

export async function exportPdf(period, date, opts) {
  const { pages } = await buildAll(period, date, opts);
  const images = [];
  for (const p of pages) images.push({ bytes: new Uint8Array(await (await toJpeg(p)).arrayBuffer()), w: W, h: H });
  const blob = jpegsToPdf(images, { width: 432, height: 540, title: `${cap(period)} Horoscope ${stamp(period, date)}` });
  const file = new File([blob], `numa-${stamp(period, date)}.pdf`, { type: 'application/pdf' });
  save(file, file.name);
  return { pages: pages.length, bytes: blob.size, file };
}

export async function exportImages(period, date, opts) {
  const { pages } = await buildAll(period, date, opts);
  const files = [];
  for (const [i, p] of pages.entries()) files.push(new File([await toJpeg(p, 0.92)], `numa-${stamp(period, date)}-${String(i).padStart(2, '0')}.jpg`, { type: 'image/jpeg' }));
  return shareOrSave(files);
}

export async function exportSign(s, period, date, opts) {
  const r = GENERATORS[period](s, date);
  const pages = await signPages(r, opts);
  const files = [];
  for (let i = 0; i < pages.length; i++) files.push(new File([await toJpeg(pages[i], 0.92)], `numa-${r.sign.toLowerCase()}-${stamp(period, date)}${pages.length > 1 ? `-${i + 1}` : ''}.jpg`, { type: 'image/jpeg' }));
  return shareOrSave(files);
}

export const signCaption = (s, period, date) => captionFor(GENERATORS[period](s, date), siteLink());
export const allCaption = (period, date) => captionAll(allSigns(period, date), skySummary(period, date), siteLink());
export { SIGN_NAMES };
