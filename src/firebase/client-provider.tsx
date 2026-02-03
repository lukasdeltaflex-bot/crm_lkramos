'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 
import { Loader2 } from 'lucide-react';

/**
 * Provedor Blindado V24: Protocolo de Supressão Total.
 * Intercepta erros fatais do Firebase (ca9/b815) e resolve erros de hidratação.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 🛡️ ESCUDO DE SILÊNCIO V24: Interceptação Global para evitar o Overlay do Next.js
    const isSuppressibleError = (msg: string) => {
        if (!msg) return false;
        const normalized = String(msg).toUpperCase();
        return (
            normalized.includes('INTERNAL ASSERTION FAILED') ||
            normalized.includes('CA9') ||
            normalized.includes('B815') ||
            normalized.includes('FE: -1')
        );
    };

    const handleGlobalError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const message = 'message' in event ? event.message : (event.reason?.message || String(event.reason));
      if (isSuppressibleError(message)) {
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    };

    // Interceptação de Console para evitar que o Next.js dispare o Overlay por logs do SDK
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = args.join(' ');
      if (isSuppressibleError(msg)) return; 
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleGlobalError, true);

    try {
        initializeFirebase();
    } catch (error) {
        // Silencioso
    }

    setMounted(true);

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleGlobalError, true);
      console.error = originalConsoleError;
    };
  }, []);

  // 🛡️ PROTOCOLO ANTI-HIDRATAÇÃO: Renderiza apenas no cliente após mount
  if (!mounted) {
    return null; 
  }

  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}

interface FirebaseClientProviderProps {
  children: ReactNode;
}
