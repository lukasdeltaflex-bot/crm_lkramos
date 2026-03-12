'use client';

import { useEffect } from 'react';

/**
 * 🚀 PWA ACTIVATOR
 * Registra o Service Worker no navegador para habilitar a instalação.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('🛡️ LK RAMOS: PWA registrado com sucesso:', registration.scope);
          },
          (err) => {
            console.log('❌ LK RAMOS: Falha ao registrar PWA:', err);
          }
        );
      });
    }
  }, []);

  return null;
}
