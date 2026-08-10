/**
 * Generates public/favicon.svg — the app mark.
 *
 * The mark is one shape at seven scales: a quarter disc, whose radius equals
 * the side of the square cell holding it. The cells are a golden subdivision,
 * which is what makes them tile with nothing left over:
 *
 *     1/φ + 1/φ² = 1   exactly
 *
 * So the big lobe's square splits into piece2 (1/φ) beside a column of
 * piece3 (1/φ²) and smallbump (1/φ³), with no remainder — and the gaps between
 * pieces come from insetting every cell by the same amount, not from slack in
 * the layout. That is what keeps the spacing even everywhere.
 *
 * Layout, in units of R (the big lobe's cell):
 *
 *     ┌───────┬───────────────┐
 *     │ petal │               │   petals: two R/2 cells stacked,
 *     ├───────┤   big lobe    │   so the pair is exactly as tall
 *     │ petal │      (R)      │   as the big lobe
 *     ├───┬───┼───────────────┤
 *     │sml│   │               │   sml = R/φ³   piece3 = R/φ²
 *     ├───┘p3 │    piece2     │   piece2 = R/φ
 *     │       │     (R/φ)     │
 *     └───────┴───────────────┘
 *
 * Colours are the app's own tokens, so the icon and the UI share a palette:
 * the background is the --accent-strong → --accent gradient used on buttons,
 * and the mark is --accent-contrast, the token meaning "sits on top of accent".
 *
 * Run: node scripts/build-icon.mjs
 */
import { writeFileSync } from 'node:fs';

const PHI = (1 + Math.sqrt(5)) / 2;

const ACCENT_STRONG = '#FFC247';
const ACCENT = '#FF9D3C';
const ACCENT_CONTRAST = '#2A1508';

const CANVAS = 512;
const PADDING = 58;
/** Gap between pieces, as a fraction of the mark's height — measured off the reference. */
const GAP_RATIO = 0.0123;

/** Nominal cell size of the big lobe. Everything else is derived from it. */
const R = 1000;
const HALF = R / 2;
const P2 = R / PHI; // piece2
const P3 = R / PHI ** 2; // piece3
const SM = R / PHI ** 3; // smallbump

const markW = HALF + R;
const markH = R + P2;
const gap = markH * GAP_RATIO;

/**
 * A cell is a square with the quarter disc's right-angle corner at one of its
 * corners; the arc bulges to the opposite corner. Insetting the square by half
 * a gap on every side is what separates neighbours by a full gap.
 */
const cells = [
  { name: 'petalA', x: 0, y: 0, size: HALF, corner: 'tr' },
  { name: 'petalB', x: 0, y: HALF, size: HALF, corner: 'br' },
  { name: 'bigLobe', x: HALF, y: 0, size: R, corner: 'bl' },
  { name: 'smallbump', x: HALF, y: R, size: SM, corner: 'br' },
  { name: 'piece3', x: HALF, y: R + SM, size: P3, corner: 'tr' },
  { name: 'piece2', x: HALF + P3, y: R, size: P2, corner: 'tl' },
];

/**
 * The eye, cut back out of the big lobe. It is a detail rather than part of the
 * tiling, so its placement is taken from the reference: the fractions below are
 * its measured bounding box, which for a quarter disc is its radius square.
 */
const notch = { x: HALF + 0.445 * R, y: 0.2568 * markH, size: 0.1125 * R, corner: 'bl' };

const scale = (CANVAS - 2 * PADDING) / Math.max(markW, markH);
const offX = (CANVAS - markW * scale) / 2;
const offY = (CANVAS - markH * scale) / 2;
const toX = (x) => offX + x * scale;
const toY = (y) => offY + y * scale;
const n = (v) => Number(v.toFixed(2));

/**
 * The two circles of a given radius through A and B. Which one an SVG arc uses
 * is set by the sweep flag; this mapping was confirmed by rendering both and
 * reading the result, rather than derived on paper — the y-down coordinate
 * system makes it easy to get backwards.
 */
function arcCentres(a, b, r) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy);
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const h = Math.sqrt(Math.max(r * r - (d / 2) ** 2, 0));
  const ux = -dy / d;
  const uy = dx / d;
  return {
    1: [mx + ux * h, my + uy * h],
    0: [mx - ux * h, my - uy * h],
  };
}

/** Quarter disc filling `cell`, inset so neighbours end up a full gap apart. */
function quarterDisc(cell, inset) {
  const half = inset ? gap / 2 : 0;
  const x = cell.x + half;
  const y = cell.y + half;
  const size = cell.size - (inset ? gap : 0);

  // The right-angle corner, and the unit directions the two flat edges run in.
  const [cx, cy] = {
    tl: [x, y],
    tr: [x + size, y],
    bl: [x, y + size],
    br: [x + size, y + size],
  }[cell.corner];
  const sx = cell.corner.endsWith('l') ? 1 : -1;
  const sy = cell.corner.startsWith('t') ? 1 : -1;

  const corner = [toX(cx), toY(cy)];
  const alongX = [toX(cx + sx * size), toY(cy)];
  const alongY = [toX(cx), toY(cy + sy * size)];
  const r = size * scale;

  // Pick the sweep whose arc is centred on the corner — that is the one that
  // bulges away from it, into the far corner of the cell.
  const centres = arcCentres(alongX, alongY, r);
  const dist = (p) => Math.hypot(p[0] - corner[0], p[1] - corner[1]);
  const sweep = dist(centres[1]) < dist(centres[0]) ? 1 : 0;

  return (
    `M${n(corner[0])},${n(corner[1])} L${n(alongX[0])},${n(alongX[1])} ` +
    `A${n(r)},${n(r)} 0 0,${sweep} ${n(alongY[0])},${n(alongY[1])} Z`
  );
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">
  <defs>
    <linearGradient id="ba-bg" x1="0" y1="0" x2="${CANVAS}" y2="${CANVAS}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${ACCENT_STRONG}"/>
      <stop offset="100%" stop-color="${ACCENT}"/>
    </linearGradient>
  </defs>
  <rect width="${CANVAS}" height="${CANVAS}" rx="112" fill="url(#ba-bg)"/>
  <g fill="${ACCENT_CONTRAST}">
${cells.map((c) => `    <path d="${quarterDisc(c, true)}"/>`).join('\n')}
  </g>
  <path d="${quarterDisc(notch, false)}" fill="url(#ba-bg)"/>
</svg>
`;

writeFileSync(new URL('../public/favicon.svg', import.meta.url), svg);
console.log(svg);
console.log(`gap ${gap.toFixed(1)}/${markH.toFixed(0)} units (${(GAP_RATIO * 100).toFixed(2)}% of height)`);
