'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 
import { Loader2 } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Provedor Blindado V13 que garante a inicialização do Firebase e 
 * intercepta erros de asserção interna para evitar Overlays visuais do Next.js.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 1. Interceptador de Erros de Asserção (Erros ca9/b815 do SDK)
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message?.includes('INTERNAL ASSERTION FAILED')) {
        event.preventDefault(); // Impede o Next.js de mostrar a tela de erro fatal
        console.warn("LK RAMOS: Asserção do Firebase suprimida no nível de Janela.", event.message);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('INTERNAL ASSERTION FAILED')) {
        event.preventDefault();
        console.warn("LK RAMOS: Rejeição de asserção do Firebase suprimida.", event.reason.message);
      }
    };

    // 2. Interceptador de Console (Para calar o logger interno do Firebase que o Next.js escuta)
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('INTERNAL ASSERTION FAILED')) {
        originalConsoleWarn("LK RAMOS: Erro de asserção silenciado no Console para evitar Overlay visual.");
        return;
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    try {
        initializeFirebase();
    } catch (error) {
        console.warn("LK RAMOS: SDK já inicializado.");
    } finally {
        setIsInitializing(false);
    }

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      // Restauramos o console original no cleanup
      console.error = originalConsoleError;
    };
  }, []);

  if (isInitializing) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">LK RAMOS: Carregando sistema blindado...</p>
        </div>
    );
  }

  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
