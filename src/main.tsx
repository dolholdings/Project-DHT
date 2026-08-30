import { isAbortError } from './lib/errorUtils';

if (typeof window !== 'undefined') {
  // Gracefully handle harmless abort errors / cancelled fetch requests / iframe sandbox getter collisions
  window.addEventListener('unhandledrejection', (event) => {
    if (isAbortError(event?.reason)) {
      try {
        event.preventDefault();
      } catch (_) {}
    }
  });

  window.addEventListener('error', (event) => {
    const errorStr = String(event?.message || event?.error || '').toLowerCase();
    if (
      isAbortError(event?.error) ||
      isAbortError(event?.message) ||
      errorStr.includes('cannot set property fetch') ||
      errorStr.includes('which has only a getter')
    ) {
      try {
        event.preventDefault();
      } catch (_) {}
    }
  });
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
