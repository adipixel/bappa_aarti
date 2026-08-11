/**
 * Builds src/data/songs.json from the legacy `morya` database.json.
 *
 * Source of truth for content: adipixel/morya -> database.json
 * Source of truth for audio filenames: "Aarti music file names" email
 * (adityamhamunkar.com/bappamusic/<category>/).
 *
 * Run: node scripts/build-data.mjs <path-to-legacy-database.json>
 *
 * Lyric normalisation and refrain resolution live in lib/lyrics.mjs, shared
 * with scripts/songs.mjs.
 *
 * The real database.json is not in this repo, so this script is easy to break
 * without noticing. fixtures/legacy-sample.json is a stand-in of the same
 * shape — run against it to check the script still works, but restore
 * src/data/songs.json afterwards, because it writes over the real thing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { buildBlocks, cleanLyrics, romanize } from './lib/lyrics.mjs';

const AUDIO_BASE = 'https://adityamhamunkar.com/bappamusic';


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


const audioFor = (categoryId, songId, legacyUrl) => {
  let file = legacyUrl ? basename(legacyUrl) : RECOVERED_AUDIO[categoryId]?.[songId];
  if (!file) return undefined;
  file = AUDIO_FIXUPS[file] ?? file;
  return `${AUDIO_BASE}/${categoryId}/${encodeURIComponent(file)}`;
};

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('usage: node scripts/build-data.mjs <path-to-legacy-database.json>');
  process.exit(1);
}
const legacy = JSON.parse(readFileSync(sourcePath, 'utf8'));

/*
 * Every category the file holds, in the order it holds them.
 *
 * This was a hardcoded list of three — aarti, gajar, shlok. The file has a
 * fourth, मंगलाष्टके with eleven songs, and the list dropped it silently: no
 * warning, no count that failed to add up, nothing to notice. Reading the keys
 * off the file cannot lose a category that way, and the titles are in there
 * already.
 */
const playlists = Object.entries(legacy)
  .filter(([, category]) => category && typeof category === 'object' && category.list)
  .map(([playlistId, category]) => {
  const meta = {
    id: playlistId,
    title: category.title?.trim() || playlistId,
    titleEn: romanize(playlistId),
  };
  const entries = Object.entries(category.list);
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
