import { useEffect } from 'react';
import {
  FONT_MAX,
  FONT_MIN,
  SPEED_MAX,
  SPEED_MIN,
  useSettings,
  type Theme,
} from '../state/settings';
import { Close } from './icons';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'Dark · अंधुक' },
  { id: 'light', label: 'Light · उजेड' },
];

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { theme, fontSize, scrollSpeed, keepAwake, set } = useSettings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const wakeLockSupported = 'wakeLock' in navigator;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="सेटिंग्ज / Settings">
        <div className="sheet__grip" />

        <div className="sheet__header">
          <h2 className="sheet__title">सेटिंग्ज · Settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="बंद करा / Close">
            <Close />
          </button>
        </div>

        <div className="setting">
          <div className="setting__head">
            <div>
              <div className="setting__label">अक्षरांचा आकार · Text size</div>
              <div className="setting__hint">Set it so you can read from an arm's length.</div>
            </div>
          </div>
          <div className="stepper">
            <button
              className="stepper__btn"
              onClick={() => set('fontSize', Math.max(FONT_MIN, fontSize - 2))}
              disabled={fontSize <= FONT_MIN}
              aria-label="Smaller text"
            >
              A−
            </button>
            <input
              className="stepper__track"
              type="range"
              min={FONT_MIN}
              max={FONT_MAX}
              step={1}
              value={fontSize}
              onChange={(e) => set('fontSize', Number(e.target.value))}
              aria-label="Text size"
            />
            <button
              className="stepper__btn"
              onClick={() => set('fontSize', Math.min(FONT_MAX, fontSize + 2))}
              disabled={fontSize >= FONT_MAX}
              aria-label="Larger text"
            >
              A+
            </button>
          </div>
          <div className="sample" style={{ fontSize }}>
            जय देव जय देव जय मंगलमुर्ती
          </div>
        </div>

        <div className="setting">
          <div className="setting__head">
            <div className="setting__label">रंगछटा · Theme</div>
          </div>
          <div className="segmented">
            {THEMES.map((t) => (
              <button
                key={t.id}
                aria-pressed={theme === t.id}
                onClick={() => set('theme', t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting">
          <div className="setting__head">
            <div>
              <div className="setting__label">स्क्रोल वेग · Auto-scroll speed</div>
              <div className="setting__hint">
                Lines per minute once you start auto-scroll. Touching the screen pauses it.
              </div>
            </div>
            <span className="setting__value">{scrollSpeed}</span>
          </div>
          <div className="stepper">
            <button
              className="stepper__btn"
              onClick={() => set('scrollSpeed', Math.max(SPEED_MIN, scrollSpeed - 2))}
              disabled={scrollSpeed <= SPEED_MIN}
              aria-label="Slower"
            >
              −
            </button>
            <input
              className="stepper__track"
              type="range"
              min={SPEED_MIN}
              max={SPEED_MAX}
              step={1}
              value={scrollSpeed}
              onChange={(e) => set('scrollSpeed', Number(e.target.value))}
              aria-label="Auto-scroll speed"
            />
            <button
              className="stepper__btn"
              onClick={() => set('scrollSpeed', Math.min(SPEED_MAX, scrollSpeed + 2))}
              disabled={scrollSpeed >= SPEED_MAX}
              aria-label="Faster"
            >
              +
            </button>
          </div>
        </div>

        <div className="setting">
          <div className="setting__head">
            <div>
              <div className="setting__label">स्क्रीन चालू ठेवा · Keep screen awake</div>
              <div className="setting__hint">
                {wakeLockSupported
                  ? 'Stops the phone locking while an aarti is open.'
                  : 'Not supported by this browser — set a longer screen timeout instead.'}
              </div>
            </div>
            <button
              className="switch"
              role="switch"
              aria-checked={keepAwake}
              aria-label="Keep screen awake"
              onClick={() => set('keepAwake', !keepAwake)}
            >
              <span className="switch__knob" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
