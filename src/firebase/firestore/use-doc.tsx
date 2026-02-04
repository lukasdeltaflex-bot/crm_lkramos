'use client';
    
import { useState, useEffect, useRef } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
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
 * Hook de Documento Blindado V66.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedDocRef);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      return;
    }

    if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
    }

    setIsLoading(true);

    try {
        unsubRef.current = onSnapshot(
          memoizedDocRef,
          (snapshot: DocumentSnapshot<DocumentData>) => {
            if (snapshot.exists()) {
              setData({ ...(snapshot.data() as T), id: snapshot.id });
            } else {
              setData(null);
            }
            setError(null);
            setIsLoading(false);
          },
          (err: FirestoreError) => {
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
        setIsLoading(false);
    }

    return () => {
      if (unsubRef.current) {
          unsubRef.current();
          unsubRef.current = null;
      }
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
