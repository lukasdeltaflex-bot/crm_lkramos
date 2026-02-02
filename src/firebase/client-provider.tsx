'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './firebase'; 
import { Loader2 } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Provedor que garante a inicialização do Firebase no lado do cliente.
 * Importação direta do ./firebase para evitar dependência circular com o index.ts.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
        initializeFirebase();
    } catch (error) {
        console.error("❌ Falha crítica na inicialização do Firebase:", error);
    } finally {
        setIsInitializing(false);
    }
  }, []);

  if (isInitializing) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">LK RAMOS: Estabelecendo conexão segura...</p>
        </div>
    );
  }

  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
