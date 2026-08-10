/**
 * Google Analytics tracking utilities.
 *
 * To enable analytics, add your Measurement ID to window.gtag initialization
 * in index.html and set ANALYTICS_ENABLED to true.
 */

export const ANALYTICS_ENABLED = true;

/**
 * Track a page view event. Called automatically on route changes.
 */
export function trackPageView(path: string, title: string) {
  if (!ANALYTICS_ENABLED || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
}

/**
 * Track user installation status (standalone app vs browser).
 * Called once on app load.
 */
export function trackDisplayMode() {
  if (!ANALYTICS_ENABLED || !window.gtag) return;
  const isStandalone =
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  window.gtag('event', 'view_item', {
    items: [
      {
        item_name: 'app_launch',
        item_category: isStandalone ? 'installed_app' : 'browser_tab',
      },
    ],
  });
}

/**
 * Track when a user opens a song/aarti.
 */
export function trackSongView(playlistId: string, songTitle: string) {
  if (!ANALYTICS_ENABLED || !window.gtag) return;
  window.gtag('event', 'view_item', {
    items: [
      {
        item_id: playlistId,
        item_name: songTitle,
        item_category: 'song',
      },
    ],
  });
}

/**
 * Track search queries.
 */
export function trackSearch(query: string, resultCount: number) {
  if (!ANALYTICS_ENABLED || !window.gtag) return;
  window.gtag('event', 'search', {
    search_term: query,
    item_count: resultCount,
  });
}

/**
 * Track song audio playback start.
 */
export function trackAudioPlay(songTitle: string) {
  if (!ANALYTICS_ENABLED || !window.gtag) return;
  window.gtag('event', 'view_item', {
    items: [
      {
        item_name: songTitle,
        item_category: 'audio_playback',
      },
    ],
  });
}

/**
 * Report a crash.
 *
 * Crashes in this app have so far only ever happened on other people's phones,
 * where there is no console to read. Sending them here is the only way the real
 * message and location are ever seen.
 */
export function reportError(error: unknown, componentStack?: string) {
  if (!ANALYTICS_ENABLED || typeof window.gtag !== 'function') return;
  const err = error instanceof Error ? error : new Error(String(error));
  window.gtag('event', 'exception', {
    description: `${err.name}: ${err.message} @ ${location.pathname}`,
    fatal: true,
    // Truncated: GA drops long parameter values outright.
    error_stack: (err.stack ?? '').slice(0, 400),
    component_stack: (componentStack ?? '').slice(0, 300),
  });
}

/**
 * Catch what the error boundary cannot: failures outside React's render pass —
 * a chunk that will not load, a listener that throws, a rejected promise.
 */
export function installGlobalErrorReporting() {
  window.addEventListener('error', (e) => reportError(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason));
}

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, eventParams?: Record<string, unknown>) => void;
  }
}
