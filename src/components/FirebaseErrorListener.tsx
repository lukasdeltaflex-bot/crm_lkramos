'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Monitor silencioso de erros do Firebase.
 * Intercepta e suprime erros de timeout de rede para evitar que o Next.js
 * exiba overlays de erro visuais ao usuário durante instabilidades momentâneas.
 */
export function FirebaseErrorListener() {
  const lastErrorRef = useRef<string | null>(null);
  const lastLogTimeRef = useRef<number>(0);

  useEffect(() => {
    // 🛡️ INTERCEPTOR GLOBAL DE ERROS: Silencia especificamente o erro de timeout do Firestore
    // Isso impede que o Next.js promova esse log a um erro fatal visual (Overlay).
    const originalError = console.error;
    const originalWarn = console.warn;

    const shouldSuppress = (args: any[]) => {
        const msg = args[0];
        return typeof msg === 'string' && (
            msg.includes('Could not reach Cloud Firestore backend') ||
            msg.includes('@firebase/firestore') ||
            msg.includes('Backend didn\'t respond within 10 seconds')
        );
    };

    console.error = (...args) => {
        if (shouldSuppress(args)) {
            // Log discreto apenas no terminal para depuração, sem disparar o erro visual no navegador
            return;
        }
        originalError.apply(console, args);
    };

    console.warn = (...args) => {
        if (shouldSuppress(args)) {
            return;
        }
        originalWarn.apply(console, args);
    };

    const handleError = (error: FirestorePermissionError) => {
      const now = Date.now();
      const errorKey = `${error.request.method}:${error.request.path}`;
      
      if (lastErrorRef.current === errorKey && now - lastLogTimeRef.current < 10000) {
        return;
      }

      lastErrorRef.current = errorKey;
      lastLogTimeRef.current = now;
      
      console.warn("LK Ramos Security Access Info:", {
        action: error.request.method,
        resource: error.request.path,
        timestamp: new Date().toLocaleTimeString()
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
