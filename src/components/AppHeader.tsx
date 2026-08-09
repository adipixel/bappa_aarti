import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Home, Search, Settings } from './icons';

interface Props {
  title: string;
  subtitle?: string;
  /** Where the back chevron goes. Omit to show a home button instead. */
  back?: string;
  onOpenSettings?: () => void;
  showSearch?: boolean;
}

export function AppHeader({ title, subtitle, back, onOpenSettings, showSearch = true }: Props) {
  const navigate = useNavigate();

  return (
    <header className="header">
      {back ? (
        <button className="icon-btn" onClick={() => navigate(back)} aria-label="मागे / Back">
          <ChevronLeft />
        </button>
      ) : (
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="मुख्यपृष्ठ / Home">
          <Home />
        </button>
      )}

      <h1 className="header__title">
        {title}
        {subtitle && <span className="header__sub">{subtitle}</span>}
      </h1>

      {showSearch ? (
        <button className="icon-btn" onClick={() => navigate('/search')} aria-label="शोधा / Search">
          <Search />
        </button>
      ) : (
        <span className="icon-btn" aria-hidden />
      )}

      {onOpenSettings ? (
        <button className="icon-btn" onClick={onOpenSettings} aria-label="सेटिंग्ज / Settings">
          <Settings />
        </button>
      ) : (
        <span className="icon-btn" aria-hidden />
      )}
    </header>
  );
}
