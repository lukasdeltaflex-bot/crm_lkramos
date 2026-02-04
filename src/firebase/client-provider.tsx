'use client';

import dynamic from 'next/dynamic';
import React, { ReactNode } from 'react';

/**
 * 🛡️ ISOLAMENTO TOTAL DE SSR
 * O FirebaseProvider é carregado dinamicamente APENAS no client-side.
 * Isso impede que o Build ou o SSR tentem acessar o Firestore.
 */
const FirebaseProviderSafe = dynamic(
  () => import('./provider').then(mod => mod.FirebaseProvider),
  { 
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-20" />
            <div className="text-center">
                <p className="text-sm font-bold opacity-40 uppercase tracking-widest">LK RAMOS</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-30 mt-1">Inicializando núcleo...</p>
            </div>
        </div>
    )
  }
);

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseProviderSafe>
      {children}
    </FirebaseProviderSafe>
  );
}
