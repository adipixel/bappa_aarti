/**
 * Bringing verse numbers and the ध्रु mark up to the collection's convention.
 *
 * Most aartis here already follow it: the refrain closes `॥ धृ ॥`, and each
 * verse closes `॥ N ॥` counting from one. Enough of them were transcribed
 * without it, or with the first verse's number left sitting on the refrain,
 * that the collection reads inconsistently.
 *
 * This only ever rewrites the notation at the end of a line. The words are
 * never touched, and `wordsOf` exists so a caller can prove that.
 */
import { findRefrain } from './lyrics.mjs';

const DEVANAGARI_DIGITS = '०१२३४५६७८९';
const toDevanagari = (n) =>
  String(n)
    .split('')
    .map((d) => DEVANAGARI_DIGITS[Number(d)])
    .join('');

/** A line that is only shorthand for the refrain: "जयदेव…", "जय जी ...". */
const isCueLine = (line) => /^[^।॥]*[.…]+\s*$/.test(line.trim());

/** Everything a line says once the notation is stripped off. */
export const wordsOf = (text) =>
  text
    .replace(/[।॥]/g, ' ')
    .replace(/[०-९]/g, ' ')
    .replace(/ध्रु|धृ/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Drop any trailing danda, verse number or ध्रु, leaving the words. */
const bareEnd = (line) =>
  line.replace(/[\s।॥]*(?:(?:[०-९]+|ध्रु|धृ)[\s।॥]*)*$/, '').trimEnd();

const closeWith = (line, mark) => `${bareEnd(line)} ॥ ${mark} ॥`;

/**
 * Rewrite a song's lyrics so every verse carries its number and the refrain
 * carries the ध्रु mark.
 *
 * The refrain is located with findRefrain, which answers in source
 * coordinates. Asking buildBlocks instead does not work: where a refrain cues
 * its own opening, expandSelfCue rewrites it, and matching those lines against
 * the source misses the one it changed — which then reads as a verse and gets
 * a number stamped on it.
 */
export function retag(lyrics) {
  const stanzas = lyrics.split(/\n{2,}/).map((s) => s.split('\n'));
  const refrain = findRefrain(stanzas);

  // Classify every line first, so a verse can be recognised as the run of
  // lines it is rather than one line at a time.
  const kinds = stanzas.map((st, si) =>
    st.map((line, li) =>
      refrain && si === refrain.si && li >= refrain.from && li <= refrain.to
        ? 'refrain'
        : isCueLine(line)
          ? 'cue'
          : 'verse',
    ),
  );

  const lastRefrain = refrain ? [refrain.si, refrain.to] : null;

  // The last line of each verse run: a run ends at a stanza boundary or at any
  // line that is not verse text.
  const verseEnds = [];
  kinds.forEach((st, si) => {
    st.forEach((k, li) => {
      if (k !== 'verse') return;
      if (li + 1 === st.length || st[li + 1] !== 'verse') verseEnds.push([si, li]);
    });
  });

  const out = stanzas.map((st) => [...st]);
  const skipped = [];

  /*
   * Where shorthand trails a line — "... ॥ १ ॥ जयदेव जयदेव..." — the number
   * belongs in front of it, not after. Retag the part before the cue and put
   * the cue back on the end.
   *
   * A line that is nothing but shorthand is not a verse ending at all and is
   * left alone; it is reported so nothing goes quietly unfixed.
   */
  const TRAILING_SHORTHAND = /[।॥]\s*[^।॥]{2,45}?\s*[.…]+\s*$/;

  const retagLine = (si, li, mark, what) => {
    const line = out[si][li];
    if (/^[^।॥]*[.…]+\s*$/.test(line.trim())) {
      skipped.push({ line, wanted: mark, what });
      return;
    }
    const at = line.search(TRAILING_SHORTHAND);
    if (at !== -1) {
      out[si][li] = closeWith(line.slice(0, at + 1), mark) + line.slice(at + 1);
      return;
    }
    out[si][li] = closeWith(line, mark);
  };

  verseEnds.forEach(([si, li], i) => retagLine(si, li, toDevanagari(i + 1), 'verse'));
  if (lastRefrain) {
    // Keep whichever spelling the song already uses; ध्रु and धृ both appear
    // in the collection and neither is wrong.
    const existing = /ध्रु/.test(out[lastRefrain[0]].join(' ')) ? 'ध्रु' : 'धृ';
    retagLine(lastRefrain[0], lastRefrain[1], existing, 'refrain');
  }

  return { lyrics: out.map((st) => st.join('\n')).join('\n\n'), skipped };
}
