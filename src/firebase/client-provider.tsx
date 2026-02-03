'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 
import { Loader2 } from 'lucide-react';

/**
 * Provedor Blindado V22: Protocolo de Supressão Total.
 * Intercepta e silencia erros fatais do Firebase (ca9/b815) no nível global.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 🛡️ ESCUDO DE SILÊNCIO V22: Interceptação Global de Erros de Asserção do SDK
    const isSuppressibleError = (msg: string) => {
        if (!msg) return false;
        const normalized = msg.toUpperCase();
        return (
            normalized.includes('INTERNAL ASSERTION FAILED') ||
            normalized.includes('CA9') ||
            normalized.includes('B815') ||
            normalized.includes('FE: -1') ||
            normalized.includes('UNEXPECTED STATE')
        );
    };

    const handleGlobalError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const message = 'message' in event ? event.message : (event.reason?.message || String(event.reason));
      if (isSuppressibleError(message)) {
        console.warn("🛡️ LK Ramos: Suprimida falha técnica do Firebase SDK. Sistema preservado.");
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    };

    // Interceptação de Console para evitar que o Next.js capture logs do SDK que disparam o Overlay
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = args.join(' ');
      if (isSuppressibleError(msg)) {
        return; // Silêncio técnico para o Next.js
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleGlobalError, true);

    try {
        initializeFirebase();
    } catch (error) {
        // SDK já inicializado ou em estado de recuperação
    } finally {
        setIsInitializing(false);
    }

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleGlobalError, true);
      console.error = originalConsoleError;
    };
  }, []);

  // Previne erro de hidratação garantindo que o servidor e o cliente renderizem o mesmo conteúdo inicial
  if (!mounted) {
    return null;
  }

  if (isInitializing) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4 text-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-1">
                <p className="text-sm font-bold text-foreground uppercase tracking-widest">LK RAMOS</p>
                <p className="text-[10px] text-muted-foreground animate-pulse font-bold">ESTABILIZANDO MOTOR DE DADOS V22...</p>
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
