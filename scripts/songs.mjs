#!/usr/bin/env node
/**
 * The song collection, from the command line.
 *
 *   node scripts/songs.mjs list [playlist]
 *   node scripts/songs.mjs preview <file|->
 *   node scripts/songs.mjs add     <file|-> [--at N] [--playlist aarti] [--id x] [--title x]
 *   node scripts/songs.mjs move    <id> <position>
 *   node scripts/songs.mjs remove  <id>
 *
 * `add` needs nothing but the lyrics: the playlist defaults to aarti, the
 * position to the end, and the title and id are guessed from the first line.
 * Every guess is printed and every one can be overruled with a flag.
 *
 * Lyrics may come from a file or on stdin, so pasting works:
 *
 *   pbpaste | node scripts/songs.mjs add - --at 21
 *
 * What it does to the lyrics — normalising the danda marks and spacing, and
 * working out which stanza is the refrain so its cues can be written out in
 * full — is the same code the original import used, in lib/lyrics.mjs. It is
 * inference, so `add` prints the finished layout and warns when no refrain was
 * found. Read it back before committing.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildBlocks, cleanLyrics, romanize } from './lib/lyrics.mjs';
import { suggestId, suggestTitle } from './lib/naming.mjs';

const DATA = new URL('../src/data/songs.json', import.meta.url);
const LYRICS_DIR = new URL('../data/lyrics/', import.meta.url);
const DEFAULT_PLAYLIST = 'aarti';

const read = () => JSON.parse(readFileSync(DATA, 'utf8'));
const write = (data) => writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');

const die = (message) => {
  console.error(`\n  error: ${message}\n`);
  process.exit(1);
};

/** Track numbers mirror array position; never trust the incoming value. */
function renumber(playlist) {
  playlist.songs.forEach((s, i) => {
    s.track = i + 1;
  });
  playlist.count = playlist.songs.length;
}

function findPlaylist(data, id) {
  const playlist = data.playlists.find((p) => p.id === id);
  if (!playlist) {
    die(`no playlist "${id}" — have ${data.playlists.map((p) => p.id).join(', ')}`);
  }
  return playlist;
}

/** Songs are addressed by id alone; ids are unique across the collection. */
function locate(data, songId) {
  for (const playlist of data.playlists) {
    const index = playlist.songs.findIndex((s) => s.id === songId);
    if (index !== -1) return { playlist, index, song: playlist.songs[index] };
  }
  die(`no song with id "${songId}" — try: node scripts/songs.mjs list`);
}

async function readLyrics(source) {
  if (!source || source === '-') {
    if (process.stdin.isTTY) die('no lyrics given — pass a file, or pipe them in');
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  }
  try {
    return readFileSync(source, 'utf8');
  } catch {
    return die(`cannot read ${source}`);
  }
}

/** Show the arrangement the app will render, so refrain detection is visible. */
function printBlocks(blocks) {
  for (const block of blocks) {
    const tag = block.role === 'refrain' ? (block.repeat ? '↻ refrain' : '  refrain') : '  verse';
    console.log(`\n  ${tag}`);
    for (const line of block.lines) console.log(`      ${line}`);
  }
}

function summarise(song) {
  const refrains = song.blocks.filter((b) => b.role === 'refrain');
  const verses = song.blocks.filter((b) => b.role === 'verse').length;
  console.log(
    `\n  ${verses} verses, ` +
      (refrains.length
        ? `a refrain of ${refrains[0].lines.length} lines repeated ${refrains.filter((b) => b.repeat).length}×`
        : 'no refrain'),
  );
  if (!refrains.length) {
    console.log(
      '  ! No refrain was found. If this song has one, its cue is in a shape\n' +
        '    the resolver does not know — check the layout above before committing.',
    );
  }
}

/** Build the song record, reporting which fields were guessed rather than given. */
function compose(raw, flags, playlist) {
  const lyrics = cleanLyrics(raw);
  if (!lyrics) die('those lyrics are empty once cleaned up');

  const guessedTitle = !flags.title;
  const title = (flags.title ?? suggestTitle(lyrics)).trim();
  if (!title) die('could not work out a title — pass --title');

  const guessedId = !flags.id;
  const id = flags.id ?? suggestId(title);
  if (!id) die(`could not turn "${title}" into an id — pass --id`);

  console.log(`\n  title   ${title}${guessedTitle ? '   (guessed — --title to change)' : ''}`);
  console.log(`  id      ${id}${guessedId ? '   (guessed — --id to change)' : ''}`);
  console.log(`  roman   ${flags.titleEn ?? romanize(id)}`);
  console.log(`  going into ${playlist.id}`);

  return {
    lyrics,
    song: {
      id,
      track: 0, // set by renumber()
      title,
      titleEn: flags.titleEn?.trim() || romanize(id),
      lyrics,
      blocks: buildBlocks(lyrics),
    },
  };
}

/* ---------------------------------------------------------------- commands */

function cmdList(data, [playlistId]) {
  const playlists = playlistId ? [findPlaylist(data, playlistId)] : data.playlists;
  for (const playlist of playlists) {
    console.log(`\n  ${playlist.title} (${playlist.id}) — ${playlist.count}`);
    for (const song of playlist.songs) {
      const marks = [
        song.lyricsPending ? 'no lyrics' : '',
        song.blocks?.some((b) => b.role === 'refrain') ? '' : 'no refrain',
      ]
        .filter(Boolean)
        .join(', ');
      console.log(
        `   ${String(song.track).padStart(3)}  ${song.title.padEnd(26)} ${song.id}` +
          (marks ? `   (${marks})` : ''),
      );
    }
  }
  console.log();
}

async function cmdPreview(data, positional, flags) {
  const playlist = findPlaylist(data, flags.playlist ?? DEFAULT_PLAYLIST);
  const { song } = compose(await readLyrics(positional[0]), flags, playlist);
  printBlocks(song.blocks);
  summarise(song);
  console.log('\n  Nothing was written. Re-run with `add` to keep it.\n');
}

async function cmdAdd(data, positional, flags) {
  const playlist = findPlaylist(data, flags.playlist ?? DEFAULT_PLAYLIST);
  const { song } = compose(await readLyrics(positional[0]), flags, playlist);

  if (data.playlists.some((p) => p.songs.some((s) => s.id === song.id))) {
    die(`"${song.id}" already exists — pass --id to pick another`);
  }
  const clash = playlist.songs.find((s) => s.title === song.title);
  if (clash) console.log(`\n  ! ${playlist.id} already has a "${clash.title}" (${clash.id})`);

  const at = flags.at === undefined ? playlist.songs.length + 1 : Number(flags.at);
  if (!Number.isInteger(at) || at < 1 || at > playlist.songs.length + 1) {
    die(`--at must be between 1 and ${playlist.songs.length + 1}`);
  }

  printBlocks(song.blocks);
  summarise(song);

  if (flags['dry-run']) {
    console.log('\n  Dry run — nothing written.\n');
    return;
  }

  playlist.songs.splice(at - 1, 0, song);
  renumber(playlist);
  write(data);

  // Keep the source text beside the data, so a song can be rebuilt later.
  mkdirSync(fileURLToPath(LYRICS_DIR), { recursive: true });
  writeFileSync(new URL(`${song.id}.txt`, LYRICS_DIR), song.lyrics + '\n');

  console.log(`\n  Added at ${at} of ${playlist.count} in ${playlist.id}.\n`);
}

function cmdMove(data, [songId, position]) {
  if (!songId || position === undefined) die('usage: songs.mjs move <id> <position>');
  const { playlist, index, song } = locate(data, songId);

  const to = Number(position);
  if (!Number.isInteger(to) || to < 1 || to > playlist.songs.length) {
    die(`position must be between 1 and ${playlist.songs.length}`);
  }
  if (to === song.track) {
    console.log(`\n  ${song.title} is already at ${to}.\n`);
    return;
  }

  const from = song.track;
  playlist.songs.splice(index, 1);
  playlist.songs.splice(to - 1, 0, song);
  renumber(playlist);
  write(data);
  console.log(`\n  ${song.title}: ${from} → ${to} in ${playlist.id}.\n`);
}

function cmdRemove(data, [songId]) {
  if (!songId) die('usage: songs.mjs remove <id>');
  const { playlist, index, song } = locate(data, songId);
  playlist.songs.splice(index, 1);
  renumber(playlist);
  write(data);
  console.log(`\n  Removed ${song.title} from ${playlist.id} — ${playlist.count} left.`);
  console.log(`  Its lyrics are still at data/lyrics/${song.id}.txt.\n`);
}

/* -------------------------------------------------------------------- main */

const USAGE = `
  node scripts/songs.mjs <command>

    list    [playlist]              what is in the collection, with track numbers
    preview <file|->                show the layout without writing anything
    add     <file|->                add a song
    move    <id> <position>         renumber within its playlist
    remove  <id>                    take one out

  add / preview flags
    --at N            position in the playlist        (default: the end)
    --playlist ID     aarti | gajar | shlok           (default: ${DEFAULT_PLAYLIST})
    --title  "..."    Devanagari title                (default: from the first line)
    --id     slug     url id                          (default: from the title)
    --titleEn "..."   roman subtitle                  (default: from the id)
    --dry-run         with add, stop before writing

  Lyrics come from a file, or from stdin when the argument is "-".
  One verse per block, a blank line between verses.
`;

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) {
      positional.push(argv[i]);
      continue;
    }
    const name = argv[i].slice(2);
    if (name === 'dry-run') flags[name] = true;
    else flags[name] = argv[++i];
  }
  return { positional, flags };
}

const [command, ...rest] = process.argv.slice(2);
const { positional, flags } = parse(rest);
const data = read();

switch (command) {
  case 'list':
    cmdList(data, positional);
    break;
  case 'preview':
    await cmdPreview(data, positional, flags);
    break;
  case 'add':
    await cmdAdd(data, positional, flags);
    break;
  case 'move':
    cmdMove(data, positional);
    break;
  case 'remove':
    cmdRemove(data, positional);
    break;
  default:
    console.log(USAGE);
    process.exit(command ? 1 : 0);
}
