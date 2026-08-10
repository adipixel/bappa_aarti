import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../utils/analytics';

/**
 * Last line of defence around the whole app.
 *
 * A crash here used to leave a blank page, and then — briefly, while I was
 * chasing one — a raw React stack trace. Both are wrong for this app: someone
 * mid-puja needs a way forward, not a fault report.
 *
 * "Reset" is offered because the likeliest cause of a crash that cannot be
 * reproduced on a clean browser is a stale service-worker precache: an app
 * shell left behind by an earlier deploy. Dropping it and reloading fetches
 * the current build. Settings live in localStorage and are untouched.
 */

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

async function resetApp() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* best effort — reload regardless */
  }
  location.reload();
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // This has only ever happened on other people's devices, so the analytics
    // event is the only way the real message ever gets seen.
    reportError(error, info.componentStack ?? undefined);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="crash">
        <p className="crash__deva">क्षमस्व</p>
        <h1 className="crash__title">काहीतरी चुकले</h1>
        <p className="crash__body">
          This page could not be opened. Reloading usually sorts it out.
        </p>

        <div className="crash__actions">
          <button className="crash__btn crash__btn--primary" onClick={() => location.reload()}>
            पुन्हा लोड करा · Reload
          </button>
          <button className="crash__btn" onClick={resetApp}>
            ॲप रीसेट करा · Reset app
          </button>
        </div>

        <p className="crash__note">
          Reset downloads a fresh copy of the app. Your settings are kept.
        </p>
      </div>
    );
  }
}
