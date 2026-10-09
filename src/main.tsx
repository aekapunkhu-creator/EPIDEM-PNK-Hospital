import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Google Maps Tier 1 global listener & safe console error tap
if (typeof window !== 'undefined') {
  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent('gmp-auth-failed'));
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };

  const origError = console.error;
  console.error = (...args: unknown[]) => {
    origError.apply(console, args);
    const msg = args.map((a) => String(a)).join(' ');
    if (
      msg.includes('OverQuotaMapError') ||
      msg.includes('QuotaExceededError') ||
      msg.includes('InvalidKeyMapError') ||
      msg.includes('ApiProjectMapError')
    ) {
      window.dispatchEvent(new CustomEvent('gmp-auth-failed'));
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  };

  // Safe window error handler to prevent cross-origin Google Maps script errors from crashing the app
  window.addEventListener('error', (event) => {
    if (
      event.message === 'Script error.' ||
      (typeof event.filename === 'string' && event.filename.includes('maps.googleapis.com'))
    ) {
      window.dispatchEvent(new CustomEvent('gmp-auth-failed'));
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

