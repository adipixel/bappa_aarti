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
