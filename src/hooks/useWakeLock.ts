import { useEffect, useState } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}

type WakeLockNavigator = Navigator & {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
};

/**
 * Keeps the screen on while an aarti is open — a phone locking mid-verse is the
 * single most disruptive thing that can happen during puja.
 *
 * The lock is dropped automatically when the tab is hidden, so it is re-acquired
 * on visibility change. Returns whether a lock is currently held; unsupported
 * browsers (notably iOS before 16.4) simply report false.
 */
export function useWakeLock(enabled: boolean): boolean {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const wakeLock = (navigator as WakeLockNavigator).wakeLock;
    if (!enabled || !wakeLock) {
      setHeld(false);
      return;
    }

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const next = await wakeLock.request('screen');
        if (cancelled) {
          void next.release();
          return;
        }
        sentinel = next;
        setHeld(true);
        next.addEventListener('release', () => setHeld(false));
      } catch {
        // Denied (e.g. low battery mode). Nothing to do but carry on.
        setHeld(false);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (sentinel && !sentinel.released) void sentinel.release();
      setHeld(false);
    };
  }, [enabled]);

  return held;
}
