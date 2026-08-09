/**
 * Publishes the height the app shell should actually occupy, as `--app-height`.
 *
 * Installed on iOS, the web view is placed at the physical top of the screen —
 * content runs under the Dynamic Island, which is why safe-area-inset-top is
 * non-zero — but `innerHeight` comes back with that inset already deducted.
 * Measured on an iPhone 17: screen 402×874, innerHeight 812, inset-top 62.
 *
 * A shell sized to the reported viewport therefore stops 62px short of the
 * bottom of the screen, stranding the song controls above a strip of
 * background. Covering the screen instead puts them back on the edge.
 *
 * The correction is deliberately narrow, because on a device that reports its
 * viewport honestly it would push the controls off-screen instead:
 *   - only when running installed,
 *   - only when the shortfall is small,
 *   - only when the web view spans the full width of the screen, which rules
 *     out iPad Split View and Android multi-window.
 */

const MAX_SHORTFALL = 120;

function targetHeight(): number {
  const reported = window.innerHeight;
  if (!document.documentElement.classList.contains('is-standalone')) return reported;

  const shortfall = window.screen.height - reported;
  const fullWidth = window.screen.width === window.innerWidth;
  if (shortfall > 0 && shortfall <= MAX_SHORTFALL && fullWidth) return window.screen.height;
  return reported;
}

function apply() {
  document.documentElement.style.setProperty('--app-height', `${targetHeight()}px`);
}

export function trackViewportHeight() {
  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
  // Orientation changes report the old size for a frame or two.
  window.addEventListener('orientationchange', () => setTimeout(apply, 250));
}
