'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook defensivo para documentos Firestore.
 * Previne falhas de sincronização em tempo real (ID: ca9).
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedDocRef);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!memoizedDocRef) {
      if (isMounted) {
        setData(null);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    let unsubscribe: Unsubscribe | null = null;

    try {
        unsubscribe = onSnapshot(
          memoizedDocRef,
          (snapshot: DocumentSnapshot<DocumentData>) => {
            if (!isMounted) return;
            if (snapshot.exists()) {
              setData({ ...(snapshot.data() as T), id: snapshot.id });
            } else {
              setData(null);
            }
            setError(null);
            setIsLoading(false);
          },
          (err: FirestoreError) => {
            if (!isMounted) return;
            if (err.message.includes('INTERNAL ASSERTION FAILED')) {
                return;
            }
            const contextualError = new FirestorePermissionError({
              operation: 'get',
              path: memoizedDocRef.path,
            });

            setError(contextualError);
            setData(null);
            setIsLoading(false);
            errorEmitter.emit('permission-error', contextualError);
          }
        );
    } catch (e: any) {
        console.warn("Falha ao inicializar stream de documento:", e);
        setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try {
            unsubscribe();
        } catch (e) {
            // Ignore safe cleanup errors
        }
      }
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
