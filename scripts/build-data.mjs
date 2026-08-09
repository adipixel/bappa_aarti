/**
 * Builds src/data/songs.json from the legacy `morya` database.json.
 *
 * Source of truth for content: adipixel/morya -> database.json
 * Source of truth for audio filenames: "Aarti music file names" email
 * (adityamhamunkar.com/bappamusic/<category>/).
 *
 * Run: node scripts/build-data.mjs <path-to-legacy-database.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

const AUDIO_BASE = 'https://adityamhamunkar.com/bappamusic';

const PLAYLISTS = [
  { id: 'aarti', title: 'आरत्या', titleEn: 'Aarti' },
  { id: 'gajar', title: 'गजर', titleEn: 'Gajar' },
  { id: 'shlok', title: 'श्लोक', titleEn: 'Shlok' },
];

/**
 * Audio the legacy DB never carried, recovered from the emailed file listing.
 * Only mappings that are unambiguous from the filename are included — a wrong
 * track playing under the wrong lyrics is worse than no track at all.
 */
const RECOVERED_AUDIO = {
  gajar: { ashtavinayak: '1-ashthavinayak.mp3' },
  shlok: {
    'sada-sarvada': '1-sada-sarvada.mp3',
    'morya-morya': '2-moraya-moraya.mp3',
    'jya-jya-thikani': '5-jya-jya-thikani.mp3',
  },
};

/** The legacy DB has a double-extension typo; the emailed listing is correct. */
const AUDIO_FIXUPS = { '22-shree-swami-samartha.mp3.mp3': '22-shree-swami-samartha.mp3' };

const romanize = (id) =>
  id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/**
 * Puts every verse into the same shape.
 *
 * The lyrics were collected by hand over years, so the same verse ending shows
 * up as `।।१॥`, `॥ १ ॥`, `।। १ ।।` and `॥१॥`. This normalises the danda marks
 * and the space around them so each line ends consistently.
 *
 * Only punctuation and whitespace are touched — never a word, never a spelling.
 */
function formatLine(line) {
  return (
    line
      // A doubled single danda is a double danda written the long way.
      .replace(/।।/g, '॥')
      // One space either side of each danda. (। U+0964 and ॥ U+0965 are
      // distinct characters, so these two passes cannot interfere.)
      .replace(/\s*॥\s*/g, ' ॥ ')
      .replace(/\s*।\s*/g, ' । ')
      // A single danda butted against a double one is redundant: "। ॥ ६ ॥"
      .replace(/।\s+॥/g, '॥')
      .replace(/ {2,}/g, ' ')
      .trim()
      // Close a verse number that was left hanging: "॥ ६" -> "॥ ६ ॥"
      .replace(/॥\s*([०-९]+)\s*$/, '॥ $1 ॥')
  );
}

/** Collapse the ragged whitespace the lyrics were pasted in with. */
const cleanLyrics = (raw) =>
  (raw ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => formatLine(line.replace(/[ \t]+/g, ' ').trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const audioFor = (categoryId, songId, legacyUrl) => {
  let file = legacyUrl ? basename(legacyUrl) : RECOVERED_AUDIO[categoryId]?.[songId];
  if (!file) return undefined;
  file = AUDIO_FIXUPS[file] ?? file;
  return `${AUDIO_BASE}/${categoryId}/${encodeURIComponent(file)}`;
};

/* ------------------------------------------------------------------ *
 * Refrain resolution
 *
 * Aartis print the refrain once, then cue it back with shorthand — either
 * inline (`... ॥ जय देव ॥ २ ॥`) or as a trailing-off line of its own
 * (`जयदेव…`). A singer knows to repeat the whole chorus there; a reader
 * following along on a phone, with auto-scroll running and no way to scroll
 * back, does not.
 *
 * So each cue is resolved to the refrain it points at and the full text is
 * laid out in its place. Resolution is deliberately conservative: a cue is
 * only expanded when another, longer line in the same song begins with those
 * exact letters. Anything ambiguous is left exactly as written.
 * ------------------------------------------------------------------ */

/** Compare on letters alone — cues vary in spacing and danda ("जय देव" / "जयदेव"). */
const bare = (s) => s.replace(/[।॥\s.…]/g, '');

const DHRU = /ध्रु|धृ/;
const ENDS_WITH_VERSE_NUMBER = /॥\s*[०-९]+\s*॥\s*$/;

/** A line that is nothing but a trailing-off phrase: "जयदेव…", "आरती..". */
const standaloneCue = (line) => {
  if (/[।॥]/.test(line)) return null;
  const m = line.match(/^(.{2,45}?)\s*[.…]+$/);
  return m ? m[1].trim() : null;
};

/** A `॥ phrase ॥` group inside a line that is neither a verse number nor the ध्रु mark. */
const inlineCue = (line) => {
  for (const m of line.matchAll(/॥\s*([^॥।]{2,30}?)\s*॥/g)) {
    const text = m[1].trim();
    if (/^[०-९]+$/.test(text) || DHRU.test(text)) continue;
    return { text, token: m[0] };
  }
  return null;
};

const cueOf = (line) => {
  const s = standaloneCue(line);
  if (s) return { text: s, standalone: true };
  const i = inlineCue(line);
  return i ? { text: i.text, token: i.token, standalone: false } : null;
};

/**
 * How far the refrain runs from its opening line. Stops at whichever comes
 * first: the ध्रु mark, a verse number, the refrain's own shorthand cue
 * (`॥ जय जय ॥` closing the chorus it belongs to), a line that is itself a
 * cue, the end of the stanza, or four lines.
 */
function refrainEnd(stanza, start) {
  const key = bare(stanza[start]);
  for (let i = start; i < stanza.length && i - start < 4; i++) {
    const line = stanza[i];
    if (i > start && standaloneCue(line)) return i - 1;
    if (DHRU.test(line) || ENDS_WITH_VERSE_NUMBER.test(line)) return i;
    const inline = inlineCue(line);
    if (i > start && inline && key.startsWith(bare(inline.text))) return i;
  }
  return Math.min(start + 3, stanza.length - 1);
}

/** Locate the song's refrain: the line a cue points back to, and its extent. */
function findRefrain(stanzas) {
  const flat = [];
  stanzas.forEach((st, si) => st.forEach((line, li) => flat.push({ line, si, li })));

  const votes = new Map();
  for (const { line, si, li } of flat) {
    const cue = cueOf(line);
    if (!cue) continue;
    const key = bare(cue.text);
    if (key.length < 4) continue;
    const anchor = flat.find(
      (f) => !(f.si === si && f.li === li) && bare(f.line).startsWith(key) && bare(f.line).length > key.length,
    );
    if (!anchor) continue; // Unresolvable shorthand — leave the line alone.
    const id = `${anchor.si}:${anchor.li}`;
    votes.set(id, (votes.get(id) ?? 0) + 1);
  }

  if (votes.size) {
    const [best] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
    const [si, li] = best.split(':').map(Number);
    return { si, from: li, to: refrainEnd(stanzas[si], li) };
  }

  // No cues to go on: fall back to the ध्रु mark, taking the run of lines that
  // ends there rather than the whole stanza it happens to sit in.
  for (let si = 0; si < stanzas.length; si++) {
    const li = stanzas[si].findIndex((l) => DHRU.test(l));
    if (li === -1) continue;
    let from = 0;
    for (let i = li - 1; i >= 0; i--) {
      if (ENDS_WITH_VERSE_NUMBER.test(stanzas[si][i])) {
        from = i + 1;
        break;
      }
    }
    return { si, from: Math.max(from, li - 3), to: li };
  }
  return null;
}

/**
 * Turns lyrics into the blocks the app renders: verses, the refrain, and a
 * copy of the refrain wherever it was only cued.
 */
function buildBlocks(lyrics) {
  const stanzas = lyrics.split(/\n{2,}/).filter(Boolean).map((s) => s.split('\n'));
  const refrain = findRefrain(stanzas);
  if (!refrain) return stanzas.map((lines) => ({ role: 'verse', lines }));

  const refrainLines = stanzas[refrain.si].slice(refrain.from, refrain.to + 1);
  const refrainKey = bare(refrainLines[0]);
  const blocks = [];
  const push = (role, lines, repeat) => {
    if (!lines.length) return;
    // A cue sitting directly after the refrain itself would print it twice.
    if (role === 'refrain' && blocks.at(-1)?.role === 'refrain') return;
    blocks.push(repeat ? { role, repeat: true, lines } : { role, lines });
  };

  for (let si = 0; si < stanzas.length; si++) {
    let verse = [];
    let repeatAfter = false;

    for (let li = 0; li < stanzas[si].length; li++) {
      const line = stanzas[si][li];

      // The refrain's own printing: emit it as the refrain, in place.
      if (si === refrain.si && li === refrain.from) {
        push('verse', verse);
        verse = [];
        push('refrain', refrainLines);
        li = refrain.to;
        continue;
      }

      const cue = cueOf(line);
      const isCue = cue && bare(cue.text).length >= 4 && refrainKey.startsWith(bare(cue.text));

      if (isCue && cue.standalone) {
        // The whole line is shorthand — replace it with the refrain.
        push('verse', verse);
        verse = [];
        push('refrain', refrainLines, true);
        continue;
      }
      if (isCue && !cue.standalone) {
        // Keep the verse text and the verse number, drop the shorthand, and
        // bring the refrain back after the stanza.
        verse.push(line.replace(cue.token, '॥').replace(/ {2,}/g, ' ').trim());
        repeatAfter = true;
        continue;
      }
      verse.push(line);
    }

    push('verse', verse);
    if (repeatAfter) push('refrain', refrainLines, true);
  }

  return blocks;
}

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('usage: node scripts/build-data.mjs <path-to-legacy-database.json>');
  process.exit(1);
}
const legacy = JSON.parse(readFileSync(sourcePath, 'utf8'));

const playlists = PLAYLISTS.map((meta) => {
  const entries = Object.entries(legacy[meta.id].list);
  const songs = entries.map(([songId, song], index) => {
    const lyrics = cleanLyrics(song.lyrics);
    // "लवकरच..." ("coming soon") is a placeholder, not a lyric.
    const lyricsPending = lyrics === '' || lyrics === 'लवकरच...';
    return {
      id: songId,
      track: index + 1,
      title: song.title.trim(),
      titleEn: romanize(songId),
      lyrics: lyricsPending ? '' : lyrics,
      ...(lyricsPending ? { lyricsPending: true } : { blocks: buildBlocks(lyrics) }),
      ...(audioFor(meta.id, songId, song.audioUrl) ? { audio: audioFor(meta.id, songId, song.audioUrl) } : {}),
    };
  });
  return { ...meta, count: songs.length, songs };
});

writeFileSync(
  new URL('../src/data/songs.json', import.meta.url),
  JSON.stringify({ playlists }, null, 2) + '\n',
);

for (const p of playlists) {
  const withAudio = p.songs.filter((s) => s.audio).length;
  const pending = p.songs.filter((s) => s.lyricsPending).length;
  const withRefrain = p.songs.filter((s) => s.blocks?.some((b) => b.role === 'refrain')).length;
  const expanded = p.songs.reduce(
    (n, s) => n + (s.blocks?.filter((b) => b.repeat).length ?? 0),
    0,
  );
  console.log(
    `${p.id.padEnd(6)} ${String(p.count).padStart(2)} songs | ${withAudio} with audio | ` +
      `${pending} lyrics pending | ${withRefrain} with a refrain | ${expanded} cues expanded`,
  );
}
