'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { Storage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { auth as authInstance, db, storage as storageInstance } from './firebase';

/**
 * 🛡️ PROVEDOR MESTRE FIREBASE
 * Gerencia o estado de autenticação e fornece as instâncias dos serviços.
 */

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firestore: Firestore;
  auth: Auth;
  storage: Storage;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const unsubscribe = onAuthStateChanged(
      authInstance,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("Firebase Auth Error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    return () => unsubscribe();
  }, []);

  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable: !!authInstance && !!db,
    firestore: db,
    auth: authInstance,
    storage: storageInstance,
    user: userAuthState.user,
    isUserLoading: userAuthState.isUserLoading,
    userError: userAuthState.userError,
  }), [userAuthState]);

  // Previne erros de hidratação garantindo que o conteúdo só renderize após a montagem do cliente
  if (!mounted) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-20" />
            <div className="text-center">
                <p className="text-sm font-black opacity-40 uppercase tracking-widest">LK RAMOS</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-30 mt-1">Conectando ao núcleo...</p>
            </div>
        </div>
    );
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
    // Fallback para uso fora do provider se necessário (apenas instâncias estáticas)
    return {
        auth: authInstance,
        firestore: db,
        storage: storageInstance,
        user: null,
        isUserLoading: true,
        userError: null,
    };
  }
  return context;
};

export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};

export const useAuth = () => authInstance;
export const useFirestore = () => db;
export const useStorage = () => storageInstance;

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps);
}
