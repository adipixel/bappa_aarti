import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { SettingsProvider } from './state/settings';
import { trackDisplayMode } from './utils/analytics';
import './index.css';

// Ship updates without a prompt — nobody wants a dialog mid-aarti. The new
// version is picked up on the next launch.
registerSW({ immediate: true });

// Track app installation status on launch
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
