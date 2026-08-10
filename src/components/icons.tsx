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
 * Playlist marks. Each names what the songs in it are for, rather than
 * repeating the first letter of a title the reader can already see.
 */

/** Dholak — the two-headed barrel drum an aarti is sung to. */
export const Dholak = ({ size = 26 }: IconProps) => (
  <svg {...base(size)}>
    <ellipse cx="5.8" cy="12" rx="2.3" ry="5" />
    <path d="M5.8 7h12.4c1.3 0 2.3 2.2 2.3 5s-1 5-2.3 5H5.8" />
    <path d="M10.3 7.6v8.8M15 7.6v8.8" />
  </svg>
);

/**
 * Taal — the pair of hand cymbals that carry a gajar: two discs caught
 * overlapping as they clash, each with the raised boss the cord threads through.
 *
 * Drawn any more literally it stops being cymbals. Two circles bridged by a
 * cord is a pair of binoculars, the discs facing each other edge-on is a
 * bracket, and stacked one above the other they make an eye. Overlapping them
 * leaves nothing else for the shape to be mistaken for.
 */
export const Taal = ({ size = 26 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="8.6" cy="12" r="5.1" />
    <circle cx="15.4" cy="12" r="5.1" />
    <circle cx="8.6" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15.4" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * Añjali — palms together, the gesture a shlok is recited in. The thumbs and
 * the wrists are what make it read as hands; without them the silhouette is
 * just a pointed almond.
 */
export const Namaste = ({ size = 26 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3.6c-2.3 3.1-3.7 6.4-3.7 9.8V18h7.4v-4.6c0-3.4-1.4-6.7-3.7-9.8z" />
    <path d="M12 4.8V18" />
    <path d="M8.3 12.6c-1.2.5-1.9 1.5-1.9 2.7V18M15.7 12.6c1.2.5 1.9 1.5 1.9 2.7V18" />
    <path d="M6.4 20.4h11.2" />
  </svg>
);
