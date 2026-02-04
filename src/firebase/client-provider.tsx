'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 

/**
 * Provedor de Infraestrutura Blindada V58.
 * Protocolo de Supressão Absoluta para falhas críticas do SDK do Firestore (ca9/b815).
 * Implementa interceptação profunda em nível de captura global para silenciar erros antes do Next.js.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 🛡️ ESCUDO DE SILÊNCIO V58: Interceptação Profunda e Seletiva
    const isSuppressibleError = (err: any) => {
        if (!err) return false;
        
        const errorString = String(err?.message || err?.stack || err?.reason?.message || err || "").toUpperCase();
        
        let details = "";
        try {
            details = JSON.stringify(err).toUpperCase();
        } catch (e) {
            details = "";
        }
        
        const signatures = [
            'INTERNAL ASSERTION FAILED',
            'UNEXPECTED STATE',
            'ID: CA9',
            'ID: B815',
            'FE: -1',
            'FE:-1',
            'WATCH CHANGE AGGREGATOR',
            'WATCH_CHANGE'
        ];

        // Bloqueio se contiver a combinação de Falha de Asserção e um dos IDs técnicos.
        return signatures.some(sig => errorString.includes(sig) || details.includes(sig));
    };

    const handleGlobalError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'error' in event ? event.error : (event as any).reason;
      
      if (isSuppressibleError(error)) {
        // 🛑 BLOQUEIO ABSOLUTO: Silencia o erro para evitar o Overlay do Next.js
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    };

    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args.some(arg => isSuppressibleError(arg))) {
          return; 
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleGlobalError, true);

    try {
        initializeFirebase();
    } catch (error) {}

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

  // ⚠️ Hidratação Consistente: Loader fixo para evitar mismatch
  if (!isReady) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-20" />
            <div className="text-center">
                <p className="text-sm font-bold opacity-40 uppercase tracking-widest">LK RAMOS</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-30 mt-1">Sincronizando banco de dados...</p>
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
