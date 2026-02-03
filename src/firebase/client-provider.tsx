'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 

/**
 * Provedor de Infraestrutura Blindada V48.
 * Protocolo de Supressão Absoluta para falhas críticas do SDK do Firestore (ca9/b815).
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 🛡️ ESCUDO DE SILÊNCIO V48: Interceptação Profunda no nível do motor
    const isSuppressibleError = (err: any) => {
        if (!err) return false;
        const msg = String(err?.message || err?.stack || err || "").toUpperCase();
        return (
            msg.includes('INTERNAL ASSERTION FAILED') ||
            msg.includes('CA9') ||
            msg.includes('B815') ||
            msg.includes('FE: -1')
        );
    };

    const handleGlobalError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'error' in event ? event.error : (event as any).reason;
      if (isSuppressibleError(error)) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    };

    // Mute de Console Redundante
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args.some(arg => isSuppressibleError(arg))) return;
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleGlobalError, true);

    try {
        initializeFirebase();
    } catch (error) {}

    setIsReady(true);

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleGlobalError, true);
      console.error = originalConsoleError;
    };
  }, []);

  // Para evitar erros de Hidratação (Hydration Mismatch):
  // O servidor renderiza children, o cliente só renderiza após montar o estado isReady.
  if (!isReady) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-20" />
            <div className="text-center">
                <p className="text-sm font-bold opacity-40">LK RAMOS</p>
                <p className="text-[10px] text-muted-foreground font-bold">Sincronizando banco de dados...</p>
            </div>
        </div>
    );
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
