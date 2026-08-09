# Bappa Aarti — आरती संग्रह

A mobile-first PWA for singing along during Ganpati puja. Three playlists —
**आरत्या (Aarti)**, **गजर (Gajar)**, **श्लोक (Shlok)** — with large, readable
Devanagari lyrics, hands-free auto-scroll, and full offline support.

Built with Vite + React + TypeScript. Deploys to Vercel as a static site.

## Why it is built the way it is

Every design decision assumes the same scene: a phone propped against the
decoration, someone holding an aarti thali, a room that is either dark or lit
only by the diya, and a song that cannot be paused to fiddle with settings.

| Feature | Why it matters during puja |
| --- | --- |
| **Adjustable text size** (18–46px) | The phone is at arm's length, not reading distance. Set once, persists. |
| **Keep screen awake** | A phone locking mid-verse is the single most disruptive thing that can happen. Uses the Screen Wake Lock API and re-acquires the lock when you switch back to the app. |
| **Auto-scroll** with speed control | Hands are busy. Any touch pauses it instantly so you can take over. |
| **Prev / next with song names** | The next aarti is one thumb-reach away, labelled, so nobody loses the order. |
| **Swipe left / right** | Same navigation without aiming at a button. |
| **Dark theme by default** | Most aartis are sung at dawn or after sunset. Applied before first paint so there is no white flash. |
| **Stanza-aware layout** | Blank lines in the source become real stanza breaks, so verses are visually separated no matter how ragged the original text was. |
| **Works offline** | Temples and pandals have bad signal. Lyrics, styles and shell are precached — the whole collection works with no network. |
| **Bilingual search** | `घालीन` and `ghalin` both find घालीन लोटांगण. Lyric lines are searchable too, so a half-remembered line finds the song. |
| **44px touch targets** | Eyes are on the murti, not the screen. |

## The collection

| Playlist | Songs |
| --- | --- |
| आरत्या (Aarti) | 31 |
| गजर (Gajar) | 5 |
| श्लोक (Shlok) | 7 |

Song order is the curated order from the original collection — `सुखकर्ता दु:खहर्ता`
first through `घालीन लोटांगण` last — not alphabetical.

### Where the data came from

Lyrics and playlist order were recovered from the earlier `morya` project's
`database.json`. Audio filenames were cross-checked against the "Aarti music
file names" email listing, which corrected one double-extension typo and
recovered four recordings the database never referenced.

`src/data/songs.json` is generated, not hand-edited. To rebuild it:

```bash
npm run build:data -- /path/to/legacy/database.json
```

Editing lyrics is fine to do directly in `songs.json` — just keep the change in
mind if you ever regenerate.

## Audio is off

**This app is lyrics-only by default.** No player, no "has recording" badges,
no audio requests.

The recordings live on `adityamhamunkar.com`, which serves plain HTTP. Browsers
block HTTP media on an HTTPS page, so every play button would fail — and 26 dead
controls are worse than none. The URLs are still in `songs.json`; only the UI is
switched off.

### Turning it back on

Once the recordings are reachable over **HTTPS**, set one environment variable
in Vercel (Project → Settings → Environment Variables) and redeploy:

```
VITE_AUDIO_ENABLED=true
```

If you also moved the files, change `AUDIO_BASE` in `scripts/build-data.mjs`
and re-run `npm run build:data -- <path-to-database.json>`.

CORS headers are *not* required — the player deliberately does not set
`crossOrigin`, since it only plays the audio and never reads its samples.
HTTPS is the only requirement.

Audio **always streams and is never cached for offline use**, by design. Only
the lyrics and app shell are precached, so installing the app costs a few
hundred KB rather than a hundred megabytes.

Four Gajar and two Shlok recordings from the email listing are deliberately
**not** wired up: their filenames (`3-gajar1`, `4-udala-udala`, …) do not map
onto any song title with confidence, and the wrong track playing under the
wrong lyrics would be worse than no track at all.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
```

## Deploy to Vercel (hobby)

This repo is ready to deploy — `vercel.json` sets the framework, build command,
SPA rewrites and cache headers. No environment variables are needed.

1. Go to [vercel.com/new](https://vercel.com/new) and import `adipixel/bappa_aarti`.
2. Production Branch: `next` (the default branch, which carries the app).
3. Leave every build setting on its default — Vercel reads `vercel.json`.
   Framework preset: **Vite**, build: `npm run build`, output: `dist`.
4. Deploy. Select the **Hobby** plan when prompted.

Or from a terminal:

```bash
npm i -g vercel
vercel        # preview deployment
vercel --prod # production
```

### Installing it on a phone

- **Android / Chrome:** open the URL, then menu → *Add to Home screen*.
- **iOS / Safari:** open the URL, Share → *Add to Home Screen*.

Launching from the home screen icon runs it full screen with no browser
chrome, which is what you want propped up next to the murti.

## Notes

- **Fonts:** Devanagari renders with the system font (Kohinoor on iOS, Noto
  Sans Devanagari on Android). No webfont is downloaded — that keeps the app
  fast, fully offline, and correctly shaped on both platforms.
- **Wake lock** needs Chrome/Edge on Android, or Safari 16.4+ on iOS. Where it
  is unsupported the settings sheet says so instead of silently doing nothing.
- **आरती रामजी तुम्हारी** is in the Aarti list but has no lyrics yet — the source
  collection has a `लवकरच…` placeholder. It shows a clear "coming soon" state
  rather than an empty screen.
- **मंगलाष्टके (11 mangalashtaks)** also exist in the legacy database. They are
  not part of this app, since the ask was for three playlists — adding them is a
  one-line change in `scripts/build-data.mjs`.

## The earlier attempt

The previous version of this idea lives in the private repo **`adipixel/morya`**
(Express + Redis + CRA, with a live "Follow the broadcaster" feature). It is
untouched and still there.

It was deliberately **not** copied into a branch here: `morya` is private and
has a `.env` with a real Redis password committed to it, while this repo is
public. Copying it across would publish that credential. If you do want the old
code preserved here, rotate that Redis password first and strip `.env` from the
history.

The live-follow feature is not reimplemented — it needs a running server, which
does not fit a static Vercel hobby deployment.

---

भक्तांसाठी भक्तांकडून
