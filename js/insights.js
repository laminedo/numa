// Turns raw numbers into readings for a given person and day.
import * as E from './engine.js';
import { num, REL_TEXT, ANIMAL_INFO, SIGN_INFO, NUMBERS } from './content.js';

export function dayReading(b, date) {
  const lp = E.lifePath(b).value;
  const ud = E.universalDay(date);
  const pd = E.personalDay(b, date);
  const score = E.dayScore(b, date);
  const rel = E.numberRelation(lp, ud);
  const d = num(ud).day;
  return {
    date, lp, ud, pd, score, rel,
    title: d.title, themes: d.themes, keywords: d.keywords, text: d.text, good: d.good, watch: d.watch,
    bring: d.bring || `${num(ud).tagline.replace(/^\d+ is the (master )?number of /, 'A day for ')}. ${d.text}`,
    personal: num(pd).day,
    combo: comboReading(lp, ud, rel),
    events: dayEvents(b, date, { lp, ud, pd, score, rel }),
  };
}

function comboReading(lp, ud, rel) {
  const a = num(lp), b = num(ud);
  const intro = {
    friend: `Your ${lp} energy and today's ${ud} vibration support each other. Things you push on today tend to move.`,
    same: `Today echoes your own Life Path. You'll feel at home in the day's energy, so lean into your natural strengths.`,
    neutral: `Today's ${ud} energy asks for a style that isn't your default. Borrow a little of it and you gain range.`,
    challenge: `Today's ${ud} energy rubs against your ${lp} nature. Slow down, choose your battles and let small frictions pass.`,
  }[rel];
  return {
    title: `${a.title.replace(/ \(Master\)/, '')} × ${b.day.title}`,
    text: `${intro} ${REL_TEXT[rel]}`,
    good: [a.day.good[0], b.day.good[1] || b.day.good[0], rel === 'challenge' ? 'Patience and pacing yourself' : 'Acting on your instincts'],
    watch: rel === 'challenge' ? [a.day.watch[0], b.day.watch[0]] : [b.day.watch[0]],
  };
}

export function dayEvents(b, date, r) {
  const ev = [];
  if (r.score >= 92) ev.push({ kind: 'good', title: 'Powerful Alignment Day', text: 'Your numbers line up strongly with today. A great day to make a move that matters.' });
  if (E.root(r.ud) === E.root(r.lp)) ev.push({ kind: 'good', title: 'Resonance Day', text: `Today carries your own ${r.lp} vibration. You are in your element.` });
  if (E.MASTER.includes(r.ud)) ev.push({ kind: 'info', title: `Master ${r.ud} Day`, text: 'A master-number day: heightened intuition and bigger stakes. Stay grounded.' });
  if (r.rel === 'challenge' && r.score < 62) ev.push({ kind: 'warn', title: 'Friction Day', text: 'Energy clashes with your path today. Go gently and avoid forcing outcomes.' });
  if (date.m === b.m && date.d === b.d) ev.push({ kind: 'good', title: 'Happy Birthday', text: 'A new Personal Year begins today. Set your intention for the next 12 months.' });
  if (date.d === Math.min(b.d, E.daysInMonth(date.y, date.m)) && !(date.m === b.m)) ev.push({ kind: 'info', title: 'New Personal Month', text: `Your Personal Month ${E.personalMonthInfo(b, date).value} begins today.` });
  const mp = E.moonPhase(date);
  if (mp.name === 'Full Moon' || mp.name === 'New Moon') ev.push({ kind: 'info', title: mp.name, text: mp.name === 'Full Moon' ? 'Culmination and release. Notice what has come to light.' : 'A quiet reset. Plant a fresh intention.' });
  return ev;
}

export function forecast(b, start, days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const d = E.addDays(start, i);
    return { date: d, score: E.dayScore(b, d), ud: E.universalDay(d) };
  });
}

export const scoreColor = (s) => (s >= 90 ? 'var(--teal)' : s >= 75 ? 'var(--green)' : s >= 62 ? 'var(--amber)' : 'var(--rose)');

// ---------- rule-based guide for the chat ----------
export function answer(question, profile, date = E.today()) {
  const q = question.toLowerCase();
  const b = E.parseISO(profile.birth);
  const c = E.chart(b, date, profile);
  const lp = num(c.lifePath);
  const r = dayReading(b, date);
  const ani = ANIMAL_INFO[c.chinese.animal], sig = SIGN_INFO[c.sign.name];

  const dateMatch = q.match(/(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch && /compat|match|partner|with|friend|love/.test(q)) {
    const other = dateMatch[1] ? { y: +dateMatch[1], m: +dateMatch[2], d: +dateMatch[3] } : { y: +dateMatch[6], m: +dateMatch[4], d: +dateMatch[5] };
    const x = E.overallCompat(b, other);
    return `With someone born ${E.fmtLong(other)} (Life Path ${x.b.lifePath}, ${x.b.chinese.animal}, ${x.b.sign.name}) your overall match is **${x.score}%**.\n\n• Numbers ${x.num}%: ${REL_TEXT[x.numRel]}\n• Chinese ${x.ani}%: ${REL_TEXT[x.aniRel]}\n• Western ${x.sig}%: ${REL_TEXT[x.sigRel]}`;
  }
  if (/tomorrow|this week|week|forecast|best day|ahead/.test(q)) {
    const f = forecast(b, E.addDays(date, /tomorrow/.test(q) ? 1 : 0), /tomorrow/.test(q) ? 1 : 7);
    const best = [...f].sort((x, y) => y.score - x.score)[0];
    return f.length === 1
      ? `Tomorrow is a Universal ${f[0].ud} day and scores **${f[0].score}%** for you. ${num(f[0].ud).day.title}: ${num(f[0].ud).day.text}`
      : `Your next 7 days:\n${f.map((d) => `• ${E.WEEKDAYS[E.weekday(d.date)].slice(0, 3)} ${d.date.d}: ${d.score}% (${d.ud})`).join('\n')}\n\nBest day: **${E.WEEKDAYS[E.weekday(best.date)]} the ${E.ordinal(best.date.d)}**: ${num(best.ud).day.title}.`;
  }
  if (/love|relationship|partner|dating|marri|romance/.test(q)) {
    return `**Love for a Life Path ${c.lifePath}:** ${lp.love}\n\nAs a ${c.chinese.animal}: ${ani.love} As a ${c.sign.name}: ${sig.love}\n\nYour most natural number matches are ${E.friendNumbers(c.lifePath).join(', ')}; animal allies are ${E.animalAllies(c.chinese.animal).join(', ')}.`;
  }
  if (/career|job|work|business|money|finance|career/.test(q)) {
    return `**Career for a Life Path ${c.lifePath}:** ${lp.career}\n\nPaths that fit: ${lp.careerPaths.join(', ')}.\n\nYour ${c.chinese.animal} side points toward ${ani.career.toLowerCase()} Right now you're in Personal Year ${c.personalYear.value} (${num(c.personalYear.value).year.title}): ${num(c.personalYear.value).year.text}`;
  }
  if (/year|month|cycle|timing|personal/.test(q)) {
    return `**Personal Year ${c.personalYear.value}** (until ${E.fmtShort(c.personalYear.end)}): ${num(c.personalYear.value).year.text}\n\n**Personal Month ${c.personalMonth.value}** (until ${E.fmtShort(c.personalMonth.end)}): ${num(c.personalMonth.value).month}`;
  }
  if (/today|day|now|energy/.test(q)) {
    return `Today is a **Universal ${r.ud} day** (${r.title}) and scores **${r.score}%** for you. ${r.text}\n\nGood for: ${r.good.join('; ')}.\nWatch for: ${r.watch.join('; ')}.\n\n${r.combo.text}`;
  }
  if (/strength|good at|talent/.test(q)) return `Your strengths: ${lp.strengths.join(', ')}. ${lp.advantages}`;
  if (/weak|problem|struggle|challenge/.test(q)) return `Your growth edges: ${lp.weaknesses.join(', ')}. ${lp.problem}\n\nWhat helps: ${lp.needToDo}`;
  if (/study|learn|school/.test(q)) return lp.study;
  if (/lucky|luck|color|colour/.test(q)) return `Lucky numbers: ${c.lucky.join(' · ')}. Lucky colors: ${lp.colors.join(', ')}. Days of the month that echo your ${c.lifePath}: ${luckyDays(c.lifePath).join(', ')}.`;
  if (/tiger|rat|ox|rabbit|dragon|snake|horse|goat|monkey|rooster|dog|pig|chinese|zodiac/.test(q)) return `You're a **${c.chinese.element} ${c.chinese.animal}** (${c.chinese.polarity}). ${ani.overview}`;
  if (/sign|pisces|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|horoscope/.test(q)) return `You're a **${c.sign.name}** (${c.sign.element}, ${c.sign.modality}, ruled by ${c.sign.ruler}). ${sig.overview}`;
  return `Here's your snapshot: Life Path **${c.lifePath}** (${lp.title}), ${c.chinese.element} ${c.chinese.animal}, ${c.sign.name}. Today is a ${r.ud} day at ${r.score}% for you.\n\nTry asking about **love**, **career**, **this week**, **my year**, **lucky numbers**, or "compatibility with 1990-05-12".`;
}

export const luckyDays = (lp) => Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => E.root(E.reduce(d)) === E.root(lp));

export { NUMBERS };
