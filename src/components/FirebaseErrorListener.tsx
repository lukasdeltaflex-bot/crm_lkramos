'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente que escuta erros de permissão do Firebase e os exibe de forma
 * controlada usando Toasts. Inclui deduplicação para evitar flood de mensagens.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  const lastErrorRef = useRef<string | null>(null);
  const lastToastTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      const now = Date.now();
      const errorKey = `${error.request.method}:${error.request.path}`;
      
      // Previne que o mesmo erro exiba múltiplos toasts em menos de 5 segundos
      if (lastErrorRef.current === errorKey && now - lastToastTimeRef.current < 5000) {
        return;
      }

      lastErrorRef.current = errorKey;
      lastToastTimeRef.current = now;
      
      toast({
        variant: 'destructive',
        title: 'Acesso Restrito',
        description: 'Não foi possível carregar alguns dados devido a restrições de segurança ou filtros ausentes.',
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}