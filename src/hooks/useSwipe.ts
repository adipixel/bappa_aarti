import { useRef, type TouchEvent } from 'react';

const MIN_DISTANCE = 70;
/** Horizontal travel must beat vertical by this much, or it's a scroll. */
const DIRECTION_RATIO = 1.6;

/** Swipe left/right to move between songs without hunting for a button. */
export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < MIN_DISTANCE) return;
      if (Math.abs(dx) < Math.abs(dy) * DIRECTION_RATIO) return;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    },
  };
}
