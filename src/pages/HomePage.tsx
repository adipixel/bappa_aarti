import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { InstallCard } from '../components/InstallCard';
import { SettingsSheet } from '../components/SettingsSheet';
import { ChevronRight } from '../components/icons';
import { playlists } from '../data/songs';

export function HomePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <AppHeader title="आरती संग्रह" subtitle="Bappa Aarti" onOpenSettings={() => setSettingsOpen(true)} />

      <main className="home">
        <div className="home__hero">
          <img className="home__mark" src="/favicon.svg" alt="" width={76} height={76} />
          <h2 className="home__title">गणपती बाप्पा मोरया</h2>
          <p className="home__subtitle">Aarti Sangraha</p>
        </div>

        <nav aria-label="Playlists">
          {playlists.map((playlist) => (
            <Link key={playlist.id} className="playlist-card" to={`/${playlist.id}`}>
              <span className="playlist-card__num" aria-hidden>
                {playlist.title.charAt(0)}
              </span>
              <span className="playlist-card__body">
                <span className="playlist-card__title">{playlist.title}</span>
                <span className="playlist-card__meta">
                  {playlist.titleEn} · {playlist.count} songs
                </span>
              </span>
              <ChevronRight />
            </Link>
          ))}
        </nav>

        <InstallCard />

        <footer className="home__footer">
          <span className="deva">भक्तांसाठी भक्तांकडून</span>
          <p className="home__credit">
            Made with <i className="heart">♥</i> by Aditya Mhamunkar
          </p>
        </footer>
      </main>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
