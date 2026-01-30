'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Componente silencioso que monitora erros de permissão do Firebase.
 * Agora apenas registra no console para evitar interrupções na interface do usuário.
 */
export function FirebaseErrorListener() {
  const lastErrorRef = useRef<string | null>(null);
  const lastLogTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      const now = Date.now();
      const errorKey = `${error.request.method}:${error.request.path}`;
      
      // Throttling: Evita poluir o console com o mesmo erro repetidamente
      if (lastErrorRef.current === errorKey && now - lastLogTimeRef.current < 10000) {
        return;
      }

      lastErrorRef.current = errorKey;
      lastLogTimeRef.current = now;
      
      // Log técnico apenas para depuração, sem interromper o usuário
      console.warn("Firestore Sync Notice:", {
        method: error.request.method,
        path: error.request.path,
        uid: error.request.auth?.uid
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}