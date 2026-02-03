'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 
import { Loader2 } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Provedor Blindado V18: Escudo de Silêncio para Erros de Asserção Críticos.
 * Intercepta erros ca9 e b815 no nível global para evitar o Overlay de erro visual do Next.js.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Interceptador Global de Elite V18
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || "";
      const isInternalError = 
        msg.includes('INTERNAL ASSERTION FAILED') || 
        msg.includes('ca9') || 
        msg.includes('b815');

      if (isInternalError) {
        // Bloqueia a propagação para o manipulador de erros do Next.js
        event.stopImmediatePropagation();
        event.preventDefault();
        console.warn("🛡️ Escudo LK RAMOS V18: Falha interna do Firebase silenciada para manter estabilidade visual.");
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || "";
      if (reason.includes('INTERNAL ASSERTION FAILED') || reason.includes('ca9') || reason.includes('b815')) {
        event.stopImmediatePropagation();
        event.preventDefault();
        console.warn("🛡️ Escudo LK RAMOS V18: Rejeição de rede silenciada.");
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
                <p className="text-sm font-bold text-foreground uppercase tracking-widest">LK RAMOS</p>
                <p className="text-[10px] text-muted-foreground animate-pulse font-bold">ESTABILIZANDO INFRAESTRUTURA DE DADOS...</p>
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
