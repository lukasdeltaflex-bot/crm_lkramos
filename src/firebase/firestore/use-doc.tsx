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
 * Hook Defensivo V29 para documentos Firestore.
 * Silencia inconsistências de asserção interna do SDK.
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

            const msg = (err.message || "").toUpperCase();
            // 🛡️ Filtro de erro técnico V29: ca9/b815/assertion
            if (msg.includes('ASSERTION') || msg.includes('CA9') || msg.includes('B815')) {
                return;
            }

            if (err.code === 'permission-denied') {
                const contextualError = new FirestorePermissionError({
                  operation: 'get',
                  path: memoizedDocRef.path,
                });
                setError(contextualError);
                errorEmitter.emit('permission-error', contextualError);
            } else {
                setError(err);
            }
            setData(null);
            setIsLoading(false);
          }
        );
    } catch (e: any) {
        if (isMounted) setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try {
            unsubscribe();
        } catch (e) {}
      }
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
