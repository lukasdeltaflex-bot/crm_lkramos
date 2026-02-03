'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  Unsubscribe,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * Hook Defensivo V50 para coleções Firestore.
 * Silencia falhas internas de estado (ca9/b815) tratadas pelo Escudo de Infraestrutura.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!memoizedTargetRefOrQuery) {
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
          memoizedTargetRefOrQuery,
          (snapshot: QuerySnapshot<DocumentData>) => {
            if (!isMounted) return;
            const results: WithId<T>[] = [];
            snapshot.forEach((doc) => {
              results.push({ ...(doc.data() as T), id: doc.id });
            });
            setData(results);
            setError(null);
            setIsLoading(false);
          },
          (err: FirestoreError) => {
            if (!isMounted) return;
            
            const msg = (err.message || "").toUpperCase();
            // 🛡️ Filtro de supressão para erros de Watch Stream
            if (msg.includes('ASSERTION') || msg.includes('CA9') || msg.includes('B815') || msg.includes('STATE')) {
                return; 
            }
            
            if (err.code === 'permission-denied') {
                let path = 'unknown';
                try {
                    path = (memoizedTargetRefOrQuery as any).path || 'query';
                } catch(e) {}

                const contextualError = new FirestorePermissionError({
                    operation: 'list',
                    path,
                });
                setError(contextualError);
                errorEmitter.emit('permission-error', contextualError);
            } else {
                setError(err);
            }
            setIsLoading(false);
          }
        );
    } catch (e: any) {
        if (isMounted) {
            const msg = (e.message || "").toUpperCase();
            if (!msg.includes('CA9') && !msg.includes('B815') && !msg.includes('ASSERTION')) {
                setError(e);
            }
            setIsLoading(false);
        }
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try { unsubscribe(); } catch (e) {}
      }
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
