# Numa

A numerology and horoscope web app: Life Path, Personal Year/Month/Day, Universal Day, name numbers, pinnacles, Chinese (solar) zodiac and Western sun signs, an energy calendar with journal, compatibility checker and a chart-aware guide.

**Horoscopes** (`#/readings`): daily, weekly and monthly readings for all 12 signs, built from real planetary positions (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn) counted from each sign as solar houses. Export the full set as a PDF, share the pages as 1080×1350 photos for Facebook, or copy ready-made post text.

No build step and no dependencies. Run locally with:

```bash
python3 -m http.server 5173
```

Run the tests with:

```bash
node tests/run.mjs
```

Publishing an update: run `node scripts/release.mjs` before committing. It stamps a new version into `index.html` so browsers fetch the new files instead of cached ones, and open copies of the app show an "Update now" prompt.

All data (profile, journal, saved charts, page name) stays in the browser's localStorage.

Planet positions use JPL's approximate Keplerian elements (valid 1800–2050) and a low-precision Moon series; sign changes and stations are found at local noon, so their dates can differ by a day from published ephemerides.
