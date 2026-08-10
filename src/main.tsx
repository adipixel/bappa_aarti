import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { SettingsProvider } from './state/settings';
import { installGlobalErrorReporting, trackDisplayMode } from './utils/analytics';
import './index.css';

// Before anything else, so a failure during startup is still reported.
installGlobalErrorReporting();

// Ship updates without a prompt — nobody wants a dialog mid-aarti. The new
// version is picked up on the next launch.
registerSW({ immediate: true });

// Installed to the home screen, or a browser tab?
trackDisplayMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SettingsProvider>
  </StrictMode>,
);
