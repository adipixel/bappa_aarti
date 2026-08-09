import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Close, Music, Search } from '../components/icons';
import { AUDIO_ENABLED } from '../config';
import { searchSongs } from '../data/songs';

/** Pull the matching lyric line out so the user sees why a result matched. */
function snippet(lyrics: string, query: string): string {
  const line = lyrics.split('\n').find((l) => l.toLowerCase().includes(query.toLowerCase()));
  return line?.trim() ?? '';
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => searchSongs(query), [query]);
  const trimmed = query.trim();

  return (
    <>
      <AppHeader title="शोधा" subtitle="Search" back="/" showSearch={false} />

      <main className="scroll-area search">
        <div className="search__field">
          <Search />
          <input
            ref={inputRef}
            className="search__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="आरतीचे नाव किंवा ओळ… / name or line"
            autoFocus
            autoComplete="off"
            enterKeyHint="search"
            aria-label="Search aartis"
          />
          {query && (
            <button className="icon-btn" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear">
              <Close size={19} />
            </button>
          )}
        </div>

        {trimmed.length < 2 ? (
          <p className="empty">
            <span className="empty__deva">॥ श्री गणेशाय नमः ॥</span>
            Type at least two letters. You can search in Devanagari or in English —
            “घालीन” and “ghalin” both work.
          </p>
        ) : hits.length === 0 ? (
          <p className="empty">
            <span className="empty__deva">काही सापडले नाही</span>
            No match for “{trimmed}”.
          </p>
        ) : (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {hits.map(({ playlist, song, matchedIn }) => (
              <li key={`${playlist.id}/${song.id}`}>
                <Link className="track" to={`/${playlist.id}/${song.id}`}>
                  <span className="track__body">
                    <span className="track__title">{song.title}</span>
                    <span className="track__sub">
                      <span className="chip">{playlist.titleEn}</span> {song.titleEn}
                    </span>
                    {matchedIn === 'lyrics' && (
                      <span className="search__snippet">{snippet(song.lyrics, trimmed)}</span>
                    )}
                  </span>
                  {AUDIO_ENABLED && song.audio && (
                    <span className="track__badge">
                      <Music />
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}
