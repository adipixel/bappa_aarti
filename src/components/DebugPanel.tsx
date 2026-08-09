import { useEffect, useState } from 'react';

/**
 * Viewport readout, shown in settings only when the URL carries `?debug`.
 *
 * Layout bugs here have all been iOS-standalone-only and unreproducible in a
 * desktop browser, so this exists to turn "there's a gap at the bottom" into
 * numbers that can be acted on.
 */

/** env() cannot be read from JS, so measure it off a probe element. */
function safeAreaInsets() {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;' +
    'top:env(safe-area-inset-top);bottom:env(safe-area-inset-bottom);' +
    'left:env(safe-area-inset-left);right:env(safe-area-inset-right)';
  document.body.appendChild(probe);
  const s = getComputedStyle(probe);
  const insets = { top: s.top, bottom: s.bottom, left: s.left, right: s.right };
  probe.remove();
  return insets;
}

export function DebugPanel() {
  const [rows, setRows] = useState<[string, string][]>([]);

  useEffect(() => {
    const read = () => {
      const insets = safeAreaInsets();
      const app = document.querySelector('.app')?.getBoundingClientRect();
      const vv = window.visualViewport;
      const bar = document.querySelector('.song-bar')?.getBoundingClientRect();
      setRows([
        ['window.inner', `${window.innerWidth} × ${window.innerHeight}`],
        ['doc.client', `${document.documentElement.clientWidth} × ${document.documentElement.clientHeight}`],
        ['visualViewport', vv ? `${Math.round(vv.width)} × ${Math.round(vv.height)}` : '—'],
        ['screen', `${window.screen.width} × ${window.screen.height}`],
        ['viewport shortfall', `${window.screen.height - window.innerHeight}`],
        ['--app-height', getComputedStyle(document.documentElement).getPropertyValue('--app-height').trim() || '(unset)'],
        ['.app height', app ? `${Math.round(app.height)} (top ${Math.round(app.top)})` : '—'],
        // Measured against the screen, not innerHeight: iOS under-reports the
        // viewport here, so an innerHeight-relative gap reads 0 even when the
        // shell visibly stops short of the bottom of the screen.
        ['gap: screen − .app', app ? `${Math.round(window.screen.height - app.bottom)}` : '—'],
        ['gap: screen − bar', bar ? `${Math.round(window.screen.height - bar.bottom)}` : '(no bar)'],
        ['safe top/bottom', `${insets.top} / ${insets.bottom}`],
        ['standalone', `${document.documentElement.classList.contains('is-standalone')}`],
        ['display-mode', `${window.matchMedia('(display-mode: standalone)').matches}`],
        ['dpr', `${window.devicePixelRatio}`],
      ]);
    };
    read();
    window.addEventListener('resize', read);
    window.visualViewport?.addEventListener('resize', read);
    return () => {
      window.removeEventListener('resize', read);
      window.visualViewport?.removeEventListener('resize', read);
    };
  }, []);

  return (
    <div className="setting">
      <div className="setting__label">Viewport debug</div>
      <div className="setting__hint">Screenshot this and send it over.</div>
      <dl className="debug">
        {rows.map(([k, v]) => (
          <div className="debug__row" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
