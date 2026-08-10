interface IconProps {
  size?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const ChevronLeft = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const ChevronRight = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export const Search = ({ size = 21 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.6-3.6" />
  </svg>
);

export const Settings = ({ size = 21 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 7h10" />
    <path d="M18 7h2" />
    <circle cx="16" cy="7" r="2.2" />
    <path d="M4 17h6" />
    <path d="M14 17h6" />
    <circle cx="12" cy="17" r="2.2" />
  </svg>
);

export const Play = ({ size = 20 }: IconProps) => (
  <svg {...base(size)} fill="currentColor" stroke="none">
    <path d="M8 5.2v13.6a.7.7 0 0 0 1.07.6l10.6-6.8a.7.7 0 0 0 0-1.2L9.07 4.6A.7.7 0 0 0 8 5.2z" />
  </svg>
);

export const Pause = ({ size = 20 }: IconProps) => (
  <svg {...base(size)} fill="currentColor" stroke="none">
    <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
    <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
  </svg>
);

export const Close = ({ size = 21 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Music = ({ size = 17 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M9 18V6l10-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </svg>
);

export const Share = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 15V4" />
    <path d="M8.5 7.5L12 4l3.5 3.5" />
    <path d="M6 12H5v8h14v-8h-1" />
  </svg>
);

export const PlusSquare = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
);

export const DotsVertical = ({ size = 18 }: IconProps) => (
  <svg {...base(size)} fill="currentColor" stroke="none">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

export const Home = ({ size = 21 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 10.5L12 4l8 6.5" />
    <path d="M6 9.5V20h12V9.5" />
  </svg>
);

/*
 * Playlist marks — what the songs in each list are for.
 *
 * Bigger than the interface icons and with no badge behind them, so they carry
 * themselves on silhouette. The stroke is lighter than the standard 2: at this
 * size a 2-unit stroke on a 24-unit box closes up any detail inside the shape
 * and every one of these turned into a solid blob.
 */
const mark = (size: number) => ({ ...base(size), strokeWidth: 1.7 });

/**
 * Dholak. The barrel is the whole tell — the shell bows out at the waist and
 * the two heads are hooped rims seen end-on. The rope is two plain lines; drawn
 * as the zigzag it really is, it silts up into a solid patch.
 */
export const Dholak = ({ size = 34 }: IconProps) => (
  <svg {...mark(size)}>
    <ellipse cx="4.6" cy="12" rx="2" ry="4.4" />
    <ellipse cx="19.4" cy="12" rx="2" ry="4.4" />
    <path d="M4.6 7.6c4.7-1.7 10.1-1.7 14.8 0M4.6 16.4c4.7 1.7 10.1 1.7 14.8 0" />
    <path d="M9.6 6.9v10.2M14.4 6.9v10.2" />
  </svg>
);

/**
 * Taal. A pair of cymbals seen from above and to one side, so each disc is a
 * tilted ellipse rather than a circle — which is what stops them reading as
 * binoculars, a bracket or an eye, the three things a symmetrical pair of
 * circles turns into here. The dot is the boss the cord knots through.
 */
export const Taal = ({ size = 34 }: IconProps) => (
  <svg {...mark(size)}>
    <ellipse cx="8.7" cy="8.9" rx="6.7" ry="3.9" transform="rotate(-20 8.7 8.9)" />
    <circle cx="8.7" cy="8.9" r="1.05" fill="currentColor" stroke="none" />
    <ellipse cx="15.3" cy="15.1" rx="6.7" ry="3.9" transform="rotate(-20 15.3 15.1)" />
    <circle cx="15.3" cy="15.1" r="1.05" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * Añjali. The palms have to be wide and the thumbs have to show: narrow it and
 * it is a leaf, close the outline across the bottom and it is a bell, and a
 * plain pointed almond with a seam is a bullet. Fingertips at the top, the
 * widest point about two thirds down, then in to the wrists.
 */
export const Namaste = ({ size = 34 }: IconProps) => (
  <svg {...mark(size)}>
    <path d="M12 4C9.5 6.7 7.3 9.9 7 13.1c-.2 2 .7 3.6 2.4 4.4" />
    <path d="M12 4c2.5 2.7 4.7 5.9 5 9.1.2 2-.7 3.6-2.4 4.4" />
    <path d="M12 4.6v12.9" />
    <path d="M7 13.3c-1.2.5-2 1.6-2 2.9M17 13.3c1.2.5 2 1.6 2 2.9" />
    <path d="M9.4 17.5v3.1M14.6 17.5v3.1" />
  </svg>
);
