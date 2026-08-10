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
 * Trailing danda notation (`।`, `॥ २ ॥`, `॥ धृ ॥`) is split off and dimmed. It
 * stays readable for anyone who uses it, but the eye lands on the words.
 */

/** Trailing notation: a danda, optionally a verse number or the ध्रु mark, optionally a closing danda. */
const TRAILING_NOTATION = /^(.*?)\s*([।॥](?:\s*(?:[०-९]+|ध्रु|धृ))?\s*[।॥]?)$/;

function Line({ text }: { text: string }) {
  const match = text.match(TRAILING_NOTATION);
  return (
    <span className="song__line">
      {match ? match[1] : text}
      {match && <span className="song__mark"> {match[2]}</span>}
    </span>
  );
}

export function Lyrics({ blocks, fontSize }: { blocks: Block[]; fontSize: number }) {
  return (
    <div className="song__lyrics" style={{ fontSize }}>
      {blocks.map((block, i) => {
        const isRefrain = block.role === 'refrain';
        return (
          <p
            key={i}
            className={[
              'song__stanza',
              isRefrain ? 'song__stanza--refrain' : '',
              block.repeat ? 'song__stanza--repeat' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ margin: 0 }}
          >
            {block.repeat && (
              <span className="song__repeat" title="धृपद पुन्हा · refrain repeats">
                ↻<span className="visually-hidden"> refrain repeats</span>
              </span>
            )}
            {block.lines.map((line, l) => (
              <Line key={l} text={line} />
            ))}
          </p>
        );
      })}
    </div>
  );
}
