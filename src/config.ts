/**
 * Audio is off by default.
 *
 * The recordings live on a host that serves plain HTTP, and a browser blocks
 * HTTP media on an HTTPS page — so every play button would fail. Lyrics are
 * the point of this app; a row of dead controls is worse than none.
 *
 * The URLs stay in songs.json, so re-enabling is a one-line change: set
 * VITE_AUDIO_ENABLED=true once the recordings are reachable over HTTPS.
 */
export const AUDIO_ENABLED = import.meta.env.VITE_AUDIO_ENABLED === 'true';

/**
 * Build identity, shown at the bottom of the settings sheet.
 *
 * The service worker updates silently in the background, so without this there
 * is no way to tell which build a phone is actually running — which matters
 * when a fix can only be confirmed on someone else's device.
 */
export const BUILD = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  built: __APP_BUILT__,
};

/**
 * Viewport readout in settings, switched on with `?debug`.
 *
 * The flag sticks for the rest of the session, because in-app links do not
 * carry query strings and the layout worth measuring is on the song page, not
 * the one you land on.
 */
const DEBUG = /* captured at startup, while the query string is still there */ (() => {
  try {
    if (new URLSearchParams(location.search).has('debug')) {
      sessionStorage.setItem('ba:debug', '1');
      return true;
    }
    return sessionStorage.getItem('ba:debug') === '1';
  } catch {
    return false;
  }
})();

export const debugEnabled = () => DEBUG;
