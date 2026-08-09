/**
 * Renders a verse so it can be followed while singing.
 *
 * Two things happen here beyond printing the text:
 *
 * 1. The danda notation at the end of a line (`।`, `॥ २ ॥`, `॥ धृ ॥`) is split
 *    off and dimmed. It stays readable for anyone who uses it, but the eye
 *    lands on the words.
 * 2. The refrain — the stanza carrying the ध्रु/धृ mark — is flagged, so the
 *    part that comes back after every verse is findable at a glance.
 */

/** Trailing notation: a danda, optionally a verse number or the ध्रु mark, optionally a closing danda. */
const TRAILING_NOTATION = /^(.*?)\s*([।॥](?:\s*(?:[०-९]+|ध्रु|धृ))?\s*[।॥]?)$/;

const REFRAIN = /ध्रु|धृ/;

export function Lyrics({ text, fontSize }: { text: string; fontSize: number }) {
  const stanzas = text.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="song__lyrics" style={{ fontSize }}>
      {stanzas.map((stanza, s) => (
        <p
          key={s}
          className={`song__stanza${REFRAIN.test(stanza) ? ' song__stanza--refrain' : ''}`}
          style={{ margin: 0 }}
        >
          {stanza.split('\n').map((line, l) => {
            const match = line.match(TRAILING_NOTATION);
            return (
              <span className="song__line" key={l}>
                {match ? match[1] : line}
                {match && <span className="song__mark"> {match[2]}</span>}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
