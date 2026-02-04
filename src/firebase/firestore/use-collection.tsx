'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
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
 * Hook de Coleção Blindado V66.
 * Gerenciamento estrito de ciclo de vida para evitar erro ca9.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: (CollectionReference<DocumentData> | Query<DocumentData>) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 🛡️ Segurança de Browser
    if (typeof window === "undefined") return;

    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      return;
    }

    // Limpa listener anterior antes de criar novo
    if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
    }

    setIsLoading(true);

    try {
        unsubRef.current = onSnapshot(
          memoizedTargetRefOrQuery,
          (snapshot: QuerySnapshot<DocumentData>) => {
            const results: WithId<T>[] = [];
            snapshot.forEach((doc) => {
              results.push({ ...(doc.data() as T), id: doc.id });
            });
            setData(results);
            setError(null);
            setIsLoading(false);
          },
          (err: FirestoreError) => {
            if (err.code === 'permission-denied') {
                let path = 'unknown';
                try { path = (memoizedTargetRefOrQuery as any).path || 'query'; } catch(e) {}
                const contextualError = new FirestorePermissionError({ operation: 'list', path });
                setError(contextualError);
                errorEmitter.emit('permission-error', contextualError);
            } else {
                setError(err);
            }
            setIsLoading(false);
          }
        );
    } catch (e: any) {
        setIsLoading(false);
    }

    return () => {
      if (unsubRef.current) {
          unsubRef.current();
          unsubRef.current = null;
      }
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
