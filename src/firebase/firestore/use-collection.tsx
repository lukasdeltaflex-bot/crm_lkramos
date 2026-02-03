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

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * Hook Defensivo V20 para coleções Firestore.
 * Ignora erros de estado interno (ca9/b815) para manter a interface estável.
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
            
            // 🛡️ FILTRO V20: Ignora silenciosamente inconsistências técnicas (ca9/b815)
            const isAssertion = err.message?.includes('INTERNAL ASSERTION FAILED') || 
                               err.message?.includes('ca9') || 
                               err.message?.includes('b815');
            
            if (isAssertion) {
                console.warn("🛡️ Hook: Ignorada falha de sincronização do SDK.");
                return;
            }
            
            if (err.code === 'permission-denied') {
                const path: string =
                  memoizedTargetRefOrQuery.type === 'collection'
                    ? (memoizedTargetRefOrQuery as CollectionReference).path
                    : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

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
        if (isMounted) setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try {
            unsubscribe();
        } catch (e) {
            // Cleanup silencioso
        }
      }
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
