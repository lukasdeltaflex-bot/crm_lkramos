'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Monitor silencioso de erros de permissão do Firebase.
 * Registra falhas apenas no console técnico para depuração,
 * mantendo a interface do usuário limpa e sem interrupções.
 */
export function FirebaseErrorListener() {
  const lastErrorRef = useRef<string | null>(null);
  const lastLogTimeRef = useRef<number>(0);

  useEffect(() => {
    // 🛡️ INTERCEPTOR DE CONSOLE: Silencia avisos de timeout que o NextJS promove a erros
    const originalWarn = console.warn;
    console.warn = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('Could not reach Cloud Firestore backend')) {
            // Log discreto apenas se necessário, sem disparar erro visual
            return;
        }
        originalWarn.apply(console, args);
    };

    const handleError = (error: FirestorePermissionError) => {
      const now = Date.now();
      const errorKey = `${error.request.method}:${error.request.path}`;
      
      // Evita logs repetidos em curto espaço de tempo (10 segundos)
      if (lastErrorRef.current === errorKey && now - lastLogTimeRef.current < 10000) {
        return;
      }

      lastErrorRef.current = errorKey;
      lastLogTimeRef.current = now;
      
      // Log técnico discreto
      console.warn("LK Ramos Security Access Info:", {
        action: error.request.method,
        resource: error.request.path,
        timestamp: new Date().toLocaleTimeString()
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
      console.warn = originalWarn; // Restaura o console original
    };
  }, []);

  return null;
}
