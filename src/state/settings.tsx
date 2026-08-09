import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'dark' | 'light';

export interface Settings {
  theme: Theme;
  /** Lyric font size in px. Deliberately large — this is read at arm's length. */
  fontSize: number;
  /** Lines per minute for auto-scroll. */
  scrollSpeed: number;
  /** Hold the screen awake while an aarti is open. */
  keepAwake: boolean;
}

const DEFAULTS: Settings = { theme: 'dark', fontSize: 26, scrollSpeed: 14, keepAwake: true };

export const FONT_MIN = 18;
export const FONT_MAX = 46;
export const SPEED_MIN = 6;
export const SPEED_MAX = 40;

const STORAGE_KEY = 'ba:settings';

function load(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(stored) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsContextValue extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      // Mirrored separately so the pre-paint script in index.html can read it
      // without parsing the whole settings blob.
      localStorage.setItem('ba:theme', settings.theme);
    } catch {
      /* private mode — settings just won't persist */
    }
    document.documentElement.dataset.theme = settings.theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', settings.theme === 'dark' ? '#1a1110' : '#fdf6ec');
  }, [settings]);

  const value = useMemo(() => ({ ...settings, set }), [settings, set]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
