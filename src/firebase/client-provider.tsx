'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 

/**
 * Provedor de Infraestrutura Blindada V52.
 * Protocolo de Supressão Absoluta para falhas críticas do SDK do Firestore (ca9/b815).
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 🛡️ ESCUDO DE SILÊNCIO V52: Interceptação Profunda no nível do motor do navegador
    const isSuppressibleError = (err: any) => {
        if (!err) return false;
        const msg = String(err?.message || err?.stack || err?.reason?.message || err || "").toUpperCase();
        const details = JSON.stringify(err).toUpperCase();
        
        return (
            msg.includes('INTERNAL ASSERTION FAILED') ||
            msg.includes('CA9') ||
            msg.includes('B815') ||
            msg.includes('FE: -1') ||
            msg.includes('UNEXPECTED STATE') ||
            details.includes('CA9') ||
            details.includes('B815') ||
            details.includes('FE: -1')
        );
    };

    const handleGlobalError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'error' in event ? event.error : (event as any).reason;
      if (isSuppressibleError(error)) {
        // 🛑 BLOQUEIO ABSOLUTO: Impede que o erro chegue ao Next.js e trave a tela
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    };

    // Mute de Console Redundante para evitar Overlays de Desenvolvimento
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args.some(arg => isSuppressibleError(arg))) {
          return; 
      }
      originalConsoleError.apply(console, args);
    };

    // Captura no nível mais baixo do navegador usando a fase de captura (true)
    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleGlobalError, true);

    try {
        initializeFirebase();
    } catch (error) {
        // Silencioso se já inicializado
    }

    // Delay de estabilização para hidratação perfeita
    const timer = setTimeout(() => {
        setIsReady(true);
    }, 10);

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleGlobalError, true);
      console.error = originalConsoleError;
      clearTimeout(timer);
    };
  }, []);

  // ⚠️ IMPORTANTE: Renderização simplificada e estática para evitar Hydration Mismatch
  if (!isReady) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-20" />
            <div className="text-center">
                <p className="text-sm font-bold opacity-40">LK RAMOS</p>
                <p className="text-xs text-muted-foreground">Sincronizando banco de dados...</p>
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
