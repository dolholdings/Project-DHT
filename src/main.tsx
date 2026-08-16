// Ensure window.fetch has both getter and setter across all browser contexts
if (typeof window !== 'undefined') {
  try {
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    if (origFetch) {
      let currentFetch = origFetch;
      const desc = Object.getOwnPropertyDescriptor(window, 'fetch') || 
                   Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'fetch');
      if (!desc || !desc.set) {
        Object.defineProperty(window, 'fetch', {
          get: () => currentFetch,
          set: (v) => {
            currentFetch = typeof v === 'function' ? v : origFetch;
          },
          configurable: true,
          enumerable: true,
        });
      }
    }
  } catch (e) {
    // Graceful fallback
  }
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
