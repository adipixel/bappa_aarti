/**
 * The lyric normaliser and the refrain resolver.
 *
 * Extracted from build-data.mjs so that the one-off legacy import and the
 * ongoing `songs.mjs add` path share a single implementation. Two copies of the
 * refrain algorithm would drift, and a song added later would then be laid
 * out differently from the forty-three imported at the start.
 *
 * Everything here is pure: text in, text out. Nothing reads argv or the disk.
 */

export const romanize = (id) =>
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
export function formatLine(line) {
  return (
    line
      // Lyrics get typed on keyboards that have no danda, so `|`, `||` and a
      // doubled letter l all stand in for । and ॥. No lyric in the collection
      // contains a Latin letter, and the word boundaries keep the `ll` rule
      // off anything that is actually a word.
      .replace(/\bll\b/gi, '॥')
      .replace(/\|\|/g, '॥')
      .replace(/\|/g, '।')
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
export const cleanLyrics = (raw) =>
  (raw ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => formatLine(line.replace(/[ \t]+/g, ' ').trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

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
const wholeLineCue = (line) => {
  if (/[।॥]/.test(line)) return null;
  const m = line.match(/^(.{2,45}?)\s*[.…]+$/);
  return m ? m[1].trim() : null;
};

/** Shorthand trailing after the verse marker: "... ॥ १ ॥ जयदेव जयदेव...". */
const SUFFIX_CUE = /([।॥])\s*([^।॥]{2,45}?)\s*[.…]+\s*$/;

/** A `॥ phrase ॥` group inside a line that is neither a verse number nor the ध्रु mark. */
const inlineCue = (line) => {
  for (const m of line.matchAll(/॥\s*([^॥।]{2,30}?)\s*॥/g)) {
    const text = m[1].trim();
    if (/^[०-९]+$/.test(text) || DHRU.test(text)) continue;
    return { text, token: m[0] };
  }
  return null;
};

/**
 * The three shapes a refrain cue takes in this collection.
 *  whole  — the line is only shorthand, so the refrain replaces it
 *  suffix — shorthand tacked on after the verse number; strip it, keep the verse
 *  inline — "॥ जय देव ॥" sitting before the verse number
 */
export const cueOf = (line) => {
  const whole = wholeLineCue(line);
  if (whole) return { text: whole, kind: 'whole' };
  const suffix = line.match(SUFFIX_CUE);
  if (suffix) return { text: suffix[2].trim(), kind: 'suffix' };
  const inline = inlineCue(line);
  return inline ? { text: inline.text, kind: 'inline', token: inline.token } : null;
};

/** Strip a cue from a line, keeping the verse text and its number. */
const stripCue = (line, cue) =>
  (cue.kind === 'suffix' ? line.replace(SUFFIX_CUE, '$1') : line.replace(cue.token, '॥'))
    .replace(/ {2,}/g, ' ')
    .trim();

/**
 * The dhruvapada of a Marathi aarti conventionally opens "जयदेव जयदेव जय …".
 * Where a song carries no cue to go on, that couplet is the refrain — more
 * reliably than the ध्रु mark, which in this collection sometimes sits at the
 * end of the first verse instead.
 */
const CLASSIC_REFRAIN = /^(जयदेव|जय देव|जय देवी|जय जी)\s/;

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
    if (i > start && wholeLineCue(line)) return i - 1;
    if (DHRU.test(line) || ENDS_WITH_VERSE_NUMBER.test(line)) return i;
    const inline = inlineCue(line);
    if (i > start && inline && key.startsWith(bare(inline.text))) return i;
  }
  return Math.min(start + 3, stanza.length - 1);
}

/**
 * Locate the song's refrain: the line a cue points back to, and its extent.
 *
 * Returned in source coordinates — stanza index, first and last line — which is
 * what a caller needs to edit the lyrics themselves. The blocks buildBlocks
 * produces are not a safe guide: expandSelfCue may have rewritten the refrain,
 * so its lines no longer appear verbatim in the source.
 */
export function findRefrain(stanzas) {
  const flat = [];
  stanzas.forEach((st, si) => st.forEach((line, li) => flat.push({ line, si, li })));

  const votes = new Map();
  for (const { line, si, li } of flat) {
    const cue = cueOf(line);
    if (!cue) continue;
    const key = bare(cue.text);
    if (!key) continue;

    const anchors = flat.filter(
      (f) => !(f.si === si && f.li === li) && bare(f.line).startsWith(key) && bare(f.line).length > key.length,
    );
    if (!anchors.length) continue; // Unresolvable shorthand — leave the line alone.

    // A short cue is fine — "येई" points at "येई हो विठ्ठले …" perfectly well —
    // as long as it points somewhere definite. What makes shorthand unusable is
    // ambiguity, not brevity, so test for that directly rather than imposing a
    // minimum length.
    //
    // Every candidate must be the same line, allowing for a suffix: the last
    // verse of जय जय दिनदयाळा closes by repeating the refrain's opening with a
    // verse number after it, which is an echo of the refrain rather than a
    // rival meaning. Two genuinely different lines sharing the opening would
    // make the shorthand ambiguous, and it is left alone.
    const shortest = anchors.reduce((a, f) => (bare(f.line).length < bare(a.line).length ? f : a));
    if (!anchors.every((f) => bare(f.line).startsWith(bare(shortest.line)))) continue;

    // The refrain is printed once and cued thereafter, so the first occurrence
    // in the song is the canonical one.
    const anchor = anchors[0];
    const id = `${anchor.si}:${anchor.li}`;
    votes.set(id, (votes.get(id) ?? 0) + 1);
  }

  if (votes.size) {
    const [best] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
    const [si, li] = best.split(':').map(Number);
    return { si, from: li, to: refrainEnd(stanzas[si], li) };
  }

  // No cues. Next best evidence is the conventional "जयदेव जयदेव जय …" opening.
  for (let si = 0; si < stanzas.length; si++) {
    for (let li = 0; li < stanzas[si].length; li++) {
      const line = stanzas[si][li];
      if (CLASSIC_REFRAIN.test(line) && !cueOf(line) && bare(line).length > 12) {
        return { si, from: li, to: refrainEnd(stanzas[si], li) };
      }
    }
  }

  // Then the ध्रु mark, taking the run of lines that ends there rather than the
  // whole stanza it happens to sit in.
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

  // Last resort, structural: the opening stanza is the mukhda when it is short,
  // there are verses after it, and either the verses are numbered while it is
  // not ("शेवट गोड करी", "आरती ज्ञानराजा") or it trails off in an ellipsis
  // ("विठ्ठल विठ्ठल विठ्ठला").
  const opener = stanzas[0];
  if (opener && stanzas.length >= 3 && opener.length <= 4) {
    const numbered = stanzas.filter((st) => ENDS_WITH_VERSE_NUMBER.test(st.at(-1) ?? '')).length;
    const unnumberedOpener = !opener.some((l) => ENDS_WITH_VERSE_NUMBER.test(l));
    const trailsOff = /[.…]+\s*$/.test(opener.at(-1) ?? '');
    if (unnumberedOpener && (numbered >= 2 || trailsOff)) {
      return { si: 0, from: 0, to: opener.length - 1 };
    }
  }
  return null;
}

/**
 * A refrain that closes by cueing its own opening sings that opening again.
 *
 * जय जय दिनदयाळा is printed as two lines, the second ending "॥ जय जय ॥" — which
 * is not a terminator but shorthand for the first line coming back round:
 *
 *   जय जय दिनदयाळा सत्यनारायण देवा
 *   पंचारती ओवाळू श्रीपती तुज भक्तिभावा ॥ जय जय ॥
 *
 * becomes
 *
 *   जय जय दिनदयाळा सत्यनारायण देवा
 *   पंचारती ओवाळू श्रीपती तुज भक्तिभावा
 *   जय जय दिनदयाळा सत्यनारायण देवा ॥
 *
 * The danda that separated the line from its shorthand goes with it, since the
 * expansion now stands on its own line.
 */
function expandSelfCue(lines) {
  if (lines.length < 2) return lines;

  const last = lines.at(-1);
  const cue = cueOf(last);
  if (!cue) return lines;

  const key = bare(cue.text);
  const head = bare(lines[0]);
  // Shorthand for this refrain's own opening: opens it, without being all of it.
  if (!key || key === head || !head.startsWith(key)) return lines;

  const token = cue.kind === 'inline' ? cue.token : last.match(SUFFIX_CUE)?.[0];
  if (!token) return lines;

  const at = last.indexOf(token);
  const tail = last.slice(at + token.length);

  // Anything after the shorthand is notation for the dhruvapada as a whole —
  // "॥ जय. ॥ धृ ॥" cues the opening back and then marks the chorus as the
  // dhruva. Stripping only trailing dandas would strand the ध्रु mid-line, so
  // when the tail is notation and nothing else, it moves to the line that now
  // closes the refrain. A tail carrying actual words is left where it is.
  const tailIsNotation = /^[\s।॥]*(?:ध्रु|धृ)?[\s।॥]*$/.test(tail);
  const dhruva = tailIsNotation ? tail.match(DHRU)?.[0] : undefined;

  const trimmed = (tailIsNotation ? last.slice(0, at) : last.replace(token, ''))
    .replace(/[\s।॥]+$/, '')
    .replace(/ {2,}/g, ' ')
    .trim();
  if (!trimmed) return lines;

  const close = dhruva
    ? `${lines[0].replace(/[\s।॥]+$/, '')} ॥ ${dhruva} ॥`
    : /[।॥]\s*$/.test(lines[0])
      ? lines[0]
      : `${lines[0]} ॥`;
  return [...lines.slice(0, -1), trimmed, close];
}

/**
 * Turns lyrics into the blocks the app renders: verses, the refrain, and a
 * copy of the refrain wherever it was only cued.
 */
export function buildBlocks(lyrics) {
  const stanzas = lyrics.split(/\n{2,}/).filter(Boolean).map((s) => s.split('\n'));
  const refrain = findRefrain(stanzas);
  if (!refrain) return stanzas.map((lines) => ({ role: 'verse', lines }));

  const refrainLines = expandSelfCue(stanzas[refrain.si].slice(refrain.from, refrain.to + 1));
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

      // Shorthand for this song's refrain: the cue's letters open it. Length
      // alone says nothing — "येई" is as good a pointer to "येई हो विठ्ठले …"
      // as a longer one would be.
      //
      // Usually the cue stops short of the refrain's opening line, but it need
      // not: आरती रामजी तुम्हारी cues its chorus with that whole line, spelled
      // out and trailing off. A line of nothing but shorthand cannot be the
      // refrain printing itself — the refrain's own lines are consumed by the
      // branch above before ever reaching here — so an exact match is allowed
      // when the whole line is the cue, and only then.
      const cue = cueOf(line);
      const cueKey = cue ? bare(cue.text) : '';
      const isCue =
        Boolean(cueKey) &&
        refrainKey.startsWith(cueKey) &&
        (cueKey !== refrainKey || cue.kind === 'whole');

      if (isCue && cue.kind === 'whole') {
        // The whole line is shorthand — replace it with the refrain.
        push('verse', verse);
        verse = [];
        push('refrain', refrainLines, true);
        continue;
      }
      if (isCue) {
        // Keep the verse text and its number, drop the shorthand, and bring the
        // refrain back after the stanza.
        verse.push(stripCue(line, cue));
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
