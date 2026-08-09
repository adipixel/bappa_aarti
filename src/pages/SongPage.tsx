import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AudioPlayer } from '../components/AudioPlayer';
import { Lyrics } from '../components/Lyrics';
import { SettingsSheet } from '../components/SettingsSheet';
import { ChevronLeft, ChevronRight, Pause, ScrollDown } from '../components/icons';
import { AUDIO_ENABLED } from '../config';
import { getSong } from '../data/songs';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useSwipe } from '../hooks/useSwipe';
import { useWakeLock } from '../hooks/useWakeLock';
import { useSettings } from '../state/settings';

const LINE_HEIGHT_RATIO = 1.85; // keep in sync with .song__lyrics line-height

export function SongPage() {
  const { playlistId, songId } = useParams();
  const navigate = useNavigate();
  const { fontSize, scrollSpeed, keepAwake } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  const found = getSong(playlistId, songId);

  useWakeLock(keepAwake && !!found);

  const prev = found && found.index > 0 ? found.playlist.songs[found.index - 1] : undefined;
  const next =
    found && found.index < found.playlist.songs.length - 1
      ? found.playlist.songs[found.index + 1]
      : undefined;

  const goTo = useCallback(
    (targetId?: string) => {
      if (!targetId || !playlistId) return;
      setScrolling(false);
      navigate(`/${playlistId}/${targetId}`);
    },
    [navigate, playlistId],
  );

  const swipe = useSwipe(
    () => goTo(next?.id),
    () => goTo(prev?.id),
  );

  // New song: back to the top, and never carry auto-scroll across.
  useEffect(() => {
    window.scrollTo(0, 0);
    setScrolling(false);
  }, [playlistId, songId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(next?.id);
      if (e.key === 'ArrowLeft') goTo(prev?.id);
      if (e.key === ' ') {
        e.preventDefault();
        setScrolling((s) => !s);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [goTo, next, prev]);

  const stopScrolling = useCallback(() => setScrolling(false), []);
  useAutoScroll(scrolling, scrollSpeed, fontSize * LINE_HEIGHT_RATIO, stopScrolling);

  if (!found) return <Navigate to="/" replace />;
  const { playlist, song, index } = found;

  return (
    <>
      <AppHeader
        title={song.title}
        subtitle={`${playlist.title} · ${index + 1}/${playlist.songs.length}`}
        back={`/${playlist.id}`}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="song" {...swipe}>
        {AUDIO_ENABLED && song.audio && (
          <AudioPlayer src={song.audio} title={song.title} onEnded={() => goTo(next?.id)} />
        )}

        {song.lyricsPending ? (
          <p className="song__pending">
            <span className="deva">लवकरच…</span>
            Lyrics for this one aren't in the collection yet.
            {AUDIO_ENABLED && song.audio && ' You can still play the recording above.'}
          </p>
        ) : (
          <Lyrics text={song.lyrics} fontSize={fontSize} />
        )}

        {!song.lyricsPending && <p className="song__end">॥ शुभं भवतु ॥</p>}
        <div className="song__spacer" />
      </main>

      <div className="song-bar">
        <div className="song-bar__row">
          <button className="nav-btn" onClick={() => goTo(prev?.id)} disabled={!prev}>
            <ChevronLeft size={18} />
            <span className="nav-btn__label">{prev ? prev.title : 'सुरुवात'}</span>
          </button>

          <span className="song-bar__spacer" />

          <button
            className={`scroll-btn${scrolling ? ' is-active' : ''}`}
            onClick={() => setScrolling((s) => !s)}
            aria-pressed={scrolling}
            disabled={song.lyricsPending}
          >
            {scrolling ? <Pause size={17} /> : <ScrollDown />}
            {scrolling ? 'थांबवा' : 'स्क्रोल'}
          </button>

          <span className="song-bar__spacer" />

          <button className="nav-btn" onClick={() => goTo(next?.id)} disabled={!next}>
            <span className="nav-btn__label">{next ? next.title : 'समाप्त'}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
