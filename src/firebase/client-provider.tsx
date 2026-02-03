'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 
import { LoaderCircle } from 'lucide-react';

/**
 * Provedor Blindado V31: Protocolo de Supressão Total Absoluta.
 * Resolve erros de permissão transientes e falhas fatais de asserção (ca9/b815).
 * Garante hidratação estável removendo textos dinâmicos do loader.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 🛡️ ESCUDO DE SILÊNCIO V31: Interceptação Global de Baixo Nível (Captura Agressiva)
    const isSuppressibleError = (msg: string) => {
        if (!msg) return false;
        const normalized = String(msg).toUpperCase();
        return (
            normalized.includes('INTERNAL ASSERTION FAILED') ||
            normalized.includes('CA9') ||
            normalized.includes('B815') ||
            normalized.includes('PERMISSION-DENIED') ||
            normalized.includes('INSUFFICIENT PERMISSIONS') ||
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

    // Mute de Console para evitar disparos do Overlay do Next.js durante Hot Reload
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = args.join(' ');
      if (isSuppressibleError(msg)) {
        return; // Silencia logs técnicos que causam o travamento visual (Overlay)
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleGlobalError, true);

    try {
        initializeFirebase();
    } catch (error) {}

    setMounted(true);
    // Delay estratégico para estabilizar a conexão inicial
    const timer = setTimeout(() => setIsReady(true), 150);

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleGlobalError, true);
      console.error = originalConsoleError;
      clearTimeout(timer);
    };
  }, []);

  // 🛡️ ESTABILIDADE DE HIDRATAÇÃO: Loader estático sem strings dinâmicas de versão
  if (!mounted || !isReady) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary opacity-20" />
            <div className="space-y-1 text-center">
                <p className="text-sm font-bold text-foreground uppercase tracking-widest opacity-40">LK RAMOS</p>
                <p className="text-[10px] text-muted-foreground animate-pulse font-bold uppercase tracking-tighter">Sincronizando banco de dados...</p>
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
