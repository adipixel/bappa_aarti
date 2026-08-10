import { useState } from 'react';
import type { Block } from '../data/songs';

/**
 * Renders a verse so it can be followed while singing.
 *
 * The blocks come pre-arranged from the data build: verses, the refrain, and a
 * copy of the refrain wherever the original only cued it with shorthand. Here
 * we only style them — the refrain gets an accent rule so the part that comes
 * back after every verse is findable at a glance, and a repeat is marked so it
 * reads as the chorus returning rather than new text.
 *
 * Those repeats are folded down to their opening words. A song with five verses
 * carries five identical copies of the chorus, which makes it look twice as
 * long as it is and buries the words that actually change. Folded, the page is
 * as long as the text you have to read; a tap brings the chorus back for anyone
 * who does not have it by heart. The first, canonical printing is never folded,
 * since that is where the words are learnt.
 *
 * Trailing danda notation (`।`, `॥ २ ॥`, `॥ धृ ॥`) is split off and dimmed. It
 * stays readable for anyone who uses it, but the eye lands on the words.
 */

/** Trailing notation: a danda, optionally a verse number or the ध्रु mark, optionally a closing danda. */
const TRAILING_NOTATION = /^(.*?)\s*([।॥](?:\s*(?:[०-९]+|ध्रु|धृ))?\s*[।॥]?)$/;

/** How many opening words a folded refrain shows. Enough to recognise it by. */
const FOLD_WORDS = 2;

function Line({ text }: { text: string }) {
  const match = text.match(TRAILING_NOTATION);
  return (
    <span className="song__line">
      {match ? match[1] : text}
      {match && <span className="song__mark"> {match[2]}</span>}
    </span>
  );
}

/** The refrain's opening words, with the danda marks left off. */
function opening(lines: string[]) {
  const words = (lines[0] ?? '')
    .split(/\s+/)
    .filter((w) => w && !/^[।॥]+$/.test(w))
    .slice(0, FOLD_WORDS)
    .join(' ')
    .replace(/[।॥]+$/, '')
    .trim();
  return words || (lines[0] ?? '');
}

export function Lyrics({ blocks, fontSize }: { blocks: Block[]; fontSize: number }) {
  // Folded by default, and per copy rather than all at once: expanding one
  // should not shuffle the page around somewhere the reader is not looking.
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  return (
    <div className="song__lyrics" style={{ fontSize }}>
      {blocks.map((block, i) => {
        const isRefrain = block.role === 'refrain';
        const className = [
          'song__stanza',
          isRefrain ? 'song__stanza--refrain' : '',
          block.repeat ? 'song__stanza--repeat' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const marker = (
          <span className="song__repeat" aria-hidden>
            ↻
          </span>
        );

        if (block.repeat) {
          const isOpen = open.has(i);
          return (
            <button
              key={i}
              type="button"
              className={`${className} song__stanza--fold`}
              aria-expanded={isOpen}
              onClick={() => toggle(i)}
            >
              {marker}
              <span className="visually-hidden">
                {isOpen ? 'धृपद · refrain, shown' : 'धृपद पुन्हा · refrain repeats, tap to show'}
              </span>
              {isOpen ? (
                block.lines.map((line, l) => <Line key={l} text={line} />)
              ) : (
                <span className="song__line">
                  {opening(block.lines)}
                  <span className="song__fold" aria-hidden>
                    …
                  </span>
                </span>
              )}
            </button>
          );
        }

        return (
          <p key={i} className={className}>
            {block.lines.map((line, l) => (
              <Line key={l} text={line} />
            ))}
          </p>
        );
      })}
    </div>
  );
}
