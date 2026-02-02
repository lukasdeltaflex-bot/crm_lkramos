'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { Storage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { auth as authInstance, db, storage as storageInstance } from './firebase';

interface FirebaseProviderProps {
  children: ReactNode;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: Storage | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!authInstance) return;
    
    const unsubscribe = onAuthStateChanged(
      authInstance,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider Error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, []);

  const areServicesAvailable = !!authInstance && !!db;

  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable,
    firestore: db,
    auth: authInstance,
    storage: storageInstance,
    user: userAuthState.user,
    isUserLoading: userAuthState.isUserLoading,
    userError: userAuthState.userError,
  }), [userAuthState, areServicesAvailable]);

  // MODO EMERGÊNCIA: Não trava a UI se o Firebase falhar
  if (!areServicesAvailable) {
    console.warn("⚠️ LK RAMOS: Firebase indisponível ou em carregamento – modo emergência ativado.");
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  
  if (!context) {
    // Retorno seguro para evitar crash, mas avisa o desenvolvedor
    console.warn("useFirebase usado fora do Provider.");
    return {
        auth: authInstance,
        firestore: db,
        storage: storageInstance,
        user: null,
        isUserLoading: false,
        userError: null,
    };
  }

  return {
    auth: context.auth!,
    firestore: context.firestore!,
    storage: context.storage!,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = () => authInstance;
export const useFirestore = () => db;
export const useStorage = () => storageInstance;
export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps);
}
