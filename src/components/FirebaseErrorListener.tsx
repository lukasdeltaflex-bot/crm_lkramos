'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente que escuta erros de permissão do Firebase e os exibe de forma
 * não-fatal usando Toasts, evitando o crash completo da aplicação.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log amigável para depuração se houver detalhes do request
      if (error.request) {
        console.warn("Firestore Permission Alert:", {
          operation: error.request.method,
          path: error.request.path,
          authenticated: !!error.request.auth
        });
      }
      
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