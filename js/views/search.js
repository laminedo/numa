import * as E from '../engine.js';
import { num, NUMBERS, ANIMAL_INFO, SIGN_INFO, REL_TEXT } from '../content.js';
import { CATEGORIES, PEOPLE, GRADIENTS } from '../data.js';
import { scoreColor } from '../insights.js';
import { icon } from '../icons.js';
import { esc, chips, sectionTitle } from '../ui.js';

const PROMPTS = ['Best cars for my energy', 'Cities that match me', 'Banks for my numbers', 'Best sports for me', 'Hobbies for my energy'];

export function search({ profile, date, params }) {
  const b = E.parseISO(profile.birth);
  const lp = E.lifePath(b).value;
  const q = (params.get('q') || '').trim();
  const tool = params.get('tool');
  let cat = params.get('cat');
  if (q && !cat) cat = CATEGORIES.find((c) => q.toLowerCase().includes(c.label.toLowerCase().replace(/s$/, '')) || (c.id === 'locations' && /cit|place|countr|live/.test(q.toLowerCase())))?.id;

  let body;
  if (tool === 'checker') body = checker(b, params);
  else if (tool === 'friendly' || tool === 'enemy') body = allies(b, tool === 'friendly');
  else if (cat) body = category(cat, b, lp, date);
  else if (q) body = nameLookup(q, lp);
  else body = explore(b, lp, date);

  return `
  <form class="searchbar glass" data-action="search">
    ${icon('search', 30)}
    <input name="q" value="${esc(q)}" placeholder='Try "${PROMPTS[date.d % PROMPTS.length]}"' aria-label="Search">
    <a class="icon-btn" href="#/search" aria-label="Reset">${icon('sliders', 26)}</a>
  </form>
  <div class="cats">${CATEGORIES.map((c) => `<a class="cat glass ${cat === c.id ? 'on' : ''}" href="#/search?cat=${c.id}">${icon(c.icon, 40)}<span>${c.label}</span></a>`).join('')}</div>
  <div class="triple">
    <a class="glass card t ${tool === 'checker' ? 'on' : ''}" href="#/search?tool=checker"><span class="new">NEW</span>${icon('users', 40, 'gold')}<h4>Match Checker</h4><p class="muted">Compare two birthdates.</p></a>
    <a class="glass card t ${tool === 'friendly' ? 'on' : ''}" href="#/search?tool=friendly">${icon('check', 40, 'green')}<h4>Friendly</h4><p class="muted">Find your strongest matches.</p></a>
    <a class="glass card t ${tool === 'enemy' ? 'on' : ''}" href="#/search?tool=enemy">${icon('xcircle', 40, 'red')}<h4>Friction</h4><p class="muted">See possible clashes.</p></a>
  </div>
  ${body}`;
}

function explore(b, lp, date) {
  const near = PEOPLE.map((p) => ({ ...p, d: E.parseISO(p.date) })).map((p) => ({ ...p, dist: Math.abs(E.diffDays({ y: 2000, m: date.m, d: date.d }, { y: 2000, m: p.d.m, d: p.d.d })) }));
  const onDate = near.filter((p) => p.dist === 0);
  const week = near.filter((p) => p.dist > 0 && p.dist <= 4).sort((a, c) => a.dist - c.dist);
  const same = PEOPLE.filter((p) => E.lifePath(E.parseISO(p.date)).value === lp);
  const star = same[(date.y * 372 + date.m * 31 + date.d) % Math.max(same.length, 1)];
  const strip = [
    ...(star ? [{ ...star, tag: 'Star of the Day' }] : []),
    ...onDate.map((p) => ({ ...p, tag: 'On This Date' })),
    ...week.map((p) => ({ ...p, tag: 'This Week' })),
    ...same.filter((p) => p !== star).slice(0, 6).map((p) => ({ ...p, tag: `Life Path ${lp}` })),
  ];
  const picks = CATEGORIES.filter((c) => c.items).map((c) => ({ c, best: rank(c.items, lp)[0] })).sort((a, x) => x.best.score - a.best.score).slice(0, 4);
  return `
  ${sectionTitle('Explore Your World')}
  <div class="people">${strip.map(personCard(lp)).join('')}</div>
  ${sectionTitle('Top picks for your energy')}
  <div class="results">${picks.map(({ c, best }, i) => resultCard(best, i, c.label)).join('')}</div>`;
}

const personCard = (lp) => (p) => {
  const pc = E.chart(E.parseISO(p.date));
  const s = E.numberCompat(lp, pc.lifePath);
  const initials = p.name.split(' ').map((w) => w[0]).slice(0, 2).join('');
  const g = GRADIENTS[p.name.length % GRADIENTS.length];
  return `<a class="person glass" href="#/calc?d=${p.date}&name=${encodeURIComponent(p.name)}">
    <span class="avatar" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${esc(initials)}<em style="color:${scoreColor(s)}">${s}%</em></span>
    <b>${esc(p.name)}</b><small>${esc(p.role)} · LP ${pc.lifePath} · ${pc.chinese.animal} · ${pc.sign.name}</small><span class="ptag">${esc(p.tag)}</span></a>`;
};

function rank(items, lp) {
  return items.map((name) => ({ name, ...E.nameScore(lp, name) })).sort((a, c) => c.score - a.score);
}

const resultCard = (r, i, sub = '') => {
  const g = GRADIENTS[i % GRADIENTS.length];
  return `<a class="result" href="#/search?q=${encodeURIComponent(r.name)}" style="background:linear-gradient(150deg,${g[0]},${g[1]})">
    <span class="score" style="color:${scoreColor(r.score)}">${r.score}%</span>
    <b>${esc(r.name)}</b><small>${sub ? `${esc(sub)} · ` : ''}Number ${r.number} · ${esc(num(r.number).title)}</small></a>`;
};

function category(id, b, lp, date) {
  const c = CATEGORIES.find((x) => x.id === id);
  if (id === 'people' || id === 'history') {
    const list = PEOPLE.map((p) => ({ ...p, s: E.overallCompat(b, E.parseISO(p.date)).score }));
    const sorted = id === 'people' ? list.sort((a, x) => x.s - a.s) : list.sort((a, x) => a.date.localeCompare(x.date));
    return `${sectionTitle(id === 'people' ? 'People who match your energy' : 'History through your numbers')}
      <div class="people grid">${sorted.map((p) => personCard(lp)({ ...p, tag: id === 'people' ? `${p.s}% overall` : p.date.slice(0, 4) })).join('')}</div>`;
  }
  const r = rank(c.items, lp);
  return `${sectionTitle(`${c.label} ranked for Life Path ${lp}`)}
    <p class="muted pad">Each name is turned into a number with Pythagorean letter values and compared with your Life Path.</p>
    <div class="results">${r.map((x, i) => resultCard(x, i)).join('')}</div>`;
}

function nameLookup(q, lp) {
  const d = E.parseISO(q) || (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(q) ? (() => { const [m, dd, y] = q.split('/').map(Number); return { y, m, d: dd }; })() : null);
  if (d) return `<div class="glass card"><p>That's a date. <a class="link" href="#/calc?d=${E.toISO(d)}">Open its full chart</a> or <a class="link" href="#/search?tool=checker&b=${E.toISO(d)}">check compatibility</a>.</p></div>`;
  const person = PEOPLE.find((p) => p.name.toLowerCase() === q.toLowerCase());
  const nn = E.nameNumbers(q);
  if (!nn) return `<div class="glass card"><p>Type a name, brand, city or date.</p></div>`;
  const s = E.nameScore(lp, q);
  const n = num(nn.expression);
  return `${sectionTitle(`“${q}”`)}
    <div class="glass card">
      <div class="energy-top"><div class="stat"><b class="hot">${nn.expression}</b><span>Name number</span></div>
      <div class="ring" style="--p:${s.score};--c:${scoreColor(s.score)}"><span>${s.score}%</span><small>match</small></div>
      <div class="stat"><b class="hot">${lp}</b><span>Your Life Path</span></div></div>
      <h3>${esc(n.title)}</h3><p>${esc(n.tagline)}.</p><p>${esc(REL_TEXT[E.numberRelation(lp, nn.expression)])}</p>
      ${chips(n.day.keywords)}
      ${person ? `<a class="btn gold wide" href="#/calc?d=${person.date}&name=${encodeURIComponent(person.name)}">Open ${esc(person.name)}'s birth chart</a>` : ''}
    </div>`;
}

function allies(b, friendly) {
  const c = E.chart(b);
  const nums = friendly ? E.friendNumbers(c.lifePath) : E.challengeNumbers(c.lifePath);
  const animals = friendly ? E.animalAllies(c.chinese.animal) : [E.animalClash(c.chinese.animal)];
  const signs = E.SIGNS.filter((s) => s.name !== c.sign.name).map((s) => ({ s, rel: E.signRelation(c.sign, s), v: E.signCompat(c.sign, s) })).sort((a, x) => friendly ? x.v - a.v : a.v - x.v).slice(0, 3);
  const ppl = PEOPLE.map((p) => ({ ...p, s: E.overallCompat(b, E.parseISO(p.date)).score })).sort((a, x) => friendly ? x.s - a.s : a.s - x.s).slice(0, 8);
  return `${sectionTitle(friendly ? 'Your strongest matches' : 'Where friction may show up')}
    <div class="glass card">
      <h4>Numbers</h4>${chips(nums.map((x) => `${x} · ${NUMBERS[x].title}`))}
      <h4>Chinese animals</h4>${chips(animals.map((a) => `${ANIMAL_INFO[a].char} ${a}`))}
      <h4>Western signs</h4>${chips(signs.map(({ s, rel }) => `${s.name} · ${rel}`))}
      <p class="muted">${friendly ? 'These energies tend to understand and support you naturally.' : 'Friction is not doom: these pairings ask for more patience and clearer communication.'}</p>
    </div>
    ${sectionTitle(friendly ? 'Famous people in sync with you' : 'Famous people with contrasting energy')}
    <div class="people">${ppl.map((p) => personCard(c.lifePath)({ ...p, tag: `${p.s}% overall` })).join('')}</div>`;
}

function checker(me, params) {
  const a = E.parseISO(params.get('a')) || me;
  const bb = E.parseISO(params.get('b'));
  let result = '';
  if (bb) {
    const x = E.overallCompat(a, bb);
    const row = (label, v, rel, l, r) => `<div class="crow"><div><small>${label}</small><b>${l} + ${r}</b><p>${esc(REL_TEXT[rel])}</p></div><div class="ring sm" style="--p:${v};--c:${scoreColor(v)}"><span>${v}%</span></div></div>`;
    result = `<div class="glass card">
      <div class="energy-top"><div class="stat"><b class="hot">${x.a.lifePath}</b><span>${E.fmtShort(a)}</span></div>
      <div class="ring big" style="--p:${x.score};--c:${scoreColor(x.score)}"><span>${x.score}%</span><small>overall</small></div>
      <div class="stat"><b class="hot">${x.b.lifePath}</b><span>${E.fmtShort(bb)}</span></div></div>
      ${row('Numerology (50%)', x.num, x.numRel, `LP ${x.a.lifePath}`, `LP ${x.b.lifePath}`)}
      ${row('Chinese zodiac (25%)', x.ani, x.aniRel, x.a.chinese.animal, x.b.chinese.animal)}
      ${row('Western zodiac (25%)', x.sig, x.sigRel, x.a.sign.name, x.b.sign.name)}
      <h4>Together</h4><p>${esc(togetherText(x))}</p>
    </div>`;
  }
  return `${sectionTitle('Match Checker')}
    <form class="glass card checker" data-action="checker">
      <label>First person<input type="date" name="a" value="${E.toISO(a)}" required></label>
      <span class="plus">${icon('rings', 30)}</span>
      <label>Second person<input type="date" name="b" value="${bb ? E.toISO(bb) : ''}" required></label>
      <button class="btn gold">Compare</button>
    </form>${result}`;
}

function togetherText(x) {
  const A = num(x.a.lifePath), B = num(x.b.lifePath);
  const base = x.score >= 85 ? 'A naturally easy pairing.' : x.score >= 72 ? 'A solid pairing with room to grow.' : x.score >= 60 ? 'A pairing that works best with clear communication.' : 'A challenging but potentially transformative pairing.';
  return `${base} ${A.title.replace(' (Master)', '')} brings ${A.day.keywords[0].toLowerCase()}, while ${B.title.replace(' (Master)', '')} brings ${B.day.keywords[0].toLowerCase()}. ${ANIMAL_INFO[x.a.chinese.animal].keywords[0]} ${x.a.chinese.animal} meets ${ANIMAL_INFO[x.b.chinese.animal].keywords[0].toLowerCase()} ${x.b.chinese.animal}; ${SIGN_INFO[x.a.sign.name].keywords[0].toLowerCase()} ${x.a.sign.name} meets ${SIGN_INFO[x.b.sign.name].keywords[0].toLowerCase()} ${x.b.sign.name}.`;
}
