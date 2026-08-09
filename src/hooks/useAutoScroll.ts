import { useEffect, useRef } from 'react';

/**
 * Scrolls the window at a steady, sub-pixel-accurate rate so hands stay free
 * for the aarti thali. Any manual touch/wheel/keyboard scroll is treated as the
 * user taking over and pauses it via `onInterrupt`.
 */
export function useAutoScroll(
  active: boolean,
  /** Lines per minute, converted to px/s against the current line height. */
  linesPerMinute: number,
  lineHeightPx: number,
  onInterrupt: () => void,
) {
  const interruptRef = useRef(onInterrupt);
  interruptRef.current = onInterrupt;

  useEffect(() => {
    if (!active) return;

    const pxPerSecond = (linesPerMinute * lineHeightPx) / 60;
    let frame = 0;
    let last = performance.now();
    // Tracked separately from scrollY because scrollY is integer-rounded, and
    // slow speeds would otherwise never accumulate enough to move.
    let target = window.scrollY;
    // Set by our own scrollTo, so the scroll listener can tell self-inflicted
    // scrolling apart from the user's finger.
    let expected = window.scrollY;

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = Math.min(target + pxPerSecond * dt, max);
      window.scrollTo(0, target);
      expected = window.scrollY;

      if (target >= max) {
        interruptRef.current();
        return;
      }
      frame = requestAnimationFrame(step);
    };

    const onManualScroll = () => {
      if (Math.abs(window.scrollY - expected) > 2) interruptRef.current();
    };

    frame = requestAnimationFrame(step);
    window.addEventListener('scroll', onManualScroll, { passive: true });
    window.addEventListener('wheel', () => interruptRef.current(), { passive: true });
    window.addEventListener('touchstart', () => interruptRef.current(), { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onManualScroll);
    };
  }, [active, linesPerMinute, lineHeightPx]);
}
