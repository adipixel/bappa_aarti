/**
 * The three playlist marks, drawn rather than iconified.
 *
 * A stroked icon has one weight and one colour to work with, and at this size
 * neither a dholak nor a pair of cymbals survives that: the drum comes out a
 * tin can, the cymbals come out binoculars. These are small pictures instead —
 * filled forms, a light face and a dark side, and the shading doing the work
 * the outline could not.
 *
 * Colours are the app's own tokens, so the marks follow the theme, with black
 * at low alpha for shade — it darkens whatever it is over and needs no second
 * palette for the light theme.
 *
 * Drawn on 48 rather than the 24 the interface icons use, purely for room to
 * put detail in.
 */

const SHADE = 'rgba(0, 0, 0, 0.22)';
const DEEP = 'rgba(0, 0, 0, 0.34)';

interface ArtProps {
  size?: number;
}

const canvas = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 48 48',
  fill: 'none',
  'aria-hidden': true,
});

/**
 * Dholak, seen from the side and a little above: the shell bows out at the
 * waist, the near head is a full hoop, and the rope zigzags between the rims
 * the way it is actually laced.
 */
export function DholakArt({ size = 44 }: ArtProps) {
  return (
    <svg {...canvas(size)}>
      {/* Shell. Straight-sided it would be a tin can; the bow is the drum. */}
      <path
        d="M11 17.5c8-4.6 18-4.6 26 0v13c-8 4.6-18 4.6-26 0z"
        fill="var(--accent)"
      />
      {/* The underside turns away from the light. */}
      <path d="M11 26.5c8 3.4 18 3.4 26 0v4c-8 4.6-18 4.6-26 0z" fill={SHADE} />

      {/* Rope, laced rim to rim. */}
      <path
        d="M13.5 18.4l5.5 11.6M24.5 18l-5.5 12M24.5 18l5.5 11.6M35 18.6l-5 11.4"
        stroke={DEEP}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Far head, mostly hidden behind the shell. */}
      <ellipse cx="37" cy="24" rx="3.4" ry="8" fill="var(--accent)" />
      <ellipse cx="37" cy="24" rx="3.4" ry="8" fill={SHADE} />

      {/* Near head, catching the light. */}
      <ellipse cx="11" cy="24" rx="3.6" ry="8.4" fill="var(--accent-strong)" />
      <ellipse cx="11" cy="24" rx="1.9" ry="5.4" fill={SHADE} />
    </svg>
  );
}

/**
 * Taal — two cymbals caught mid-clash, seen from above so each disc reads as a
 * foreshortened ellipse. The raised boss in the middle is where the cord is
 * knotted, and it is the detail that makes them cymbals rather than coins.
 */
export function TaalArt({ size = 44 }: ArtProps) {
  return (
    <svg {...canvas(size)}>
      <g transform="rotate(-20 24 24)">
        {/* Lower disc, further from the light. */}
        <ellipse cx="29" cy="31" rx="13.5" ry="7.6" fill="var(--accent)" />
        <ellipse cx="29" cy="31" rx="13.5" ry="7.6" fill={SHADE} />
        <ellipse cx="29" cy="31" rx="4.6" ry="2.6" fill={DEEP} />

        {/* Upper disc. */}
        <ellipse cx="19" cy="18" rx="13.5" ry="7.6" fill="var(--accent-strong)" />
        <ellipse cx="19" cy="18" rx="4.6" ry="2.6" fill={SHADE} />
        {/* The cord, through the boss. */}
        <path
          d="M19 15.6c0-2.4 3-3 3-5.4"
          stroke={DEEP}
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

/**
 * Añjali — palms together.
 *
 * Drawn with the fingers actually separated, because the smooth silhouette does
 * not work: as one shape it is a flame, widen it and it is a leaf, and put the
 * wrists below it and the leaf grows a trunk. Fingers of stepped length,
 * longest beside the join and shortest outside, is the one arrangement nothing
 * in nature shares. The thumbs cross in front of the palms.
 */
export function NamasteArt({ size = 44 }: ArtProps) {
  // Distance out from the join, finger width, and how far down the tip starts.
  const fingers = [
    { off: 0.4, w: 2.9, tip: 7.4 },
    { off: 3.5, w: 2.8, tip: 8.8 },
    { off: 6.5, w: 2.7, tip: 11.0 },
    { off: 9.3, w: 2.4, tip: 14.2 },
  ];

  const hand = (dir: 1 | -1, palm: string) => (
    <g>
      {fingers.map(({ off, w, tip }, i) => (
        <rect
          key={i}
          x={dir === 1 ? 24 - off - w : 24 + off}
          y={tip}
          width={w}
          height={26 - tip}
          rx={w / 2}
          fill={palm}
        />
      ))}
      {/* Palm and wrist as one piece, so the hand does not sit on a stand. */}
      <path
        d={
          dir === 1
            ? 'M13.1 21.5h10.6V34a3 3 0 0 1-.9 2.1l-1.4 5.2a2.4 2.4 0 0 1-2.3 1.7h-.6a2.4 2.4 0 0 1-2.3-1.8l-1.3-5c-1.2-1.3-1.8-3-1.8-5z'
            : 'M34.9 21.5H24.3V34a3 3 0 0 0 .9 2.1l1.4 5.2a2.4 2.4 0 0 0 2.3 1.7h.6a2.4 2.4 0 0 0 2.3-1.8l1.3-5c1.2-1.3 1.8-3 1.8-5z'
        }
        fill={palm}
      />
    </g>
  );

  return (
    <svg {...canvas(48)} width={size} height={size}>
      {/* Far hand first. The shade is the same shapes painted again in
          translucent black, so it darkens the hand and nothing around it —
          a plain rectangle over the top leaves a dark box on the card. */}
      {hand(-1, 'var(--accent)')}
      {hand(-1, SHADE)}
      {/* Near hand, catching the light. */}
      {hand(1, 'var(--accent-strong)')}
      {/* Thumbs, crossed in front. */}
      <path
        d="M14.6 26.4c-2.4 1.4-3.7 3.6-3.6 6 .1 1.7 1 2.7 2.3 2.7 1 0 1.9-.6 2.6-1.7z"
        fill="var(--accent-strong)"
      />
      <path
        d="M14.6 26.4c-2.4 1.4-3.7 3.6-3.6 6 .1 1.7 1 2.7 2.3 2.7 1 0 1.9-.6 2.6-1.7z"
        fill={SHADE}
      />
      <path
        d="M33.4 26.4c2.4 1.4 3.7 3.6 3.6 6-.1 1.7-1 2.7-2.3 2.7-1 0-1.9-.6-2.6-1.7z"
        fill="var(--accent)"
      />
      <path
        d="M33.4 26.4c2.4 1.4 3.7 3.6 3.6 6-.1 1.7-1 2.7-2.3 2.7-1 0-1.9-.6-2.6-1.7z"
        fill={DEEP}
      />
    </svg>
  );
}

/**
 * Vina — the one-stringed drone a warkari carries to Pandharpur, which is what
 * this bhajan is about. The drum, the cymbals, the joined palms and the garland
 * are all spoken for, and this shares a silhouette with none of them: a round
 * gourd with a long neck leaning out of it.
 *
 * Drawn upright and then tilted, the way it is actually carried over a
 * shoulder, which also keeps the neck off the corner of the badge.
 */
export function VinaArt({ size = 44 }: ArtProps) {
  return (
    <svg {...canvas(size)}>
      <g transform="rotate(-24 24 24)">
        {/* Neck, running up out of the gourd. */}
        <rect x="21.6" y="7" width="4.8" height="26" rx="2.4" fill="var(--accent)" />
        <rect x="24" y="7" width="2.4" height="26" fill={SHADE} />

        {/* Pegbox, and the two pegs turned out either side of it. */}
        <rect x="20.2" y="3.4" width="7.6" height="7" rx="2.2" fill="var(--accent-strong)" />
        <rect x="20.2" y="6.6" width="7.6" height="3.8" fill={SHADE} />
        <rect x="16.6" y="4.6" width="4.4" height="1.9" rx="0.95" fill={DEEP} />
        <rect x="27" y="7.6" width="4.4" height="1.9" rx="0.95" fill={DEEP} />

        {/* The gourd. Light on the near side, turning away on the far one. */}
        <ellipse cx="24" cy="35" rx="10" ry="9.4" fill="var(--accent-strong)" />
        <path d="M24 25.6a10 9.4 0 0 1 0 18.8 10 9.4 0 0 0 0-18.8z" fill={SHADE} />
        <path d="M27 26a10 9.4 0 0 1 0 18 8 9 0 0 0 0-18z" fill={SHADE} />

        {/* Sound hole, and the bridge the strings cross. */}
        <ellipse cx="21.4" cy="33.4" rx="3.2" ry="3" fill={DEEP} />
        <rect x="19.4" y="39.4" width="9.2" height="1.8" rx="0.9" fill={DEEP} />

        {/* Strings, peg to bridge. */}
        <path
          d="M22.8 9.5v30.2M25.2 9.5v30.2"
          stroke={DEEP}
          strokeWidth="0.85"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * Maal — the flower garland of a मंगल occasion, which is what the
 * mangalashtake are sung at. A strung arc rather than a single bloom: the
 * curve is what separates it at a glance from the discs of the taal.
 *
 * The blooms alternate light and shaded around the string so it reads as
 * depth rather than a row of identical dots.
 */
export function GarlandArt({ size = 44 }: ArtProps) {
  // Points along the hanging curve, computed once rather than eyeballed.
  const blooms = [
    [9, 13],
    [12.8, 20.9],
    [16.5, 26.5],
    [20.3, 29.9],
    [24, 31],
    [27.8, 29.9],
    [31.5, 26.5],
    [35.3, 20.9],
    [39, 13],
  ] as const;

  return (
    <svg {...canvas(size)}>
      {/* The string the blooms are threaded on. */}
      <path
        d="M9 13Q24 49 39 13"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {blooms.map(([cx, cy], i) => (
        <g key={i}>
          <circle
            cx={cx}
            cy={cy}
            r={i === 4 ? 3.6 : 3.2}
            fill={i % 2 ? 'var(--accent)' : 'var(--accent-strong)'}
          />
          {i % 2 === 1 && <circle cx={cx} cy={cy} r={i === 4 ? 3.6 : 3.2} fill={SHADE} />}
          <circle cx={cx} cy={cy} r={1.1} fill={DEEP} />
        </g>
      ))}
      {/* Two leaves, where the garland is tied. */}
      <path d="M9 12.6c-2.6-1.4-4.2-3.4-4.4-5.8 2.6.4 4.5 1.9 5.6 4.4z" fill="var(--accent)" />
      <path d="M39 12.6c2.6-1.4 4.2-3.4 4.4-5.8-2.6.4-4.5 1.9-5.6 4.4z" fill="var(--accent)" />
      <path d="M39 12.6c2.6-1.4 4.2-3.4 4.4-5.8-2.6.4-4.5 1.9-5.6 4.4z" fill={SHADE} />
    </svg>
  );
}
