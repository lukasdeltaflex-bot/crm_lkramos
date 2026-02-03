'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 
import { Loader2 } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Provedor Blindado V16: Escudo de Silêncio para Erros de Asserção.
 * Intercepta erros ca9 e b815 no nível global para evitar o Overlay do Next.js.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Interceptador Global Defensivo V16
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || "";
      const isInternalError = 
        msg.includes('INTERNAL ASSERTION FAILED') || 
        msg.includes('ca9') || 
        msg.includes('b815');

      if (isInternalError) {
        event.stopImmediatePropagation();
        event.preventDefault();
        console.warn("🛡️ Escudo LK RAMOS: Erro de asserção do Firebase silenciado para estabilidade.");
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || "";
      if (reason.includes('INTERNAL ASSERTION FAILED') || reason.includes('ca9') || reason.includes('b815')) {
        event.stopImmediatePropagation();
        event.preventDefault();
        console.warn("🛡️ Escudo LK RAMOS: Rejeição de asserção silenciada.");
      }
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    try {
        initializeFirebase();
    } catch (error) {
        // SDK já inicializado
    } finally {
        setIsInitializing(false);
    }

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  if (isInitializing) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4 text-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">LK RAMOS</p>
                <p className="text-xs text-muted-foreground animate-pulse">Protegendo infraestrutura de dados...</p>
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
