# Bappa Aarti — आरती संग्रह

A mobile-first PWA for singing along during Ganpati puja. Four playlists —
**आरत्या (Aarti)**, **गजर (Gajar)**, **श्लोक (Shlok)**, **मंगलाष्टके
(Mangalashtak)** — with large, readable Devanagari lyrics and full offline
support.

Built with Vite + React + TypeScript. Deploys to Vercel as a static site.

## Why it is built the way it is

Every design decision assumes the same scene: a phone propped against the
decoration, someone holding an aarti thali, a room that is either dark or lit
only by the diya, and a song that cannot be paused to fiddle with settings.

| Feature | Why it matters during puja |
| --- | --- |
| **Adjustable text size** (18–46px) | The phone is at arm's length, not reading distance. Set once, persists. |
| **Keep screen awake** | A phone locking mid-verse is the single most disruptive thing that can happen. Uses the Screen Wake Lock API and re-acquires the lock when you switch back to the app. |
| **Prev / next with song names** | The next aarti is one thumb-reach away, labelled, so nobody loses the order. |
| **Swipe left / right** | Same navigation without aiming at a button. |
| **Dark theme by default** | Most aartis are sung at dawn or after sunset. Applied before first paint so there is no white flash. |
| **Stanza-aware layout** | Blank lines in the source become real stanza breaks, so verses are visually separated no matter how ragged the original text was. |
| **Highlighted refrain** | The ध्रु/धृ stanza — the bit that comes back after every verse — is marked with an accent rule, so you can find your way back to it mid-song. |
| **Cued refrains written out** | Aartis print the chorus once, then cue it back with shorthand (`॥ जय देव ॥`, `जयदेव…`). Those are resolved and laid out in full, marked ↻ — so you never have to scroll back to find the words. |
| **…and folded away** | Written out at every cue, five copies of the same chorus bury the verses that actually change. Each repeat shows only its opening two words and expands on a tap, which takes 8–25% off the length of a song. The first printing is never folded — that is where the words are learnt. |
| **Dimmed notation** | Danda marks and verse numbers (`।`, `॥ २ ॥`) are rendered faintly. They stay readable, but the eye lands on the words. |
| **Hanging indent** | A long line that wraps is indented, so it is never mistaken for the next line of the verse. |
| **Works offline** | Temples and pandals have bad signal. Lyrics, styles and shell are precached — the whole collection works with no network. |
| **Bilingual search** | `घालीन` and `ghalin` both find घालीन लोटांगण. Lyric lines are searchable too, so a half-remembered line finds the song. |
| **44px touch targets** | Eyes are on the murti, not the screen. |

## The collection

| Playlist | Songs |
| --- | --- |
| आरत्या (Aarti) | 34 |
| गजर (Gajar) | 5 |
| श्लोक (Shlok) | 10 |
| मंगलाष्टके (Mangalashtak) | 11 |

Song order is curated, not alphabetical: `सुखकर्ता दु:खहर्ता` first through
`घालीन लोटांगण` last, which is the order they are sung in. It came from the
original collection and has been rearranged since; `songs.mjs reorder` is how.

### Where the data came from

Lyrics and playlist order were recovered from the earlier `morya` project's
`database.json`.

That import ran off a hardcoded list of three categories — aarti, gajar,
shlok — and the file has four. **मंगलाष्टके, eleven songs, was dropped
silently**: no warning, no count that failed to add up. It went unnoticed for
the whole of the app's life until someone remembered the songs existed. The
importer now reads whatever categories the file holds, and
`fixtures/legacy-sample.json` carries a fourth so a run exercises that.

Audio filenames were cross-checked against the "Aarti music file names" email
listing, which corrected one double-extension typo and recovered four
recordings the database never referenced.

The lyrics were collected by hand over years, so the same verse ending appeared
as `।।१॥`, `॥ १ ॥`, `।। १ ।।` and `॥१॥`. The build normalises all of it to a
single `॥ N ॥` form, and evens out the spacing around every danda. **Only
punctuation and whitespace are touched** — the build is checked against the
source with all notation stripped, so no word or spelling can drift.

### Verse numbers and the ध्रु mark

Every aarti closes its refrain `॥ धृ ॥` and each verse `॥ N ॥`, counting the
opening verse as १. Seventeen were transcribed without some of it — or with
the first verse's number left sitting on the refrain, which is where it lands
when the refrain is printed in full underneath verse one.

`scripts/lib/notation.mjs` brings a song up to that convention. It only ever
rewrites the notation at the end of a line, and exports `wordsOf` so a caller
can prove no word moved. Two things it will not touch:

- a line that is nothing but shorthand (`द्वारकेचा राणा … विठ्ठला..`), which is
  not a verse ending and whose trailing-off is what makes the resolver treat
  that stanza as the refrain at all;
- **गजर, श्लोक and मंगलाष्टके**, which are left as they are. A gajar is a
  chant, not numbered verses — numbering गजर माला १–२९ would be inventing a
  structure it does not have — a shlok is a single stanza with nothing to
  count, and a mangalashtak closes on `कुर्यात्‌ सदा मंगलम्‌ / शुभमंगल
  सावधान`, which is its own convention and not this one.

### Refrains

An aarti prints its chorus once and afterwards only cues it — inline as
`... ॥ जय देव ॥ २ ॥`, or as a trailing-off line of its own (`जयदेव…`,
`आरती..`). A singer knows to repeat the whole thing; someone reading along on a
phone, thumbing back up the page to find the chorus, does not.

The build resolves each cue and writes the refrain out in full where it
belongs. Resolution is deliberately conservative: **a cue is expanded only when
another, longer line in the same song begins with exactly those letters**
(compared on letters alone, since cues vary — `जय देव` vs `जयदेव`). Anything
that cannot be resolved that way is left exactly as written.

What disqualifies a cue is ambiguity, not brevity — there is no minimum length.
`येई` is a perfectly good pointer to `येई हो विठ्ठले …`. A cue is only rejected
when it could mean two genuinely different lines; a line that repeats the
refrain's opening with a verse number after it, as the last verse of
जय जय दिनदयाळा does, is an echo of the refrain rather than a rival meaning.

In practice this leaves alone `॥ महाकैवल्यतेजा ॥`, which is ordinary line
punctuation rather than a cue, and `डाव मांडीला...`, which names the *end* of a
line rather than its start.

A refrain can also cue *itself*: जय जय दिनदयाळा is printed as two lines, the
second ending `॥ जय जय ॥`, which is not a terminator but shorthand for the
first line coming back round to close it —

```
जय जय दिनदयाळा सत्यनारायण देवा
पंचारती ओवाळू श्रीपती तुज भक्तिभावा ॥ जय जय ॥
```

becomes

```
जय जय दिनदयाळा सत्यनारायण देवा
पंचारती ओवाळू श्रीपती तुज भक्तिभावा
जय जय दिनदयाळा सत्यनारायण देवा ॥
```

Each song therefore carries two fields: `lyrics`, the canonical text as
collected (and what search runs over), and `blocks`, the singing arrangement
with every cued refrain expanded. The build asserts that no original line is
lost in the process.

`src/data/songs.json` was generated by the one-off legacy import:

```bash
npm run build:data -- /path/to/legacy/database.json
```

That import needs a `database.json` which does not live in this repo, so
**`songs.json` is the source of truth now**. Editing lyrics in it directly is
fine.

### Managing the collection

```bash
node scripts/songs.mjs           # the commands, and their flags
```

| Command | Does |
| --- | --- |
| `list [playlist]` | Everything, with track numbers — run this to pick a position |
| `preview <file\|->` | Show the layout it would produce, write nothing |
| `add <file\|->` | Add a song |
| `move <id> <position>` | Renumber within its playlist |
| `reorder <file\|->` | Rearrange a whole playlist from a written-out list |
| `rename <id> --title "..."` | Change the displayed title, keeping the id |
| `lyrics <id> <file\|->` | Give words to a song added with `--pending` |
| `remove <id>` | Take one out |

Adding needs nothing but the lyrics — one verse per block, a blank line between
verses, exactly as they are sung:

```bash
node scripts/songs.mjs add data/lyrics/undaravari-baisoni.txt --at 21
```

The playlist defaults to `aarti`, the position to the end, and the title and id
are read off the first line. Lyrics can also come in on stdin, so pasting
works:

```bash
pbpaste | node scripts/songs.mjs add - --at 21
```

Tracks after the insertion point shift up by one and the count follows; `move`
does the same arithmetic. The cleaned lyrics are saved to `data/lyrics/<id>.txt`
so a song can be rebuilt later. Those files are not read at runtime.

**Check the guesses.** Titles and ids are inferred, and the collection is not
consistent enough to infer them reliably — measured against the songs already
here, the title is right about half the time and the id about a third, because
Marathi drops internal vowels in ways no letter-by-letter scheme predicts
(लवथवती is `lavthavti`, not `lavathavati`). Both are printed, marked
`(guessed)`, and both take an override:

```bash
node scripts/songs.mjs add lyrics.txt --at 21 \
  --title "अष्टविनायक" --id ashtavinayak
```

A song whose words have not been tracked down yet can still hold its place in
the running order — `--pending` with a title and no lyrics stores the same
shape the app renders as "लवकरच…":

```bash
node scripts/songs.mjs add --pending --title "आरती तुकारामा" --at 14
```

When the words turn up, `lyrics` fills them in without disturbing the title,
id or position:

```bash
node scripts/songs.mjs lyrics aarti-tukarama words.txt
```

Lyrics typed on a keyboard with no danda key are fine. The pipe and the letter
`l` both stand in for one, doubled for ॥ and single for ।, so `l`, `ll`, `|`
and `||` all come out as dandas.

### Rearranging

Paste the list back in the order you want it, one per line — `reorder` ignores
leading `12.` numbering, so the output of `list` can go straight back in, and
entries may be titles or ids:

```bash
node scripts/songs.mjs reorder new-order.txt --playlist aarti --dry-run
```

It checks the list as a whole before writing anything: **every entry must name
a song in the playlist, and every song must appear exactly once.** A dropped
line, a duplicate or a typo fails the command and names the problem, rather
than quietly losing an aarti — which is the real risk in rearranging thirty of
them by hand.

**Check the refrain too.** Working out which stanza is the chorus is inference,
so `add` prints the finished arrangement — verses, the refrain, and each place
it is repeated (`↻`) — and says so loudly when it found no refrain at all. Use
`preview`, or `add --dry-run`, to see that before anything is written. A song
whose chorus is cued in an unfamiliar shape usually needs its lyrics file
adjusted rather than the resolver changed.

Normalisation and refrain resolution live in `scripts/lib/lyrics.mjs`, shared
with the legacy import, so a song added today is laid out exactly like the ones
that came in at the start. Naming lives in `scripts/lib/naming.mjs`.

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

## Support link

One word — **Support** — in the footer of the home screen, under the credit
line, linking to a Razorpay page (`SUPPORT_URL` in `src/pages/HomePage.tsx`).
It is the only place money is mentioned anywhere in the app.

It sits in the footer rather than in a card of its own because that is already
the part of the screen about who made this, and it is on the home screen only —
**never on a playlist or a song page**. Nobody holding an aarti thali should be
asked for anything. If ads are ever added, the same rule holds: home screen or
nowhere.

A tap sends a `select_content` event to analytics. That counts click-throughs,
not payments — Razorpay knows what was actually paid — which is the number the
wording should be judged on.

## The icon

The mark is **one shape at seven scales**: a quarter disc, whose radius equals
the side of the square cell holding it. The cells are a golden subdivision,
which is what lets them tile with nothing left over:

```
1/φ + 1/φ² = 1     exactly
```

So the big lobe's square splits into one cell of `R/φ` beside a column of
`R/φ²` and `R/φ³`, with no remainder. **The gaps therefore are not slack in the
layout** — the layout has none. Every cell is inset by the same half-gap on all
four sides, which is what keeps the spacing even everywhere.

```
┌───────┬───────────────┐
│ petal │               │   petals: two R/2 cells stacked,
├───────┤   big lobe    │   so the pair is exactly as tall
│ petal │      (R)      │   as the big lobe
├───┬───┼───────────────┤
│sml│   │               │   sml = R/φ³   p3 = R/φ²
├───┘p3 │    piece2     │   piece2 = R/φ
│       │     (R/φ)     │
└───────┴───────────────┘
```

`public/favicon.svg` is generated, not hand-edited — run `npm run build:icon`.
The PNGs (`icon-192`, `icon-512`, `apple-touch-icon`) are rasterised from it.

Colours come from the app's own tokens rather than a separate palette: the
background is the `--accent-strong` → `--accent` gradient used on buttons and
the playlist badges, and the mark is `--accent-contrast`, the token meaning
"sits on top of accent". An earlier version used a coral red sampled from the
reference image, which clashed with the amber UI — including the amber glow the
home page already draws behind the icon.

### Reconstructing it

The design arrived as a screenshot, so the geometry was recovered by
measurement: the image was thresholded into a mask, and each piece's corner and
radius found by least-squares circle-fitting the boundary pixels. That gave the
sizes, and the ratios between them turned out to be `1/φ` to within a pixel or
two — the residuals being, exactly, one gap width, because a traced size is the
*inset* size. The construction above is that finding, rebuilt from the ratio
rather than from the traced pixels.

Checked at publish time against the reference: **0.917 IoU** on the mark's
silhouette, aspect ratio 0.923 against a measured 0.921, all four internal gaps
uniform to the pixel, and legible down to 32px.

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
| 1.5.7 | Expand a refrain that closes by cueing its own opening line |
| 1.6.0 | New geometric app icon, reconstructed from a reference image |
| 1.7.0 | Icon rebuilt from its golden construction, recoloured to the app's palette |
| 1.7.1 | Graceful crash screen, crash reporting, production sourcemaps |
| 1.7.2 | Fixed the blank page on leaving a playlist (effect returning a non-function) |
| 1.8.0 | New aarti `उंदरावरि बैसोनि` at 21 |
| 1.9.0 | `songs.mjs` — add, move, remove, preview, with inferred titles and ids |
| 1.9.1 | Two shloks: `गणाधीश जो ईश`, `वक्रतुंड महाकाय` |
| 1.10.0 | Support link in the home-screen footer |
| 1.10.1 | Shlok `नेत्री दोन हिरे` at 8 |
| 1.11.0 | `reorder`, `rename` and `add --pending`; aartis rearranged |
| 1.12.0 | Lyrics for `आरती तुकारामा` and `नमो गजानन नमो हनुमान`; `lyrics` command |
| 1.13.0 | Repeated refrains fold to their opening words, tap to expand |
| 1.14.0 | Auto-scroll removed |
| 1.14.1 | Lyric corrections in five aartis |
| 1.15.0 | Verse numbers and the ध्रु mark made consistent across the aartis |
| 1.16.0 | Playlist cards carry an instrument mark instead of an initial |
| 1.17.0 | Marks redrawn; the amber badge behind them dropped |
| 1.18.0 | Playlist marks redrawn as small illustrations |
| 1.19.0 | मंगलाष्टके recovered from the legacy import and added, 11 songs |
| 1.19.1 | Lyrics for `आरती रामजी तुम्हारी` — every song now has its words |

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
