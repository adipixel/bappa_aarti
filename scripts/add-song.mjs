/**
 * Inserts a song into src/data/songs.json at a given track number.
 *
 * The legacy import (build-data.mjs) was a one-off and needs a database.json
 * that does not live in this repo, so songs.json is the source of truth now.
 * This edits it in place while going through the same normaliser and refrain
 * resolver the import used, so an aarti added today is laid out exactly like
 * the forty-three that came in at the start.
 *
 * Tracks after the insertion point shift up by one, and the playlist count
 * follows.
 *
 * Run:
 *   node scripts/add-song.mjs \
 *     --playlist aarti --track 21 \
 *     --id undaravari-baisoni --title "उंदरावरि बैसोनि" \
 *     --lyrics path/to/lyrics.txt
 *
 * Lyrics are read from a file rather than an argument: they run to many lines
 * and contain the danda characters a shell is happy to mangle.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildBlocks, cleanLyrics, romanize } from './lib/lyrics.mjs';

const DATA = new URL('../src/data/songs.json', import.meta.url);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--')) fail(`unexpected argument: ${argv[i]}`);
    args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

function fail(message) {
  console.error(`error: ${message}`);
  console.error(
    'usage: node scripts/add-song.mjs --playlist <id> --track <n> --id <slug> ' +
      '--title <देवनागरी> --lyrics <file> [--titleEn <text>]',
  );
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
for (const required of ['playlist', 'track', 'id', 'title', 'lyrics']) {
  if (!args[required]) fail(`missing --${required}`);
}

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const playlist = data.playlists.find((p) => p.id === args.playlist);
if (!playlist) {
  fail(`no playlist "${args.playlist}" (have: ${data.playlists.map((p) => p.id).join(', ')})`);
}
if (playlist.songs.some((s) => s.id === args.id)) fail(`"${args.id}" is already in ${playlist.id}`);

const track = Number(args.track);
if (!Number.isInteger(track) || track < 1 || track > playlist.songs.length + 1) {
  fail(`--track must be between 1 and ${playlist.songs.length + 1}`);
}

const lyrics = cleanLyrics(readFileSync(args.lyrics, 'utf8'));
if (!lyrics) fail(`${args.lyrics} has no lyrics in it`);

const song = {
  id: args.id,
  track,
  title: args.title.trim(),
  titleEn: args.titleEn?.trim() || romanize(args.id),
  lyrics,
  blocks: buildBlocks(lyrics),
};

playlist.songs.splice(track - 1, 0, song);
// Renumber rather than trusting the incoming order: the array is the running
// order, and `track` is only ever a mirror of the position in it.
playlist.songs.forEach((s, i) => {
  s.track = i + 1;
});
playlist.count = playlist.songs.length;

writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');

const refrain = song.blocks.filter((b) => b.role === 'refrain');
console.log(`added ${playlist.id}/${song.id} at track ${track} — ${playlist.count} songs now`);
console.log(
  `  ${song.blocks.filter((b) => b.role === 'verse').length} verses | ` +
    `${refrain.length ? `refrain of ${refrain[0].lines.length} lines` : 'no refrain found'} | ` +
    `${refrain.filter((b) => b.repeat).length} cues expanded`,
);
