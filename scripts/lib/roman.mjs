/**
 * Devanagari → Roman, for reading aloud.
 *
 * This is not the transliterator in naming.mjs. That one feeds url slugs, where
 * आ becomes "aa" and only the letters survive. This one has to be *sung from* by
 * someone who cannot read the script, so it follows how the words sound:
 * सुखकर्ता दु:खहर्ता वार्ता विघ्नाची → "sukhakarta dukhaharta varta vighnachi".
 *
 * What that costs, and it is worth being plain about it: Marathi drops vowels
 * that are written and keeps vowels that are not, in ways no letter-by-letter
 * scheme predicts. लवथवती is sung "lavthavti", never "lavathavati". A machine
 * reading the letters cannot know which of those two it is looking at, so the
 * output here runs a little vowel-heavy in exactly those places. Measured
 * against the collection's own hand-written titles, it matches about half of
 * them outright and is readable in nearly all the rest. It is a starting draft
 * that a reader can correct, not an authority — which is why the result is
 * stored in the data rather than computed in the browser, so any line can be
 * fixed by hand and stay fixed.
 */

/** Consonants, each carrying the inherent 'a' that Devanagari leaves unwritten. */
const CONSONANTS = {
  क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'n',
  च: 'ch', छ: 'chh', ज: 'j', झ: 'jh', ञ: 'n',
  ट: 't', ठ: 'th', ड: 'd', ढ: 'dh', ण: 'n',
  त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n',
  प: 'p', फ: 'ph', ब: 'b', भ: 'bh', म: 'm',
  य: 'y', र: 'r', ल: 'l', व: 'v',
  श: 'sh', ष: 'sh', स: 's', ह: 'h',
  ळ: 'l', ऱ: 'r',
};

/** Nukta forms, spelled as the sound they borrow rather than the letter they sit on. */
const NUKTA_FORMS = {
  क: 'q', ख: 'kh', ग: 'g', ज: 'z', ड: 'd', ढ: 'dh', फ: 'f',
};

/** Independent vowels — a vowel opening a syllable. */
const VOWELS = {
  अ: 'a', आ: 'a', इ: 'i', ई: 'i', उ: 'u', ऊ: 'u',
  ऋ: 'ru', ॠ: 'ru',
  ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au',
  ऑ: 'o', ऍ: 'a',
};

/** The same vowels written as a mark on the consonant before them. */
const MATRAS = {
  'ा': 'a',  // ा
  'ि': 'i',  // ि
  'ी': 'i',  // ी
  'ु': 'u',  // ु
  'ू': 'u',  // ू
  'ृ': 'ru', // ृ
  'े': 'e',  // े
  'ै': 'ai', // ै
  'ो': 'o',  // ो
  'ौ': 'au', // ौ
  'ॉ': 'o',  // ॉ
  'ॅ': 'a',  // ॅ
};

const VIRAMA = '्';
const ANUSVARA = 'ं';
const CHANDRABINDU = 'ँ';
const VISARGA = 'ः';
const NUKTA = '़';

/** ं is an m before a lip consonant (संपत्ती → sampatti) and an n elsewhere. */
const LABIALS = new Set(['प', 'फ', 'ब', 'भ', 'म']);

/** Devanagari digits, so a verse number reads as one. */
const DIGITS = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
                 '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };

/**
 * ज्ञ is the one cluster whose Marathi sound its letters do not spell: ज + ञ
 * would come out "jn", but it is said "dny" — ज्ञान is "dnyan".
 */
const LIGATURES = [[`ज${VIRAMA}ञ`, 'dny']];

/**
 * Words the letters cannot spell.
 *
 * Marathi deletes vowels that are written, and no letter-by-letter scheme can
 * tell आरती ("aarti") from a word where the same र really is sounded. Rather
 * than guess — a wrongly deleted vowel is far worse to read than a spare one —
 * the handful of words common enough to be worth getting exactly right are
 * listed here. Add to it freely; it is consulted before anything else.
 */
const EXCEPTIONS = {
  आरती: 'aarti', आरत्या: 'aartya', आरत्यांचा: 'aartyancha',
  जयदेव: 'jaydev', गणपती: 'ganpati', गणपतीची: 'ganpatichi',
  मंगलमूर्ती: 'mangalmurti', मंगलमुर्ती: 'mangalmurti',
  लवथवती: 'lavthavti', शुभमंगल: 'shubhmangal',
};

/**
 * One word.
 *
 * The inherent 'a' is tracked rather than just appended, because the last one in
 * a word is silent — राम is "ram" — while a written matra never is: रामा stays
 * "rama". The exception is a word ending in a consonant cluster, where the
 * vowel comes back to make it sayable: शास्त्र is "shastra", not "shastr".
 */
function word(src) {
  if (EXCEPTIONS[src]) return EXCEPTIONS[src];
  /** @type {{ text: string, inherent: boolean }[]} */
  const out = [];
  const push = (text, inherent = false) => text && out.push({ text, inherent });
  /** Is the next letter the tail of a virama cluster? Drives the शास्त्र rule. */
  let afterVirama = false;
  /** Did the word's last inherent 'a' land on a cluster tail, which keeps it? */
  let keepFinal = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    // Matched in place rather than pre-substituted, so no sentinel character
    // has to survive the rest of the loop.
    const lig = LIGATURES.find(([from]) => src.startsWith(from, i));
    if (lig) {
      push(lig[1]);
      i += lig[0].length - 1;
      const next = src[i + 1];
      // A ligature is itself a cluster, so a final 'a' after it is kept.
      if (next === VIRAMA) { i += 1; afterVirama = true; }
      else if (MATRAS[next]) { push(MATRAS[next]); i += 1; afterVirama = false; }
      else { push('a', true); afterVirama = false; keepFinal = true; }
      continue;
    }

    if (ch === 'ॐ') { push('om'); afterVirama = false; continue; }

    if (CONSONANTS[ch]) {
      const tail = afterVirama;
      const nukta = src[i + 1] === NUKTA;
      // स्वामी is "swami" — a व carried inside a cluster is a w, though on its
      // own it stays a v (वार्ता is "varta").
      const base = ch === 'व' && tail ? 'w' : CONSONANTS[ch];
      push(nukta && NUKTA_FORMS[ch] ? NUKTA_FORMS[ch] : base);
      const skip = nukta ? 1 : 0;
      const next = src[i + 1 + skip];
      if (next === VIRAMA) {
        // विठ्ठल is "vitthal", not "viththal", and सच्चे is "sacche": when a
        // consonant is doubled, only the second copy keeps its aspiration.
        if (src[i + skip + 2] === ch) {
          const r = out.at(-1);
          if (r && r.text.length > 1 && r.text.endsWith('h')) r.text = r.text.slice(0, -1);
        }
        i += skip + 1;
        afterVirama = true;
      } else if (MATRAS[next]) {
        push(MATRAS[next]);
        i += skip + 1;
        afterVirama = false;
      } else {
        push('a', true);
        i += skip;
        afterVirama = false;
        keepFinal = tail;
      }
      continue;
    }

    if (VOWELS[ch]) {
      // आरती is "aarti", आता is "aata": an आ opening a word is written long,
      // while a medial ा stays short (वार्ता is "varta", not "vaarta").
      push(ch === 'आ' && i === 0 ? 'aa' : VOWELS[ch]);
      afterVirama = false;
      continue;
    }

    if (ch === ANUSVARA || ch === CHANDRABINDU) {
      // Look past the mark to the letter it assimilates to.
      push(LABIALS.has(src[i + 1]) ? 'm' : 'n');
      continue;
    }

    // Visarga, and the ASCII colon standing in for it in दु:खहर्ता, are silent.
    if (ch === VISARGA || ch === ':' || ch === NUKTA) continue;
    if (MATRAS[ch] || ch === VIRAMA) continue;
    if (DIGITS[ch]) { push(DIGITS[ch]); continue; }
    push(ch);
  }

  // Drop the unwritten final 'a', unless the word ends on a cluster that needs
  // it to be pronounceable.
  if (out.at(-1)?.inherent && !keepFinal) out.pop();
  return out.map((o) => o.text).join('');
}

/** Punctuation and notation pass through; only the words are converted. */
export const romanLine = (line) =>
  line.replace(/[ऀ-ॿ‌‍:]+/g, (m) => word(m));

/** A whole lyric, line by line, blank lines and all. */
export const romanText = (text) => text.split('\n').map(romanLine).join('\n');
