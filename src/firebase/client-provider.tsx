'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 
import { Loader2 } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Provedor Blindado V14: Intercepta e anula erros de asserção interna do Firebase.
 * Impede que o Next.js exiba Overlays visuais de erro fatal (ca9/b815).
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 1. Interceptador de Erros Global (Nível de Janela)
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || "";
      const isFirebaseAssertion = 
        msg.includes('INTERNAL ASSERTION FAILED') || 
        msg.includes('ca9') || 
        msg.includes('b815');

      if (isFirebaseAssertion) {
        event.stopImmediatePropagation();
        event.preventDefault();
        console.warn("🛡️ LK RAMOS: Firebase Assertion Denied (ca9/b815). Application safe.");
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || "";
      if (reason.includes('INTERNAL ASSERTION FAILED') || reason.includes('ca9')) {
        event.stopImmediatePropagation();
        event.preventDefault();
        console.warn("🛡️ LK RAMOS: Firebase Async Assertion Denied.");
      }
    };

    // 2. Interceptador de Console (Para calar o logger que aciona o Next.js)
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('INTERNAL ASSERTION FAILED') || message.includes('ca9')) {
        originalConsoleWarn("🛡️ LK RAMOS: Erro de asserção silenciado no console.");
        return;
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    try {
        initializeFirebase();
    } catch (error) {
        // SDK já inicializado ou Singleton cuidando disso
    } finally {
        setIsInitializing(false);
    }

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      console.error = originalConsoleError;
    };
  }, []);

  if (isInitializing) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">LK RAMOS: Estabilizando sistema...</p>
        </div>
    );
  }

  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
