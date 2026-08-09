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

/** Collapse the ragged whitespace the lyrics were pasted in with. */
const cleanLyrics = (raw) =>
  (raw ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

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
      ...(lyricsPending ? { lyricsPending: true } : {}),
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
  console.log(
    `${p.id.padEnd(6)} ${String(p.count).padStart(2)} songs | ${withAudio} with audio | ${pending} lyrics pending`,
  );
}
