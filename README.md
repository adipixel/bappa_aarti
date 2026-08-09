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
| **Highlighted refrain** | The ध्रु/धृ stanza — the bit that comes back after every verse — is marked with an accent rule, so you can find your way back to it mid-song. |
| **Cued refrains written out** | Aartis print the chorus once, then cue it back with shorthand (`॥ जय देव ॥`, `जयदेव…`). Those are resolved and laid out in full, marked ↻ — so with auto-scroll running you never have to scroll back to find the words. |
| **Dimmed notation** | Danda marks and verse numbers (`।`, `॥ २ ॥`) are rendered faintly. They stay readable, but the eye lands on the words. |
| **Hanging indent** | A long line that wraps is indented, so it is never mistaken for the next line of the verse. |
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

The lyrics were collected by hand over years, so the same verse ending appeared
as `।।१॥`, `॥ १ ॥`, `।। १ ।।` and `॥१॥`. The build normalises all of it to a
single `॥ N ॥` form, and evens out the spacing around every danda. **Only
punctuation and whitespace are touched** — the build is checked against the
source with all notation stripped, so no word or spelling can drift.

### Refrains

An aarti prints its chorus once and afterwards only cues it — inline as
`... ॥ जय देव ॥ २ ॥`, or as a trailing-off line of its own (`जयदेव…`,
`आरती..`). A singer knows to repeat the whole thing; someone reading along on a
phone, with auto-scroll running and no way to scroll back, does not.

The build resolves each cue and writes the refrain out in full where it
belongs. Resolution is deliberately conservative: **a cue is expanded only when
another, longer line in the same song begins with exactly those letters**
(compared on letters alone, since cues vary — `जय देव` vs `जयदेव`). Anything
that cannot be resolved that way is left exactly as written.

What disqualifies a cue is ambiguity, not brevity — there is no minimum length.
`येई` is a perfectly good pointer to `येई हो विठ्ठले …`. A cue is only rejected
when it could mean two genuinely different lines; a line that repeats the
refrain's opening with a verse number after it, as the last verse of
जय जय दिनदयाळा does, is an echo of the refrain rather than a rival meaning. In practice that
skips things like `॥ महाकैवल्यतेजा ॥`, which is ordinary line punctuation
rather than a cue, and `डाव मांडीला...`, which names the *end* of a line rather
than its start.

Each song therefore carries two fields: `lyrics`, the canonical text as
collected (and what search runs over), and `blocks`, the singing arrangement
with every cued refrain expanded. The build asserts that no original line is
lost in the process.

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

## Diagnosing a layout problem on a phone

Every layout bug so far has appeared only in the installed app and been
invisible in a desktop browser. Settings carries a viewport readout for that:
`window.inner`, `doc.client`, `visualViewport` and `screen` sizes, the shell's
height, **any gap beneath it**, and the safe-area insets.

**Open Settings and tap the version line five times.** It stays on until you
tap five more times, and survives relaunching the app — the installed app has
no address bar and always launches at `start_url`, so `?debug` cannot be typed
where it is actually needed. (In a browser tab, `?debug` still works.)

The gaps are **viewport-relative**, and that is the only honest way to measure
them: `getBoundingClientRect` is measured from the top of the web view, and the
page cannot know where on the screen the web view starts. Subtracting a
viewport-relative bottom from `screen.height` reports a 62px gap on a perfectly
healthy layout — a mistake that cost two rounds of debugging here.

| `inner − bar` | Meaning |
| --- | --- |
| 0 | The shell fills the viewport it was given. This is correct, whatever `screen` says. |
| > 0 | A real layout bug: the shell is not filling its viewport. |
| < 0 | The shell overshoots its viewport, and the controls are clipped off the bottom. |

`viewport shortfall` and `safe top/bottom` explain the rest. A shortfall equal
to `safe top` with `safe top` non-zero means the app is being drawn *under* the
status bar; with `safe top` at 0 it means the app sits *below* it, which is what
you want on iOS.

### iOS caches the launch configuration

`apple-mobile-web-app-status-bar-style` and the manifest are read **when the
app is added to the home screen**, and cached for the life of that icon.
Reloading the installed app, or deploying a new build, never re-reads them — so
a change to either only takes effect after **deleting the home-screen icon and
adding it again**.

The readout prints the status-bar value from the page. If it disagrees with the
geometry — the page says `black` while `safe-area-inset-top` is still non-zero
and the shell sits at `top 0` — the icon predates the change and needs
reinstalling.

## Versioning

The current version is shown at the bottom of the settings sheet, with the
commit and build date under it:

```
Bappa Aarti v1.4.0
81c5cdd · 2026-08-09
```

It is worth having because the service worker updates silently — without it
there is no way to tell which build a phone is actually running, which matters
when a fix can only be confirmed on someone else's device.

The number comes from `package.json`; the commit comes from
`VERCEL_GIT_COMMIT_SHA` on Vercel, or `git rev-parse` locally.

**Bump it in the same commit as the change**, matching what changed:

| Change | Bump | Command |
| --- | --- | --- |
| Bug fix, wording, styling touch-up | patch — `1.4.0` → `1.4.1` | `npm run bump:patch` |
| New feature, new songs, changed behaviour | minor — `1.4.0` → `1.5.0` | `npm run bump:minor` |
| Redesign, or anything that resets saved settings | major — `1.4.0` → `2.0.0` | `npm run bump:major` |

The scripts pass `--no-git-tag-version`, so they only edit `package.json` —
commit it yourself alongside the change.

### History

| Version | Change |
| --- | --- |
| 1.0.0 | First release: three playlists, 43 songs, offline PWA |
| 1.0.1 | Canonical SPA rewrite for Vercel |
| 1.0.2 | Dropped `crossOrigin` so audio needs HTTPS but not CORS |
| 1.1.0 | Lyrics-only; audio behind `VITE_AUDIO_ENABLED` |
| 1.2.0 | Install prompt, credit line, Noto Serif Devanagari, lyric typography |
| 1.2.1 | Fixed the song controls drifting mid-screen on iOS |
| 1.3.0 | Cued refrains written out in full |
| 1.3.1 | Correct refrain detection in aartis that only imply it |
| 1.4.0 | Version shown in settings |
| 1.5.0 | Pin the shell to the viewport when installed; viewport readout behind `?debug` |
| 1.5.1 | Reveal the readout by tapping the version, reachable in the installed app |
| 1.5.2 | Withdrawn — grew the shell past its viewport and clipped the controls |
| 1.5.3 | Opaque black status bar, so iOS lays the app out below it rather than under it |
| 1.5.4 | Readout reports the cached launch configuration |
| 1.5.5 | Readout measures gaps against the viewport only |
| 1.5.6 | Resolve short refrain cues such as `येई …` |

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

- **Font:** Devanagari is set in **Noto Serif Devanagari**, self-hosted as a
  124 KB variable subset (`public/fonts/`) covering weights 400–600. A serif
  reads warmer than the system sans and holds its weight on a dark screen at
  arm's length. Self-hosting means it renders identically on every phone and
  still works offline. System faces remain the fallback. Latin text keeps the
  system UI font, which costs nothing.
  Tiro Devanagari Marathi was the runner-up — more elegant, but too light on a
  dark background and it ships no bold. Swapping is a one-line change to
  `--font-deva`.
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
