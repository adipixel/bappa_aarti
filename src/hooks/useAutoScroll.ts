import { useEffect, useRef, type RefObject } from 'react';

/**
 * Scrolls the lyrics at a steady, sub-pixel-accurate rate so hands stay free
 * for the aarti thali. Any manual touch/wheel/keyboard scroll is treated as the
 * user taking over and pauses it via `onInterrupt`.
 *
 * Drives the app's scrolling region rather than the window — the shell is a
 * fixed-height flex column, so the window never scrolls.
 */
export function useAutoScroll(
  active: boolean,
  /** Lines per minute, converted to px/s against the current line height. */
  linesPerMinute: number,
  lineHeightPx: number,
  onInterrupt: () => void,
  scrollerRef: RefObject<HTMLElement>,
) {
  const interruptRef = useRef(onInterrupt);
  interruptRef.current = onInterrupt;

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!active || !scroller) return;

    const pxPerSecond = (linesPerMinute * lineHeightPx) / 60;
    let frame = 0;
    let last = performance.now();
    // Tracked separately from scrollTop because scrollTop is integer-rounded,
    // and slow speeds would otherwise never accumulate enough to move.
    let target = scroller.scrollTop;
    // Set by our own scrolling, so the scroll listener can tell self-inflicted
    // movement apart from the user's finger.
    let expected = scroller.scrollTop;

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      const max = scroller.scrollHeight - scroller.clientHeight;
      target = Math.min(target + pxPerSecond * dt, max);
      scroller.scrollTop = target;
      expected = scroller.scrollTop;

      if (target >= max) {
        interruptRef.current();
        return;
      }
      frame = requestAnimationFrame(step);
    };

    const onManualScroll = () => {
      if (Math.abs(scroller.scrollTop - expected) > 2) interruptRef.current();
    };
    const takeOver = () => interruptRef.current();

    frame = requestAnimationFrame(step);
    scroller.addEventListener('scroll', onManualScroll, { passive: true });
    scroller.addEventListener('wheel', takeOver, { passive: true });
    scroller.addEventListener('touchstart', takeOver, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', onManualScroll);
      scroller.removeEventListener('wheel', takeOver);
      scroller.removeEventListener('touchstart', takeOver);
    };
  }, [active, linesPerMinute, lineHeightPx, scrollerRef]);
}
