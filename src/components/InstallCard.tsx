import { useEffect, useState } from 'react';
import { useInstall, type Platform } from '../hooks/useInstall';
import { Close, Share, PlusSquare, DotsVertical } from './icons';

const STEPS: Record<Platform, { label: string; steps: { icon: JSX.Element; text: string }[] }> = {
  ios: {
    label: 'iPhone / iPad — Safari',
    steps: [
      { icon: <Share />, text: 'Tap the Share button at the bottom of Safari.' },
      { icon: <PlusSquare />, text: 'Scroll down and choose “Add to Home Screen”.' },
      { icon: <PlusSquare />, text: 'Tap “Add”. The diya icon appears on your home screen.' },
    ],
  },
  android: {
    label: 'Android — Chrome',
    steps: [
      { icon: <DotsVertical />, text: 'Tap the ⋮ menu at the top right of Chrome.' },
      { icon: <PlusSquare />, text: 'Choose “Add to Home screen” (or “Install app”).' },
      { icon: <PlusSquare />, text: 'Tap “Install”. The diya icon appears on your home screen.' },
    ],
  },
  desktop: {
    label: 'Desktop — Chrome / Edge',
    steps: [
      { icon: <PlusSquare />, text: 'Click the install icon in the address bar.' },
      { icon: <PlusSquare />, text: 'Choose “Install”.' },
    ],
  },
};

/** Order the tabs so the user's own device is first. */
const tabsFor = (platform: Platform): Platform[] =>
  platform === 'ios' ? ['ios', 'android'] : platform === 'android' ? ['android', 'ios'] : ['android', 'ios'];

export function InstallCard() {
  const { installed, platform, canPromptNatively, promptInstall } = useInstall();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<Platform>(platform === 'desktop' ? 'android' : platform);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Already on the home screen — nothing to ask for.
  if (installed) return null;

  const onClick = async () => {
    // Chrome can show the real system dialog; everyone else gets the steps.
    if (canPromptNatively && (await promptInstall())) return;
    setSheetOpen(true);
  };

  const tabs = tabsFor(platform);

  return (
    <>
      <button className="install" onClick={onClick}>
        <img className="install__icon" src="/favicon.svg" alt="" width={44} height={44} />
        <span className="install__body">
          <span className="install__title">फोनवर ॲप जोडा</span>
          <span className="install__sub">
            Add to Home Screen — opens full screen, works without internet
          </span>
        </span>
        <span className="install__cta" aria-hidden>
          जोडा
        </span>
      </button>

      {sheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Add to Home Screen">
            <div className="sheet__grip" />
            <div className="sheet__header">
              <h2 className="sheet__title">फोनवर ॲप जोडा · Add to Home Screen</h2>
              <button className="icon-btn" onClick={() => setSheetOpen(false)} aria-label="बंद करा / Close">
                <Close />
              </button>
            </div>

            <p className="setting__hint" style={{ marginBottom: 14 }}>
              Once added, it opens like a normal app — full screen, no browser bars, and all the
              lyrics work with no internet.
            </p>

            <div className="segmented" style={{ marginTop: 0 }}>
              {tabs.map((p) => (
                <button key={p} aria-pressed={tab === p} onClick={() => setTab(p)}>
                  {p === 'ios' ? 'iPhone' : 'Android'}
                </button>
              ))}
            </div>

            <ol className="steps">
              {STEPS[tab].steps.map((step, i) => (
                <li className="step" key={i}>
                  <span className="step__num">{i + 1}</span>
                  <span className="step__icon" aria-hidden>
                    {step.icon}
                  </span>
                  <span className="step__text">{step.text}</span>
                </li>
              ))}
            </ol>

            <p className="steps__note">{STEPS[tab].label}</p>
          </div>
        </>
      )}
    </>
  );
}
