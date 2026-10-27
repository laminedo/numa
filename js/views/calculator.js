import * as E from '../engine.js';
import { num, NUMBERS, ANIMAL_INFO, ELEMENT_INFO, SIGN_INFO, CHALLENGE_TEXT, KARMIC_TEXT, REL_TEXT } from '../content.js';
import { luckyDays } from '../insights.js';
import { PEOPLE } from '../data.js';
import { icon } from '../icons.js';
import { esc, list, accordion, chips } from '../ui.js';
import { store } from '../store.js';

const TABS = [
  ['overview', 'Overview', 'star'], ['birthday', 'Birthday', 'calendar'], ['strengths', 'Strengths', 'zap'],
  ['weaknesses', 'Weaknesses', 'alert'], ['career', 'Career', 'briefcase'], ['love', 'Love', 'heart'],
  ['years', 'Your Years', 'sparkle'], ['study', 'Study', 'book'], ['matches', 'Matches', 'users'],
  ['chinese', 'Eastern', 'layers'], ['western', 'Western', 'target'], ['name', 'Name', 'hash'],
];

export function calculator({ profile, date, params }) {
  const b = E.parseISO(params.get('d')) || E.parseISO(profile.birth);
  const iso = E.toISO(b);
  const isMe = iso === profile.birth;
  const name = params.get('name') ?? (isMe ? profile.name : '');
  const c = E.chart(b, date, { name, time: isMe ? profile.time : '' });
  const tab = params.get('tab') || 'overview';
  const n = num(c.lifePath);

  return `
  <section class="top3">
    <a class="big glass sel" href="${link(iso, 'overview', name)}">
      <small>LIFE PATH</small><b class="huge">${c.lifePath}</b>
      <small>DAY</small><b>${E.ordinal(b.d)}</b>
      <span class="pills"><span class="pill">PY <b>${c.personalYear.value}</b></span><span class="pill">PM <b>${c.personalMonth.value}</b></span></span>
    </a>
    <a class="big glass" href="${link(iso, 'chinese', name)}"><small>EASTERN ASTROLOGY</small><b class="glyph cn">${ANIMAL_INFO[c.chinese.animal].char}</b><span>${c.chinese.element} ${c.chinese.animal}</span></a>
    <a class="big glass" href="${link(iso, 'western', name)}"><small>WESTERN ASTROLOGY</small><b class="glyph">${c.sign.glyph}&#xFE0E;</b><span>${c.sign.name}</span></a>
  </section>

  <form class="datebar glass" data-action="calc-date">
    <input type="date" name="d" value="${iso}" max="2100-12-31" aria-label="Birthdate">
    <input type="text" name="name" value="${esc(name)}" placeholder="Full name (optional)" aria-label="Full name">
    <button class="btn small gold">Calculate</button>
    <button type="button" class="icon-btn ${store.isSaved(iso) ? 'on' : ''}" data-action="bookmark" data-d="${iso}" data-label="${esc(name || E.fmtNumeric(b))}" aria-label="Save chart">${icon('bookmark')}</button>
  </form>
  ${store.saved.length ? `<div class="saved">${store.saved.map((s) => `<a class="chip ${s.date === iso ? 'on' : ''}" href="#/calc?d=${s.date}">${esc(s.label)}</a>`).join('')}${isMe ? '' : `<a class="chip" href="#/calc">My chart</a>`}</div>` : ''}

  <nav class="tabs" aria-label="Chart sections">
    ${TABS.map(([id, label, ic]) => `<a data-keep class="tab ${tab === id ? 'on' : ''}" href="${link(iso, id, name)}"><span class="tab-ic">${icon(ic, 20)}</span>${label}</a>`).join('')}
  </nav>

  <section class="panel">${(PANELS[tab] || PANELS.overview)(c, n, date, isMe)}</section>`;
}

const link = (iso, tab, name) => `#/calc?d=${iso}&tab=${tab}${name ? `&name=${encodeURIComponent(name)}` : ''}`;

const head = (title, sub, extra = '') => `<div class="glass card"><h3 class="card-title">${title}</h3><p class="lead">${esc(sub)}</p><hr>${extra}</div>`;

const PANELS = {
  overview: (c, n, date, isMe) => `
    ${head(`Life Path ${c.lifePath} <span class="tag">${esc(n.title)}</span>`, n.tagline, `<p>${esc(n.overview)}</p>${c.compound !== c.lifePath ? `<p class="muted">Calculated as ${E.reduce(c.birth.m)} + ${E.reduce(c.birth.d)} + ${E.reduce(c.birth.y)} = ${c.compound} → ${c.lifePath}</p>` : ''}`)}
    <a class="btn gold wide" href="#/chat?q=${encodeURIComponent('Give me my reading for today')}${isMe ? '' : `&b=${E.toISO(c.birth)}`}">Get a Reading</a>
    ${accordion('Personality', 'sparkle', 'var(--gold)', `<p>${esc(n.personality)}</p>`, true)}
    ${accordion('Advantages', 'trophy', 'var(--green)', `<p>${esc(n.advantages)}</p>`)}
    ${accordion('Need to do', 'check', 'var(--orange)', `<p>${esc(n.needToDo)}</p>`)}
    ${accordion('Problem', 'alert', 'var(--rose)', `<p>${esc(n.problem)}</p>`)}
    ${c.karmic.length ? accordion('Karmic debt', 'layers', 'var(--violet)', c.karmic.map((k) => `<p>${KARMIC_TEXT[k]}</p>`).join('')) : ''}
    <div class="facts glass card">
      ${fact('Birthday number', c.birthday)}${fact('Personal Year', `${c.personalYear.value} <small>until ${E.fmtShort(c.personalYear.end)}</small>`)}
      ${fact('Personal Month', `${c.personalMonth.value} <small>until ${E.fmtShort(c.personalMonth.end)}</small>`)}${fact('Age', c.age)}
      ${fact('Lucky numbers', c.lucky.join(' · '))}${fact('Lucky colors', n.colors.join(', '))}
      ${c.name ? fact('Expression (name)', c.name.expression) : ''}${c.chineseHour ? fact('Hour animal', c.chineseHour) : ''}
    </div>`,

  birthday: (c) => {
    const bn = num(c.birthday);
    const twins = PEOPLE.filter((p) => { const d = E.parseISO(p.date); return d.m === c.birth.m && d.d === c.birth.d; });
    return `${head(`Born on the ${E.ordinal(c.birth.d)}`, `Birthday number ${c.birthday}: ${bn.title}`, `<p>${esc(bn.birthday)}</p><p>${esc(bn.personality)}</p>`)}
      <div class="glass card"><h4>How your birthday adds to your Life Path ${c.lifePath}</h4><p>${esc(REL_TEXT[E.numberRelation(c.birthday, c.lifePath)])}</p>${chips(bn.strengths.slice(0, 3))}</div>
      ${twins.length ? `<div class="glass card"><h4>Shares your birthday</h4>${twins.map((p) => `<p><b>${esc(p.name)}</b> · ${esc(p.role)} · ${p.date.slice(0, 4)}</p>`).join('')}</div>` : ''}`;
  },

  strengths: (c, n) => `${head('Strengths', `What a ${c.lifePath} brings to the table`, list(n.strengths, 'good'))}
    <div class="glass card"><h4>Your ${c.chinese.animal} strengths</h4>${list(ANIMAL_INFO[c.chinese.animal].strengths, 'good')}<h4>Your ${c.sign.name} strengths</h4>${list(SIGN_INFO[c.sign.name].strengths, 'good')}</div>`,

  weaknesses: (c, n) => `${head('Weaknesses', 'Growth edges to keep an eye on', list(n.weaknesses, 'bad') + `<p class="muted">${esc(n.problem)}</p>`)}
    <div class="glass card"><h4>Your ${c.chinese.animal} blind spots</h4>${list(ANIMAL_INFO[c.chinese.animal].weaknesses, 'bad')}<h4>Your ${c.sign.name} blind spots</h4>${list(SIGN_INFO[c.sign.name].weaknesses, 'bad')}<h4>What helps</h4><p>${esc(n.needToDo)}</p></div>`,

  career: (c, n) => `${head('Career', n.career, list(n.careerPaths, 'good'))}
    <div class="glass card"><h4>Eastern & Western hints</h4><p><b>${c.chinese.animal}:</b> ${esc(ANIMAL_INFO[c.chinese.animal].career)}</p><p><b>${c.sign.name}:</b> ${esc(SIGN_INFO[c.sign.name].career)}</p>
    <h4>Timing</h4><p>Personal Year ${c.personalYear.value}: ${esc(num(c.personalYear.value).year.text)}</p></div>`,

  love: (c, n) => `${head('Love', `How a ${c.lifePath} loves`, `<p>${esc(n.love)}</p>`)}
    <div class="glass card"><p><b>${c.chinese.animal}:</b> ${esc(ANIMAL_INFO[c.chinese.animal].love)}</p><p><b>${c.sign.name}:</b> ${esc(SIGN_INFO[c.sign.name].love)}</p>
    <h4>Best number matches</h4>${chips(E.friendNumbers(c.lifePath).map((x) => `${x} · ${NUMBERS[x].title}`))}
    <h4>Best animal matches</h4>${chips(E.animalAllies(c.chinese.animal))}<p class="muted">Clash animal: ${E.animalClash(c.chinese.animal)}</p></div>`,

  years: (c, n, date) => {
    const years = Array.from({ length: 9 }, (_, i) => {
      const py = E.personalYearInfo(c.birth, E.birthdayIn(c.birth, c.personalYear.year + i));
      return `<div class="yr ${i === 0 ? 'on' : ''}"><b>${py.value}</b><span>${py.year}–${py.year + 1}</span><small>${esc(num(py.value).year.title)}</small></div>`;
    }).join('');
    return `${head(`Personal Year ${c.personalYear.value}`, num(c.personalYear.value).year.title, `<p>${esc(num(c.personalYear.value).year.text)}</p><p class="muted">${E.fmtShort(c.personalYear.start)} → ${E.fmtShort(c.personalYear.end)}</p>`)}
      <div class="glass card"><h4>Your nine-year cycle</h4><div class="years">${years}</div></div>
      <div class="glass card"><h4>Pinnacles & challenges</h4>
        ${c.pinnacles.map((p, i) => `<div class="pin ${c.age >= p.from && (p.to === null || c.age <= p.to) ? 'on' : ''}">
          <div><small>${['First', 'Second', 'Third', 'Fourth'][i]} pinnacle · age ${p.from}${p.to === null ? '+' : `–${p.to}`}</small><b>${p.pinnacle} · ${esc(num(p.pinnacle).title)}</b><p>${esc(num(p.pinnacle).year.text)}</p></div>
          <div><small>Challenge ${p.challenge}</small><p>${esc(CHALLENGE_TEXT[p.challenge])}</p></div></div>`).join('')}
      </div>`;
  },

  study: (c, n) => `${head('Study', 'How you learn best', `<p>${esc(n.study)}</p>`)}
    <div class="glass card"><h4>Numerology 101</h4>
      <p><b>Life Path</b>: reduce month, day and year separately, add them, and reduce again (keeping 11, 22, 33).</p>
      <p><b>Personal Year</b>: birth month + birth day + the current year, counted from your last birthday.</p>
      <p><b>Personal Month</b>: Personal Year + the current month, counted from your birth day each month.</p>
      <p><b>Universal Day</b>: today's month + day + year, each reduced first.</p>
      <p><b>Expression</b>: the letters of your full name (A=1 … I=9, J=1 …).</p></div>`,

  matches: (c) => {
    const rows = Object.keys(NUMBERS).map(Number).map((x) => ({ x, s: E.numberCompat(c.lifePath, x), rel: E.numberRelation(c.lifePath, x) })).sort((a, b) => b.s - a.s);
    const famous = PEOPLE.filter((p) => E.lifePath(E.parseISO(p.date)).value === c.lifePath).slice(0, 10);
    return `${head('Matches', `Life Path ${c.lifePath} with every number`, rows.map((r) => `<div class="mrow"><b>${r.x}</b><span>${esc(NUMBERS[r.x].title)}</span><i class="meter"><i style="width:${r.s}%"></i></i><em>${r.s}%</em></div>`).join(''))}
      ${famous.length ? `<div class="glass card"><h4>Famous Life Path ${c.lifePath}s</h4>${chips(famous.map((p) => p.name))}</div>` : ''}
      <a class="btn gold wide" href="#/search?tool=checker&a=${E.toISO(c.birth)}">Check a match</a>`;
  },

  chinese: (c) => {
    const a = ANIMAL_INFO[c.chinese.animal];
    return `${head(`${c.chinese.element} ${c.chinese.animal} <span class="tag">${c.chinese.polarity}</span>`, a.keywords.join(' • '), `<p>${esc(a.overview)}</p><p>${esc(ELEMENT_INFO[c.chinese.element])}</p>`)}
      <div class="facts glass card">${fact('Year animal', c.chinese.animal)}${fact('Month animal', c.chineseMonth)}${fact('Hour animal', c.chineseHour || '<a href="#/profile">Add birth time</a>')}${fact('Allies', E.animalAllies(c.chinese.animal).join(', '))}${fact('Clash', E.animalClash(c.chinese.animal))}</div>
      <div class="glass card"><h4>Strengths</h4>${list(a.strengths, 'good')}<h4>Watch for</h4>${list(a.weaknesses, 'bad')}<p><b>Love:</b> ${esc(a.love)}</p><p><b>Career:</b> ${esc(a.career)}</p>
      <p class="muted">Uses the solar calendar: the animal year starts at Li Chun (around Feb 4).</p></div>`;
  },

  western: (c) => {
    const s = SIGN_INFO[c.sign.name];
    return `${head(`${c.sign.glyph}&#xFE0E; ${c.sign.name}`, `${s.dates} • ${s.keywords.join(' • ')}`, `<p>${esc(s.overview)}</p>`)}
      <div class="facts glass card">${fact('Element', c.sign.element)}${fact('Modality', c.sign.modality)}${fact('Ruler', c.sign.ruler)}</div>
      <div class="glass card"><h4>Strengths</h4>${list(s.strengths, 'good')}<h4>Watch for</h4>${list(s.weaknesses, 'bad')}<p><b>Love:</b> ${esc(s.love)}</p><p><b>Career:</b> ${esc(s.career)}</p>
      <p class="muted">Sun sign only. Moon and rising signs need an exact birth time and place.</p></div>`;
  },

  name: (c) => c.name ? `${head(`Expression ${c.name.expression}`, num(c.name.expression).tagline, `<p>Your name describes the talents you express outwardly. ${esc(num(c.name.expression).personality)}</p>`)}
      <div class="facts glass card">${fact('Expression', c.name.expression)}${fact('Soul Urge (vowels)', c.name.soulUrge ?? '—')}${fact('Personality (consonants)', c.name.personality ?? '—')}${fact('Maturity', E.reduce(c.lifePath + c.name.expression))}</div>
      ${c.name.soulUrge ? `<div class="glass card"><h4>Soul Urge ${c.name.soulUrge}: what your heart wants</h4><p>${esc(num(c.name.soulUrge).overview)}</p></div>` : ''}`
    : `<div class="glass card"><p>Type a full name in the field above and press Calculate to see Expression, Soul Urge and Personality numbers.</p></div>`,
};

const fact = (k, v) => `<div class="fact"><span>${k}</span><b>${v}</b></div>`;

export { luckyDays };
