import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { InstallCard } from '../components/InstallCard';
import { SettingsSheet } from '../components/SettingsSheet';
import { ChevronRight, Dholak, Namaste, Taal } from '../components/icons';
import { playlists } from '../data/songs';
import { trackPageView, trackSupport } from '../utils/analytics';

/**
 * Razorpay page, reached from the footer credit and nowhere else.
 *
 * It belongs beside the maker's name rather than in a card of its own: that is
 * already the part of the screen about who made this, and it keeps money off
 * every screen someone might be looking at mid-aarti.
 */
const SUPPORT_URL = 'https://razorpay.me/@adityamhamunkar';

/**
 * What each playlist is for, as a picture: the drum an aarti is sung to, the
 * cymbals that carry a gajar, the joined palms a shlok is recited in. Better
 * than the first letter of the title, which is already written beside it.
 */
const PLAYLIST_ICON: Record<string, JSX.Element> = {
  aarti: <Dholak />,
  gajar: <Taal />,
  shlok: <Namaste />,
};

export function HomePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    trackPageView('/', 'आरती संग्रह / Bappa Aarti Home');
  }, []);

  return (
    <>
      <AppHeader title="आरती संग्रह" subtitle="Bappa Aarti" onOpenSettings={() => setSettingsOpen(true)} />

      <main className="scroll-area home">
        <div className="home__hero">
          <img className="home__mark" src="/favicon.svg" alt="" width={76} height={76} />
          <h2 className="home__title">गणपती बाप्पा मोरया</h2>
          <p className="home__subtitle">Aarti Sangraha</p>
        </div>

        <nav aria-label="Playlists">
          {playlists.map((playlist) => (
            <Link key={playlist.id} className="playlist-card" to={`/${playlist.id}`}>
              <span className="playlist-card__icon" aria-hidden>
                {PLAYLIST_ICON[playlist.id] ?? playlist.title.charAt(0)}
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
          <a
            className="home__support"
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackSupport()}
          >
            Support
          </a>
        </footer>
      </main>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
