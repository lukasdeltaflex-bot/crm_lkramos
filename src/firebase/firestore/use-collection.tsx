
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
 * Hook de Coleção com Listener de Segurança V65.
 * Utiliza useRef para garantir que nenhum listener órfão gere estados inconsistentes (ca9).
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  // 🛡️ Monitor de Listener Único
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Limpeza agressiva de listeners anteriores
    if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
    }

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

    try {
        unsubRef.current = onSnapshot(
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
            // 🛡️ Supressão de falhas técnicas do SDK
            if (msg.includes('ASSERTION') || msg.includes('CA9') || msg.includes('B815') || msg.includes('STATE')) {
                return; 
            }
            
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
        if (isMounted) {
            setIsLoading(false);
        }
    }

    return () => {
      isMounted = false;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
