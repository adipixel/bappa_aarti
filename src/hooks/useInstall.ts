import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac, so check for a touchscreen too.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function detectInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari's own flag, which predates display-mode.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export interface InstallState {
  /** True once the app is running from the home screen — hide all prompting. */
  installed: boolean;
  platform: Platform;
  /** Chrome captured an install event, so we can show the real system dialog. */
  canPromptNatively: boolean;
  /** Opens the browser's install dialog. Resolves false if unavailable or declined. */
  promptInstall: () => Promise<boolean>;
}

export function useInstall(): InstallState {
  const [installed, setInstalled] = useState(detectInstalled);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const platform = detectPlatform();

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      // Keep the event so the button can fire the real dialog on demand,
      // instead of the browser deciding when to nag.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    const display = window.matchMedia('(display-mode: standalone)');
    const onDisplayChange = () => setInstalled(detectInstalled());

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    display.addEventListener('change', onDisplayChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      display.removeEventListener('change', onDisplayChange);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The event is single-use; Chrome fires a fresh one if the user declines.
    setDeferred(null);
    return outcome === 'accepted';
  };

  return { installed, platform, canPromptNatively: deferred !== null, promptInstall };
}
