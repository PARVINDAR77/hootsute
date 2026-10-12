'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Service worker registered successfully
        })
        .catch((err) => {
          console.warn('PWA service worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
