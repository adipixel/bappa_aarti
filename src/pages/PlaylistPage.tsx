import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { SettingsSheet } from '../components/SettingsSheet';
import { Music } from '../components/icons';
import { AUDIO_ENABLED } from '../config';
import { getPlaylist } from '../data/songs';

export function PlaylistPage() {
  const { playlistId } = useParams();
  const playlist = getPlaylist(playlistId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollerRef = useRef<HTMLElement>(null);

  // Switching playlists reuses this component, so reset the scroll by hand.
  //
  // The braces matter. Written as a concise arrow body this returns whatever
  // scrollTo returns, and React keeps that as the effect's cleanup function.
  // It is undefined in a stock browser, so the bug hid — but anything that
  // patches Element.prototype.scrollTo and returns a value (a smooth-scroll
  // polyfill, some extensions) makes React call a non-function on unmount.
  // Leaving the playlist for a song then threw, and the whole app went blank.
  useEffect(() => {
    scrollerRef.current?.scrollTo(0, 0);
  }, [playlistId]);

  if (!playlist) return <Navigate to="/" replace />;

  return (
    <>
      <AppHeader
        title={playlist.title}
        subtitle={`${playlist.titleEn} · ${playlist.count}`}
        back="/"
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="scroll-area tracks" ref={scrollerRef}>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {playlist.songs.map((song) => (
            <li key={song.id}>
              <Link className="track" to={`/${playlist.id}/${song.id}`}>
                <span className="track__num">{song.track}</span>
                <span className="track__body">
                  <span className="track__title">{song.title}</span>
                  <span className="track__sub">
                    {song.titleEn}
                    {song.lyricsPending && ' · लवकरच'}
                  </span>
                </span>
                {AUDIO_ENABLED && song.audio && (
                  <span className="track__badge" title="Recording available">
                    <Music />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </main>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
