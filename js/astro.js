// Low-precision geocentric positions for the Sun, Moon and visible planets.
// Planets: JPL "Approximate Positions of the Planets" Keplerian elements
// (valid 1800–2050, errors well under a degree). Moon: Astronomical Almanac
// low-precision series (~0.3°). Good enough for sign placement and retrogrades.

const RAD = Math.PI / 180;
const norm = (x) => ((x % 360) + 360) % 360;

export const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
export const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

// [a, e, I, L, long. perihelion, long. node] and their rates per Julian century.
const ELEMENTS = {
  Mercury: [[0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593], [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
  Venus: [[0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255], [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418]],
  Earth: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]],
  Mars: [[1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
  Jupiter: [[5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
  Saturn: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
};

function helio(name, T) {
  const [base, rate] = ELEMENTS[name];
  const [a, e, I, L, peri, node] = base.map((v, i) => v + rate[i] * T);
  const w = (peri - node) * RAD, O = node * RAD, inc = I * RAD;
  let M = norm(L - peri);
  if (M > 180) M -= 360;
  M *= RAD;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(inc);
  return [(cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp, (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp];
}

const julian = (date) => date.getTime() / 864e5 + 2440587.5;
const centuries = (jd) => (jd - 2451545.0) / 36525;
// Precession from the J2000 ecliptic to the ecliptic of date (tropical zodiac).
const precession = (T) => 1.3969713 * T;

function moonLon(T) {
  const s = (a, b) => Math.sin((a + b * T) * RAD);
  return norm(218.32 + 481267.881 * T + 6.29 * s(135.0, 477198.87) - 1.27 * s(259.3, -413335.36) + 0.66 * s(235.7, 890534.22)
    + 0.21 * s(269.9, 954397.74) - 0.19 * s(357.5, 35999.05) - 0.11 * s(186.5, 966404.03));
}

export function longitude(body, jd) {
  const T = centuries(jd);
  if (body === 'Moon') return moonLon(T);
  const [xe, ye] = helio('Earth', T);
  if (body === 'Sun') return norm(Math.atan2(-ye, -xe) / RAD + precession(T));
  const [xp, yp] = helio(body, T);
  return norm(Math.atan2(yp - ye, xp - xe) / RAD + precession(T));
}

const signOf = (lon) => Math.floor(norm(lon) / 30);
const delta = (a, b) => ((b - a + 540) % 360) - 180;

// {y, m, d} at a local hour -> positions of every body.
export function skyAt(dt, hour = 12) {
  const jd = julian(new Date(dt.y, dt.m - 1, dt.d, hour));
  const out = {};
  for (const body of BODIES) {
    const lon = longitude(body, jd);
    const retro = body !== 'Sun' && body !== 'Moon' && delta(longitude(body, jd - 0.5), longitude(body, jd + 0.5)) < 0;
    out[body] = { lon, sign: signOf(lon), signName: SIGN_NAMES[signOf(lon)], deg: Math.floor(lon % 30), retro };
  }
  const elong = norm(out.Moon.lon - out.Sun.lon);
  out.phase = phaseFromElongation(elong);
  return out;
}

const PHASES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
export function phaseFromElongation(e) {
  return { name: PHASES[Math.floor((e + 22.5) / 45) % 8], elongation: e, illumination: Math.round((1 - Math.cos(e * RAD)) * 50), age: Math.round((e / 360) * 29.53 * 10) / 10 };
}

// Sign changes, retrograde stations and main lunar phases between two dates (inclusive).
export function events(start, days) {
  const out = [];
  const at = (i) => { const d = new Date(start.y, start.m - 1, start.d + i, 12); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }; };
  let prev = skyAt(at(-1));
  for (let i = 0; i < days; i++) {
    const date = at(i), cur = skyAt(date);
    for (const body of BODIES) {
      if (body === 'Moon') continue;
      if (cur[body].sign !== prev[body].sign) out.push({ date, type: 'ingress', body, sign: cur[body].signName, retro: cur[body].retro });
      if (cur[body].retro !== prev[body].retro) out.push({ date, type: 'station', body, sign: cur[body].signName, retro: cur[body].retro });
    }
    const e0 = prev.phase.elongation, e1 = cur.phase.elongation;
    for (const [target, name] of [[0, 'New Moon'], [90, 'First Quarter'], [180, 'Full Moon'], [270, 'Last Quarter']]) {
      const a = norm(e0 - target + 180) - 180, b = norm(e1 - target + 180) - 180;
      if (a < 0 && b >= 0) {
        // Crossing happened between yesterday noon and today noon: pick the nearer day.
        const day = (-a / (b - a)) < 0.5 ? at(i - 1) : date;
        if (i > 0 || day === date) out.push({ date: day, type: 'phase', name, sign: SIGN_NAMES[signOf(skyAt(day).Moon.lon)] });
      }
    }
    prev = cur;
  }
  return out;
}
