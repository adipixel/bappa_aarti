import { useEffect, useRef, useState } from 'react';
import {
  FONT_MAX,
  FONT_MIN,
  useSettings,
  type Theme,
} from '../state/settings';
import { BUILD, DEBUG_TAPS, debugEnabled, setDebug } from '../config';
import { DebugPanel } from './DebugPanel';
import { Close } from './icons';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'Dark · अंधुक' },
  { id: 'light', label: 'Light · उजेड' },
];

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { theme, fontSize, keepAwake, set } = useSettings();
  const [debug, setDebugShown] = useState(debugEnabled());
  const taps = useRef(0);
  const tapTimer = useRef<number>();

  // Tap the version line a few times to reveal the viewport readout. Hidden
  // rather than a switch because it is a diagnostic, not a setting.
  const tapVersion = () => {
    taps.current += 1;
    window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => {
      taps.current = 0;
    }, 1500);
    if (taps.current < DEBUG_TAPS) return;
    taps.current = 0;
    const next = !debug;
    setDebug(next);
    setDebugShown(next);
  };

  useEffect(() => () => window.clearTimeout(tapTimer.current), []);

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

        {debug && <DebugPanel />}

        <button
          className="sheet__version"
          onClick={tapVersion}
          aria-label={`Bappa Aarti version ${BUILD.version}. Tap ${DEBUG_TAPS} times to ${
            debug ? 'hide' : 'show'
          } the viewport readout.`}
        >
          Bappa Aarti v{BUILD.version}
          <span className="sheet__build">
            {BUILD.commit} · {BUILD.built}
          </span>
        </button>
      </div>
    </>
  );
}
