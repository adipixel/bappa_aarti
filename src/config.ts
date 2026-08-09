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
const DEBUG_KEY = 'ba:debug';

let debug = /* captured at startup, while the query string is still there */ (() => {
  try {
    if (new URLSearchParams(location.search).has('debug')) {
      localStorage.setItem(DEBUG_KEY, '1');
      return true;
    }
    return localStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
})();

export const debugEnabled = () => debug;

/**
 * Installed to the home screen there is no address bar, and the app always
 * launches at start_url — so `?debug` cannot be typed where it is needed. The
 * settings sheet turns it on by tapping the version line instead. Kept in
 * localStorage so it survives relaunching the app mid-investigation.
 */
export function setDebug(on: boolean) {
  debug = on;
  try {
    if (on) localStorage.setItem(DEBUG_KEY, '1');
    else localStorage.removeItem(DEBUG_KEY);
  } catch {
    /* private mode — it just won't persist */
  }
}

/** Taps on the version line needed to flip the viewport readout. */
export const DEBUG_TAPS = 5;
