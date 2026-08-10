/**
 * Naming: a Devanagari → Latin transliterator, and the guesses that let
 * `songs.mjs add` work from a lyrics file alone.
 *
 * Both are suggestions, not answers. Measured against the songs already in the
 * collection, the title guess is right about half the time and the id about a
 * third — Marathi drops internal vowels in ways no letter-by-letter scheme
 * predicts (लवथवती is "lavthavti", not "lavathavati"), and ten of the titles
 * were curated by hand rather than taken from the first line at all. So the CLI
 * prints what it picked and takes --title / --id to overrule it.
 */

/** Consonants, carrying the inherent 'a' that Devanagari leaves unwritten. */
const CONSONANTS = {
  क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'ng',
  च: 'ch', छ: 'chh', ज: 'j', झ: 'jh', ञ: 'n',
  ट: 't', ठ: 'th', ड: 'd', ढ: 'dh', ण: 'n',
  त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n',
  प: 'p', फ: 'ph', ब: 'b', भ: 'bh', म: 'm',
  य: 'y', र: 'r', ल: 'l', व: 'v',
  श: 'sh', ष: 'sh', स: 's', ह: 'h',
  ळ: 'l', ऱ: 'r',
  // Nukta forms, spelled as the sound they borrow.
  क़: 'q', ख़: 'kh', ग़: 'g', ज़: 'z', ड़: 'd', ढ़: 'dh', फ़: 'f',
};

/** Independent vowels — a vowel starting a syllable. */
const VOWELS = {
  अ: 'a', आ: 'aa', इ: 'i', ई: 'i', उ: 'u', ऊ: 'u',
  ऋ: 'ru', ॠ: 'ru', ऌ: 'l',
  ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au',
  ऑ: 'o', ऍ: 'a',
};

/** Matras — the same vowels written as a mark on the preceding consonant. */
const MATRAS = {
  'ा': 'a', // ा
  'ि': 'i', // ि
  'ी': 'i', // ी
  'ु': 'u', // ु
  'ू': 'u', // ू
  'ृ': 'ru', // ृ
  'े': 'e', // े
  'ै': 'ai', // ै
  'ो': 'o', // ो
  'ौ': 'au', // ौ
  'ॉ': 'o', // ॉ
  'ॅ': 'a', // ॅ
};

const VIRAMA = '्'; // ् — silences the inherent 'a'
const ANUSVARA = 'ं'; // ं
const CHANDRABINDU = 'ँ'; // ँ
const VISARGA = 'ः'; // ः
const NUKTA = '़'; // ़

/**
 * One Devanagari word to Latin letters.
 *
 * The inherent 'a' is tracked rather than just concatenated, because a word's
 * final one is not pronounced — राम is "ram", not "rama" — while a written
 * matra is: रामा stays "rama".
 */
function transliterateWord(word) {
  /** @type {{ text: string, inherent: boolean }[]} */
  const out = [];
  const push = (text, inherent = false) => text && out.push({ text, inherent });

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];

    if (ch === 'ॐ') {
      push('om');
      continue;
    }
    if (CONSONANTS[ch]) {
      push(CONSONANTS[ch]);
      const next = word[i + 1] === NUKTA ? word[i + 2] : word[i + 1];
      const skip = word[i + 1] === NUKTA ? 1 : 0;
      if (next === VIRAMA) {
        i += skip + 1; // cluster: no vowel between the consonants
      } else if (MATRAS[next]) {
        push(MATRAS[next]);
        i += skip + 1;
      } else {
        push('a', true); // unwritten, and droppable at the end of a word
        i += skip;
      }
      continue;
    }
    if (VOWELS[ch]) {
      push(VOWELS[ch]);
      continue;
    }
    if (ch === ANUSVARA || ch === CHANDRABINDU) {
      push('n');
      continue;
    }
    // Visarga, and the ASCII colon standing in for it (दु:खहर्ता), are silent.
    if (ch === VISARGA || ch === ':' || ch === NUKTA) continue;
    // A matra with no consonant before it, and anything else, is skipped.
    if (MATRAS[ch] || ch === VIRAMA) continue;
    if (/[a-z0-9]/i.test(ch)) push(ch.toLowerCase());
  }

  if (out.at(-1)?.inherent) out.pop();
  return out.map((o) => o.text).join('');
}

/** Devanagari text to Latin, word by word. */
export const transliterate = (text) =>
  text
    .split(/\s+/)
    .map(transliterateWord)
    .filter(Boolean)
    .join(' ');

/** A url-safe slug: transliterate first, then reduce to letters and hyphens. */
export const slug = (text) =>
  transliterate(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Notation, and the bracketed asides a few titles carry, are not words. */
const stripNotation = (line) =>
  line
    .replace(/[।॥]/g, ' ')
    .replace(/[०-९]/g, ' ')
    .replace(/[(),.…"'—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * A song's title is conventionally how its first line opens.
 *
 * Two or three words, which is what 33 of the 43 titles in the collection are;
 * growing to twelve characters and stopping at three words reproduces the most
 * of them. The remaining ten are hand-picked ("अष्टविनायक" for a song opening
 * "मोरया मोरया"), so treat this as a first draft of the name.
 */
export function suggestTitle(lyrics) {
  const first = stripNotation(lyrics.split('\n').find((l) => l.trim()) ?? '');
  if (!first) return '';
  const picked = [];
  for (const word of first.split(' ')) {
    picked.push(word);
    if (picked.join(' ').length >= 12 || picked.length >= 3) break;
  }
  return picked.join(' ');
}

/** The id follows the title, so a hand-picked title gives a matching slug. */
export const suggestId = (title) => slug(title);
