// Sun-sign horoscopes built from the real sky. Each planet's sign is counted
// from the reader's sign (whole-sign solar houses, the newspaper method), and
// the house it lands in sets the theme. Numerology adds the Universal number.
import { skyAt, events, SIGN_NAMES } from './astro.js';
import * as E from './engine.js';
import { num, SIGN_INFO } from './content.js';

export { SIGN_NAMES };

const HOUSES = {
  1: { name: 'self', area: 'your image, body and personal goals', titles: ['All Eyes on You', 'Your Fresh Start', 'Lead With You'],
    moon: ['The Moon moves through your own sign, putting your needs and moods front and center. You feel things quickly today, so trust your gut and let yourself come first.', 'This is your day to reset. Small changes to how you look, move or speak have an outsized effect on how others respond.', 'Your instincts are your compass. People notice your energy before your words, so lead with warmth and let your personality do the talking.'],
    love: 'You attract by being unapologetically yourself. Confidence is your best accessory.',
    work: 'Take initiative on something only you can do. Visibility works in your favor.',
    wellness: 'Your body is talking: move it, feed it well and rest when it asks.',
    venus: 'Venus in your sign adds charm and magnetism. It is a lovely stretch for dates, a style refresh and simply being seen.',
    mars: 'Mars in your sign fires up drive and courage. Start bold projects, but watch a shorter fuse.',
    sun: 'The Sun in your sign marks your solar new year, a powerful time to set intentions, refresh your image and put yourself first.',
    focus: ['Self-care', 'Fresh starts'], avoid: ['Over-explaining yourself', 'Rushing into conflict'] },
  2: { name: 'money', area: 'your money, possessions and self-worth', titles: ['Value Yourself', 'Steady Gains', 'Count Your Blessings'],
    moon: ['Money and comfort are in focus. A practical review of spending, or one purchase that genuinely improves daily life, feels satisfying today.', 'Your sense of security matters today. Notice what makes you feel safe and invest your time and money there, not in impulse buys.', 'Self-worth and net worth are linked today. Ask for what you are worth and say no to anything that undervalues you.'],
    love: 'Show love through thoughtful, practical gestures. Small comforts mean a lot.',
    work: 'Good for budgets, invoices, pricing and asking about pay.',
    wellness: 'Comfort is healing today: good food, a calm space and a slower pace.',
    venus: 'Venus in your money sector can sweeten income and taste. Enjoy beautiful things but keep luxury spending in check.',
    mars: 'Mars pushes you to earn more and protect what is yours. Turn that urgency into a concrete money plan.',
    sun: 'The Sun shines on your finances and values. Get organized, review subscriptions and build an income plan you believe in.',
    focus: ['Budgeting', 'Self-worth'], avoid: ['Impulse spending', 'Lending money casually'] },
  3: { name: 'communication', area: 'conversations, learning, siblings and short trips', titles: ['Speak Up', 'Messages Arrive', 'Curious Mind'],
    moon: ['Conversations carry extra weight today. A message, call or chance chat could open a useful door, so stay reachable.', 'Your mind is busy and curious. Write things down, learn something small and run the errands you have been putting off.', 'Words are your tool today. Clear up a misunderstanding with a sibling, neighbor or colleague while the mood is light.'],
    love: 'Flirty texts and honest conversation bring you closer. Say what you feel.',
    work: 'Emails, pitches, writing and short meetings go well.',
    wellness: 'Give your busy mind a break with a short walk or a screen-free half hour.',
    venus: 'Venus in your communication sector makes your words sweet and persuasive. Kind notes and playful messages land well.',
    mars: 'Mars sharpens your tongue and speeds up your thinking. Debate with care and double-check before you hit send.',
    sun: 'The Sun lights up communication. Write, pitch, study and reconnect with the people around you.',
    focus: ['Clear messages', 'Learning'], avoid: ['Gossip', 'Sending angry texts'] },
  4: { name: 'home', area: 'home, family and emotional roots', titles: ['Home Is Where the Heart Is', 'Nest and Recharge', 'Family First'],
    moon: ['The Moon draws you home. Cooking, tidying or simply spending time with family restores your energy more than going out.', 'Old feelings and family stories may surface. Be gentle with yourself and your relatives; listening heals more than fixing.', 'Your private life needs attention. A cozy evening, a call to a parent or a small home project feels deeply right.'],
    love: 'Intimacy grows in private. A quiet night in beats a crowded night out.',
    work: 'Work from a calm base. Behind-the-scenes planning goes better than big public moves.',
    wellness: 'Emotional rest is real rest. Sleep in if you can.',
    venus: 'Venus warms your home life. Decorate, host and make peace with family.',
    mars: 'Mars stirs activity at home: projects, moves or family tension. Use the energy to build, not to argue.',
    sun: 'The Sun turns your focus to home and family. Rest, nest and strengthen your emotional foundations before your next push.',
    focus: ['Family time', 'Rest'], avoid: ['Bottling up feelings', 'Bringing work home'] },
  5: { name: 'romance', area: 'romance, creativity, fun and children', titles: ['Play and Shine', 'Romance in the Air', 'Create Something'],
    moon: ['Your playful side switches on. Make time for a hobby, a date or anything that makes you laugh; joy is productive today.', 'Creativity flows. Start a creative project, dress up, take photos or flirt a little. Self-expression is rewarded.', 'Romance and fun are favored. Say yes to the invitation, plan something with the kids or simply treat yourself.'],
    love: 'One of the best days for dates and romance. Let yourself be playful.',
    work: 'Creative work, presentations and anything performative shine.',
    wellness: 'Laughter and play are medicine today.',
    venus: 'Venus in your romance sector is one of the sweetest placements for love, dating and creative pleasure.',
    mars: 'Mars brings passion and a competitive spark to love and play. Great for sports and bold flirting; skip the ego clashes.',
    sun: 'The Sun puts romance, creativity and fun in the spotlight. Make room for play and let yourself be seen.',
    focus: ['Creativity', 'Romance'], avoid: ['Risky bets', 'Unnecessary drama'] },
  6: { name: 'work and health', area: 'daily routines, work and health', titles: ['Get Organized', 'Small Steps Win', 'Healthy Habits'],
    moon: ['Practical matters take priority. Clear your to-do list, organize your space and you will feel lighter by evening.', 'Your routine is your superpower today. Steady effort on small tasks adds up, and your body appreciates a healthy reset.', 'Details matter. Help a colleague, fix a process or book the appointment you have been delaying.'],
    love: 'Love is in the small acts: making coffee, running an errand, showing up.',
    work: 'Excellent for admin, problem solving and catching up.',
    wellness: 'Hydrate, stretch and keep a simple routine.',
    venus: 'Venus brings harmony to work relationships and makes healthy routines feel enjoyable.',
    mars: 'Mars boosts your work ethic and stamina. Tackle hard tasks, but avoid burnout and short tempers at work.',
    sun: 'The Sun shines on work and wellness. Refine routines, improve health habits and get organized.',
    focus: ['Routines', 'Health'], avoid: ['Perfectionism', 'Skipping meals'] },
  7: { name: 'partnership', area: 'partnerships, close relationships and agreements', titles: ['Better Together', 'Meet Halfway', 'Partnership Spotlight'],
    moon: ['Other people take the lead today. Partnerships, personal and professional, ask for listening and compromise.', 'One-on-one connections are highlighted. A heartfelt talk with a partner or a key client can move things forward.', 'Balance giving and receiving. You see yourself more clearly through the people closest to you.'],
    love: 'Your partner, or a potential one, wants your full attention. Meet them halfway.',
    work: 'Negotiations, contracts and teamwork are favored.',
    wellness: 'Share a walk or a meal with someone you love.',
    venus: 'Venus in your partnership sector warms relationships and is lovely for commitment and making up.',
    mars: 'Mars here can spark both passion and conflict with partners. Address issues directly but fairly.',
    sun: 'The Sun highlights partnerships. Invest in key relationships and stay open to collaboration.',
    focus: ['Listening', 'Compromise'], avoid: ['Keeping score', 'People-pleasing'] },
  8: { name: 'transformation', area: 'intimacy, shared money and deep change', titles: ['Go Deeper', 'Let Go to Grow', 'Hidden Truths'],
    moon: ['Feelings run deep today. Intimate conversations, honest money talks or quiet reflection reveal what really matters.', 'Something is ready to transform. Let go of an old habit, grudge or fear and notice how much lighter you feel.', 'Trust and shared resources are in focus. Review joint finances, loans or taxes, and be honest about your needs in close bonds.'],
    love: 'Vulnerability builds trust. Let someone see the real you.',
    work: 'Good for research, investments, debt plans and anything that needs discretion.',
    wellness: 'Try an emotional detox: journal, breathe deeply and let tension go.',
    venus: 'Venus deepens intimacy and can bring support through others, from gifts to shared income.',
    mars: 'Mars intensifies desire and power dynamics. Channel it into deep work or transformation, not control.',
    sun: 'The Sun shines on intimacy and shared finances. Clear debts, deepen trust and release what no longer serves you.',
    focus: ['Honesty', 'Release'], avoid: ['Jealousy', 'Secret spending'] },
  9: { name: 'adventure', area: 'travel, study, beliefs and the big picture', titles: ['Think Bigger', 'Adventure Calls', 'Seek Meaning'],
    moon: ['Your horizons widen. Plan a trip, start a course or explore an idea that excites you; curiosity pays off.', 'Big-picture thinking comes easily. Step back from the daily grind and ask what you want your life to stand for.', 'A teacher, a book or a different culture could inspire you today. Say yes to experiences that stretch your view.'],
    love: 'Romance thrives on adventure. Try somewhere new together.',
    work: 'Good for publishing, teaching, legal matters and long-range planning.',
    wellness: 'Get outside and change your scenery.',
    venus: 'Venus brings love through travel, study or someone from a different background.',
    mars: 'Mars fuels adventure and conviction. Chase a big goal, but avoid preaching.',
    sun: 'The Sun lights up travel, learning and meaning. Expand your world and plan your next chapter.',
    focus: ['Learning', 'Adventure'], avoid: ['Arguing about beliefs', 'Over-promising'] },
  10: { name: 'career', area: 'career, reputation and public goals', titles: ['Career Spotlight', 'Aim High', 'Step Into Leadership'],
    moon: ['Your public life is in focus. People with influence are watching, so show up prepared and own your achievements.', 'Ambition rises. Set career goals, update your profile or have a clear talk with a boss or mentor.', 'Your reputation is built by how you handle responsibility today. Lead calmly and others will follow.'],
    love: 'Support each other\'s ambitions. Being proud of your partner goes a long way.',
    work: 'Excellent for interviews, presentations and talking to decision makers.',
    wellness: 'Balance your drive with a proper break.',
    venus: 'Venus at the top of your chart brings charm to your public image, which favors promotions and networking.',
    mars: 'Mars drives career ambition. Push for goals with confidence, but respect authority to avoid power struggles.',
    sun: 'The Sun reaches the top of your chart. Career and recognition take center stage, so aim high.',
    focus: ['Ambition', 'Professionalism'], avoid: ['Cutting corners', 'Public arguments'] },
  11: { name: 'friendship', area: 'friends, groups, networks and future dreams', titles: ['Friends and Future', 'Network Day', 'Dream Bigger'],
    moon: ['Friends and community lift your mood. Reach out to your circle, join a group or brainstorm with like-minded people.', 'Your future dreams want attention. Write down one long-term wish and share it with someone who can help.', 'Teamwork beats solo effort today. A friend may have exactly the contact or idea you need.'],
    love: 'Friendship is the foundation. A group outing could spark something special.',
    work: 'Networking, collaborations and online communities are favored.',
    wellness: 'A group activity or class could lift your mood.',
    venus: 'Venus brings friendly warmth: a friendship could turn romantic or your social circle grows.',
    mars: 'Mars energizes group goals and causes. Lead the team, but avoid clashes with friends.',
    sun: 'The Sun shines on friendships and future goals. Network, collaborate and refresh your long-term vision.',
    focus: ['Networking', 'Hopes'], avoid: ['Peer pressure', 'Spreading yourself thin'] },
  12: { name: 'rest', area: 'rest, spirituality and closure', titles: ['Retreat and Recharge', 'Quiet Wisdom', 'Close a Chapter'],
    moon: ['Your energy turns inward. Rest, reflect and keep a lighter schedule; dreams and intuition carry messages today.', 'A quiet day is a productive one. Finish what is lingering, forgive what you can and prepare for a fresh start.', 'Solitude restores you. Meditation, prayer or time offline helps you hear your inner voice.'],
    love: 'Love quietly today. A private, gentle moment means more than a grand gesture.',
    work: 'Behind-the-scenes work, planning and wrapping up loose ends go best.',
    wellness: 'Prioritize sleep and quiet time.',
    venus: 'Venus in your hidden sector brings secret crushes, compassion and a wish for private romance.',
    mars: 'Mars in your twelfth house can feel frustrating. Use the energy for private effort, exercise and letting go of anger.',
    sun: 'The Sun in your twelfth house closes your solar year. Rest, reflect and release before your birthday season begins.',
    focus: ['Rest', 'Reflection'], avoid: ['Overcommitting', 'Escapism'] },
};

// Relationship between the sign a body is in and the reader's sign.
const ASPECTS = [
  { name: 'conjunct', score: 1, text: 'You are emotionally in sync with the day.' },
  { name: 'semi-sextile', score: 0, text: 'A subtle shift asks you to adjust your plans slightly.' },
  { name: 'sextile', score: 1, text: 'The mood supports you: small efforts open easy doors.' },
  { name: 'square', score: -1, text: 'Expect a little friction. Pause before reacting and choose your battles.' },
  { name: 'trine', score: 1, text: 'The day flows in your favor, so trust the momentum.' },
  { name: 'quincunx', score: 0, text: 'Things may feel slightly out of sync; flexibility is your friend.' },
  { name: 'opposition', score: -1, text: 'Other people pull at your energy. Balance their needs with your own.' },
];
const aspectAt = (dist) => ASPECTS[dist <= 6 ? dist : 12 - dist];

const ELEMENT_TIP = {
  Fire: 'As a fire sign, burn off restlessness with movement before it turns into impatience.',
  Earth: 'As an earth sign, ground yourself with something tangible: cooking, gardening or a long walk.',
  Air: 'As an air sign, protect your focus; too much input scatters your energy.',
  Water: 'As a water sign, protect your emotional space and notice whose feelings you are carrying.',
};
const ELEMENT_COLORS = { Fire: ['Red', 'Orange', 'Gold'], Earth: ['Green', 'Brown', 'Olive'], Air: ['Sky blue', 'Silver', 'Yellow'], Water: ['Sea green', 'Navy', 'Lavender'] };
const PHASE_LINE = {
  'New Moon': 'It is a New Moon, so set one clear intention.',
  'Waxing Crescent': 'The waxing Moon favors building momentum.',
  'First Quarter': 'The First Quarter Moon helps you push through a hurdle.',
  'Waxing Gibbous': 'The Moon is nearly full: refine and adjust.',
  'Full Moon': 'Full Moon energy brings things to a head: celebrate progress and release what is finished.',
  'Waning Gibbous': 'The waning Moon favors sharing what you have learned.',
  'Last Quarter': 'The Last Quarter Moon says clear out and let go.',
  'Waning Crescent': 'The Moon is waning toward new, so rest and reflect.',
};

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const pick = (arr, key) => arr[hash(key) % arr.length];
const house = (bodySign, s) => ((bodySign - s + 12) % 12) + 1;
const houseLabel = (h) => `${E.ordinal(h)} house of ${HOUSES[h].name}`;
const dayName = (d) => E.WEEKDAYS[E.weekday(d)];
const shortDate = (d) => `${E.MONTHS[d.m - 1].slice(0, 3)} ${d.d}`;
const iso = E.toISO;
const signMeta = (s) => E.signByName(SIGN_NAMES[s]);
const clamp = (x) => Math.max(2, Math.min(5, Math.round(x)));

// Longer periods: the Moon's average plus the slower planets' placements.
function periodScore(avgMoon, sky, s) {
  const h = (b) => house(sky[b].sign, s);
  const asp = (b) => aspectAt((sky[b].sign - s + 12) % 12).score;
  let x = 3 + (avgMoon - 3) * 1.5;
  x += [1, 5, 9, 10, 11].includes(h('Sun')) ? 0.5 : [8, 12].includes(h('Sun')) ? -0.5 : 0;
  x += [1, 5, 7, 11].includes(h('Venus')) ? 0.4 : 0;
  x += asp('Jupiter') * 0.4 - (asp('Saturn') < 0 ? 0.4 : 0) - (asp('Mars') < 0 ? 0.3 : 0);
  if (sky.Mercury.retro && [1, 3, 6, 10].includes(h('Mercury'))) x -= 0.3;
  return clamp(x);
}

function dayScore(sky, s) {
  const h = house(sky.Moon.sign, s);
  const a = aspectAt((sky.Moon.sign - s + 12) % 12);
  return 3 + a.score + ([1, 5, 9, 10, 11].includes(h) ? 0.6 : 0) - ([8, 12].includes(h) ? 0.4 : 0);
}

const planetLine = {
  Mercury: (h, retro) => retro
    ? `Mercury is retrograde in your ${houseLabel(h)}, so review, revise and double-check anything to do with ${HOUSES[h].area} before committing.`
    : `Mercury in your ${houseLabel(h)} keeps ${HOUSES[h].area} on your mind. Conversations and plans here move fast.`,
  Venus: (h, retro) => HOUSES[h].venus + (retro ? ' Venus is retrograde, so revisit old feelings rather than rushing new commitments.' : ''),
  Mars: (h, retro) => HOUSES[h].mars + (retro ? ' With Mars retrograde, progress comes from redoing and refining rather than charging ahead.' : ''),
  Jupiter: (h) => `Jupiter in your ${houseLabel(h)} expands ${HOUSES[h].area}. This is where luck and growth find you this year.`,
  Saturn: (h) => `Saturn in your ${houseLabel(h)} asks for patience and commitment around ${HOUSES[h].area}. Slow, steady work here pays off.`,
};

function eventLine(e, s) {
  if (e.type === 'phase') {
    const h = house(SIGN_NAMES.indexOf(e.sign), s);
    if (e.name === 'New Moon') return `${shortDate(e.date)}: New Moon in ${e.sign} in your ${houseLabel(h)}. Plant a seed for ${HOUSES[h].area}.`;
    if (e.name === 'Full Moon') return `${shortDate(e.date)}: Full Moon in ${e.sign} in your ${houseLabel(h)}. ${cap(HOUSES[h].area)} reach a turning point.`;
    return `${shortDate(e.date)}: ${e.name} Moon in ${e.sign}.`;
  }
  const h = house(SIGN_NAMES.indexOf(e.sign), s);
  if (e.type === 'station') return `${shortDate(e.date)}: ${e.body} turns ${e.retro ? 'retrograde' : 'direct'} in ${e.sign} (your ${houseLabel(h)}).`;
  return `${shortDate(e.date)}: ${e.body} enters ${e.sign}, your ${houseLabel(h)}.`;
}
const cap = (t) => t[0].toUpperCase() + t.slice(1);
const firstSentence = (t) => t.split(/(?<=\.)\s/)[0];

function finish(s, extra) {
  const meta = signMeta(s), info = SIGN_INFO[meta.name];
  return { sign: meta.name, glyph: meta.glyph, element: meta.element, ruler: meta.ruler, dates: info.dates, ...extra };
}

// ---------- daily ----------
export function daily(s, date) {
  const sky = skyAt(date, 12), dawn = skyAt(date, 0), dusk = skyAt(date, 23.9);
  const mh = house(sky.Moon.sign, s), H = HOUSES[mh];
  const a = aspectAt((sky.Moon.sign - s + 12) % 12);
  const key = `${iso(date)}-${s}`;
  const meta = signMeta(s);
  const ud = E.universalDay(date);
  const later = dusk.Moon.sign !== dawn.Moon.sign
    ? ` Later the Moon moves into ${dusk.Moon.signName}, shifting attention to ${HOUSES[house(dusk.Moon.sign, s)].area}.` : '';
  const merc = sky.Mercury.retro ? ` ${planetLine.Mercury(house(sky.Mercury.sign, s), true)}` : '';
  const sections = [
    { title: 'Overview', text: `With the Moon in ${sky.Moon.signName}, your ${houseLabel(mh)} is lit up. ${pick(H.moon, key)} ${a.text} ${PHASE_LINE[sky.phase.name]}${later}` },
    { title: 'Love', text: `${H.love} ${firstSentence(HOUSES[house(sky.Venus.sign, s)].venus)}` },
    { title: 'Career & Money', text: `${H.work}${merc}` },
    { title: 'Wellness', text: `${H.wellness} ${ELEMENT_TIP[meta.element]}` },
    { title: 'Numerology', text: `It is a Universal ${ud} day: ${num(ud).day.text}`, shared: true },
  ];
  return finish(s, {
    period: 'daily', label: `${dayName(date)}, ${E.fmtLong(date)}`,
    rating: clamp(dayScore(sky, s)), headline: pick(H.titles, key), sections,
    focus: H.focus, avoid: H.avoid,
    lucky: { number: E.reduce(ud + s + 1, false) + 9 * (hash(key) % 10), color: pick(ELEMENT_COLORS[meta.element], key + 'c'), time: pick(['Morning', 'Midday', 'Afternoon', 'Evening'], key + 't') },
  });
}

// ---------- weekly (Monday to Sunday) ----------
export const weekStart = (d) => E.addDays(d, -((E.weekday(d) + 6) % 7));

export function weekly(s, date) {
  const start = weekStart(date), end = E.addDays(start, 6);
  const days = Array.from({ length: 7 }, (_, i) => { const d = E.addDays(start, i); const sky = skyAt(d); return { d, sky, score: dayScore(sky, s), h: house(sky.Moon.sign, s) }; });
  const first = days[0].sky, meta = signMeta(s);
  const ev = events(start, 7);
  const sh = house(first.Sun.sign, s);
  const sunMove = ev.find((e) => e.type === 'ingress' && e.body === 'Sun');
  const best = [...days].sort((a, b) => b.score - a.score).slice(0, 2).sort((a, b) => E.cmp(a.d, b.d));
  const gentle = days.filter((x) => x.score <= 2.5).slice(0, 2);
  const loveDays = days.filter((x) => [5, 7, 8].includes(x.h)).map((x) => dayName(x.d));
  const workDays = days.filter((x) => [2, 6, 10].includes(x.h)).map((x) => dayName(x.d));
  const restDays = days.filter((x) => [4, 12].includes(x.h)).map((x) => dayName(x.d));
  const vh = house(first.Venus.sign, s), mah = house(first.Mars.sign, s), meh = house(first.Mercury.sign, s);
  const key = `${iso(start)}-${s}-w`;
  const keyEvents = ev.filter((e) => e.type !== 'ingress' || e.body !== 'Moon').map((e) => eventLine(e, s));
  const list = (arr) => arr.length > 1 ? `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}` : arr[0];
  const sections = [
    { title: 'Overview', text: `This week the Sun is in ${first.Sun.signName}, your ${houseLabel(sh)}. ${HOUSES[sh].sun}${sunMove ? ` On ${dayName(sunMove.date)} it moves into ${sunMove.sign}, turning the spotlight to ${HOUSES[house(SIGN_NAMES.indexOf(sunMove.sign), s)].area}.` : ''} Your strongest day is ${dayName(best[0].d)}, when the Moon lights up ${HOUSES[best[0].h].area}.` },
    { title: 'Love', text: `${planetLine.Venus(vh, first.Venus.retro)}${loveDays.length ? ` Best days for love: ${list(loveDays)}.` : ''}` },
    { title: 'Career & Money', text: `${planetLine.Mercury(meh, first.Mercury.retro)} ${HOUSES[sh].work}${workDays.length ? ` Most productive: ${list(workDays)}.` : ''}` },
    { title: 'Energy & Wellness', text: `${planetLine.Mars(mah, first.Mars.retro)} ${ELEMENT_TIP[meta.element]}${restDays.length ? ` Plan downtime on ${list(restDays)}.` : ''}` },
  ];
  if (keyEvents.length) sections.push({ title: 'Key dates', text: keyEvents.join(' ') });
  return finish(s, {
    period: 'weekly', label: `Week of ${shortDate(start)} – ${shortDate(end)}, ${end.y}`,
    rating: periodScore(days.reduce((t, x) => t + x.score, 0) / 7, skyAt(E.addDays(start, 3)), s), headline: pick(HOUSES[sh].titles, key),
    sections, focus: HOUSES[sh].focus, avoid: HOUSES[mah].avoid.slice(0, 1).concat(HOUSES[sh].avoid.slice(0, 1)),
    lucky: { days: best.map((x) => dayName(x.d)), gentle: gentle.map((x) => dayName(x.d)), color: pick(ELEMENT_COLORS[meta.element], key) },
  });
}

// ---------- monthly ----------
export function monthly(s, date) {
  const first = { y: date.y, m: date.m, d: 1 };
  const n = E.daysInMonth(date.y, date.m);
  const meta = signMeta(s);
  const sky = skyAt(first);
  const ev = events(first, n);
  const days = Array.from({ length: n }, (_, i) => { const d = { ...first, d: i + 1 }; const k = skyAt(d); return { d, score: dayScore(k, s) }; });
  const best = [...days].sort((a, b) => b.score - a.score || a.d.d - b.d.d).slice(0, 4).sort((a, b) => a.d.d - b.d.d);
  const gentle = [...days].sort((a, b) => a.score - b.score || a.d.d - b.d.d).slice(0, 3).sort((a, b) => a.d.d - b.d.d);
  const sh = house(sky.Sun.sign, s);
  const sunMove = ev.find((e) => e.type === 'ingress' && e.body === 'Sun');
  const sh2 = sunMove ? house(SIGN_NAMES.indexOf(sunMove.sign), s) : sh;
  const lunations = ev.filter((e) => e.type === 'phase' && (e.name === 'New Moon' || e.name === 'Full Moon')).map((e) => eventLine(e, s));
  const forBody = (b) => ev.filter((e) => e.body === b && e.type !== 'phase').map((e) => eventLine(e, s)).join(' ');
  const vh = house(sky.Venus.sign, s), mah = house(sky.Mars.sign, s), meh = house(sky.Mercury.sign, s);
  const month = E.MONTHS[date.m - 1];
  const um = E.universalMonth(first);
  const key = `${date.y}-${date.m}-${s}-m`;
  const sections = [
    { title: 'Overview', text: `${month} opens with the Sun in ${sky.Sun.signName}, your ${houseLabel(sh)}. ${HOUSES[sh].sun}${sunMove ? ` From ${shortDate(sunMove.date)} the Sun moves into ${sunMove.sign}, your ${houseLabel(sh2)}. ${HOUSES[sh2].sun}` : ''}` },
    { title: 'New & Full Moons', text: lunations.join(' ') || 'A quieter lunar month: use it to steadily build.' },
    { title: 'Love & Relationships', text: `${planetLine.Venus(vh, sky.Venus.retro)} ${forBody('Venus')}`.trim() },
    { title: 'Career & Money', text: `${planetLine.Mercury(meh, sky.Mercury.retro)} ${HOUSES[sh].work} ${forBody('Mercury')}`.trim() },
    { title: 'Energy & Health', text: `${planetLine.Mars(mah, sky.Mars.retro)} ${forBody('Mars')} ${HOUSES[sh].wellness} ${ELEMENT_TIP[meta.element]} Go gently around ${gentle.map((x) => shortDate(x.d)).join(', ')}.`.replace(/\s+/g, ' ') },
    { title: 'Growth', text: `${planetLine.Jupiter(house(sky.Jupiter.sign, s))} ${planetLine.Saturn(house(sky.Saturn.sign, s))} ${[forBody('Jupiter'), forBody('Saturn')].filter(Boolean).join(' ')}`.trim() },
    { title: 'Numerology', text: `${month} is a Universal ${um} month: ${num(um).month}`, shared: true },
  ];
  return finish(s, {
    period: 'monthly', label: `${month} ${date.y}`,
    rating: periodScore(days.reduce((t, x) => t + x.score, 0) / n, skyAt({ ...first, d: 15 }), s), headline: pick(HOUSES[sh].titles, key),
    sections, focus: HOUSES[sh].focus.concat(HOUSES[sh2] !== HOUSES[sh] ? HOUSES[sh2].focus.slice(0, 1) : []), avoid: HOUSES[sh].avoid,
    lucky: { days: best.map((x) => shortDate(x.d)), gentle: gentle.map((x) => shortDate(x.d)), color: pick(ELEMENT_COLORS[meta.element], key) },
  });
}

export const GENERATORS = { daily, weekly, monthly };

export function allSigns(period, date) {
  return SIGN_NAMES.map((_, s) => GENERATORS[period](s, date));
}

// What the sky is doing for the cover page and the screen header.
export function skySummary(period, date) {
  const start = period === 'weekly' ? weekStart(date) : period === 'monthly' ? { y: date.y, m: date.m, d: 1 } : date;
  const len = period === 'weekly' ? 7 : period === 'monthly' ? E.daysInMonth(date.y, date.m) : 1;
  const sky = skyAt(start);
  const ev = len > 1 ? events(start, len) : [];
  const fmt = (b) => `${b} in ${sky[b].signName}${sky[b].retro ? ' (retrograde)' : ''}`;
  return {
    sky, start, len,
    lines: ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].map(fmt),
    phase: sky.phase.name,
    events: ev.map((e) => e.type === 'phase' ? `${shortDate(e.date)}: ${e.name} in ${e.sign}` : e.type === 'station' ? `${shortDate(e.date)}: ${e.body} turns ${e.retro ? 'retrograde' : 'direct'} in ${e.sign}` : `${shortDate(e.date)}: ${e.body} enters ${e.sign}`),
    number: period === 'daily'
      ? { label: 'Universal Day', value: E.universalDay(start), text: num(E.universalDay(start)).day.text }
      : { label: 'Universal Month', value: E.universalMonth(start), text: num(E.universalMonth(start)).month },
  };
}

export const stars = (r) => '★'.repeat(r) + '☆'.repeat(5 - r);

export function captionFor(r, link) {
  const tags = `#${r.sign} #${r.period}horoscope #horoscope #astrology #numerology`;
  const lucky = r.period === 'daily' ? `Lucky number ${r.lucky.number} · Color ${r.lucky.color} · Best time ${r.lucky.time}` : `Best days: ${r.lucky.days.join(', ')}`;
  return `${r.glyph}︎ ${r.sign.toUpperCase()} ${stars(r.rating)}\n${cap(r.period)} horoscope · ${r.label}\n\n${r.headline}\n\n${r.sections.map((x) => `${x.title}: ${x.text}`).join('\n\n')}\n\nFocus on: ${r.focus.join(', ')}\nAvoid: ${r.avoid.join(', ')}\n${lucky}\n\n${link ? `${link}\n` : ''}${tags}`;
}

export function captionAll(readings, summary, link) {
  const r0 = readings[0];
  const head = `✨ ${cap(r0.period)} Horoscope · ${r0.label} ✨\n${summary.lines.slice(0, 2).join(' · ')} · ${summary.phase}\n${summary.number.label} ${summary.number.value}`;
  const body = readings.map((r) => `${r.glyph}︎ ${r.sign} ${stars(r.rating)}\n${r.headline}. ${r.sections[0].text.split('. ').slice(1, 3).join('. ').replace(/\.?$/, '.')}`).join('\n\n');
  return `${head}\n\n${body}\n\n${link ? `Full readings: ${link}\n` : ''}#horoscope #${r0.period}horoscope #astrology #zodiac #numerology`;
}
