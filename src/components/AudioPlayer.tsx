import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from './icons';
import { trackAudioPlay } from '../utils/analytics';

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

interface Props {
  src: string;
  title: string;
  /** Called when the track finishes, so the page can offer the next song. */
  onEnded?: () => void;
}

/**
 * A deliberately small player. The recordings live on a third-party host, so
 * this must stay usable when they cannot be reached — a failed track collapses
 * to a one-line note and never blocks the lyrics.
 */
export function AudioPlayer({ src, title, onEnded }: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  // A new song mounts the same element; reset transport state with it.
  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setDuration(0);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || failed) return;
    try {
      const iconUrl = new URL('/icon-512.png', window.location.href).href;
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: 'Bappa Aarti',
        album: 'आरती संग्रह',
        artwork: [{ src: iconUrl, sizes: '512x512', type: 'image/png' }],
      });
    } catch {
      // MediaSession or URL construction failed — just skip it
    }
  }, [title, failed]);

  const toggle = async () => {
    const el = ref.current;
    if (!el) return;
    try {
      if (el.paused) {
        await el.play();
        setPlaying(true);
        trackAudioPlay(title);
      } else {
        el.pause();
        setPlaying(false);
      }
    } catch {
      setFailed(true);
      setPlaying(false);
    }
  };

  if (failed) {
    return (
      <p className="audio__note">
        या आरतीचे रेकॉर्डिंग सध्या उपलब्ध नाही — गीत वाचून म्हणा.
        <br />
        Recording unavailable right now — the lyrics below still work offline.
      </p>
    );
  }

  return (
    <div className="audio">
      <audio
        ref={ref}
        src={src}
        preload="none"
        // No crossOrigin: we only play the audio, never read its samples, so
        // requesting CORS would make the host need permissive headers on top
        // of HTTPS for no benefit. The service worker caches the opaque
        // response instead (see cacheableResponse status 0 in vite.config).
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        onError={() => setFailed(true)}
      />
      <button
        className="audio__play"
        onClick={toggle}
        aria-label={playing ? 'थांबवा / Pause' : 'ऐका / Play'}
      >
        {playing ? <Pause /> : <Play />}
      </button>
      <div className="audio__body">
        <input
          className="audio__seek"
          type="range"
          min={0}
          max={duration || 0}
          step={0.5}
          value={Math.min(time, duration || 0)}
          disabled={!duration}
          onChange={(e) => {
            const el = ref.current;
            if (!el) return;
            el.currentTime = Number(e.target.value);
            setTime(el.currentTime);
          }}
          aria-label="Seek"
        />
        <div className="audio__times">
          <span>{fmt(time)}</span>
          <span>{duration ? fmt(duration) : '--:--'}</span>
        </div>
      </div>
    </div>
  );
}
