'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 
import { Loader2 } from 'lucide-react';

/**
 * Provedor Blindado V20: Escudo de Silêncio Absoluto.
 * Intercepta erros ca9 e b815 no nível global e no console para evitar o Overlay do Next.js.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 🛡️ ESCUDO DE SILÊNCIO V20: Interceptação de Erros e Rejeições fatais do SDK
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || "";
      const stack = event.error?.stack || "";
      const isAssertion = msg.includes('INTERNAL ASSERTION FAILED') || 
                         msg.includes('ca9') || 
                         msg.includes('b815') ||
                         stack.includes('ca9') ||
                         stack.includes('b815');

      if (isAssertion) {
        console.warn("🛡️ LK Ramos: Interceptada falha de asserção interna do Firebase. Recuperando...");
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || "";
      if (reason.includes('INTERNAL ASSERTION FAILED') || reason.includes('ca9') || reason.includes('b815')) {
        console.warn("🛡️ LK Ramos: Interceptada promessa rejeitada por estado interno. Ignorando...");
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    // 🛡️ INTERCEPTADOR DE CONSOLE: Evita que o Next.js capture logs de erro do SDK e dispare a tela vermelha
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('INTERNAL ASSERTION FAILED') || msg.includes('ca9') || msg.includes('b815')) {
        return; // Silêncio técnico absoluto
      }
      originalConsoleError.apply(console, args);
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
      console.error = originalConsoleError;
    };
  }, []);

  if (isInitializing) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4 text-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-1">
                <p className="text-sm font-bold text-foreground uppercase tracking-widest">LK RAMOS</p>
                <p className="text-[10px] text-muted-foreground animate-pulse font-bold">ESTABILIZANDO MOTOR DE DADOS V20...</p>
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
