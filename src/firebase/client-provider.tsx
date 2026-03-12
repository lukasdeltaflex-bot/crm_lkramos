'use client';

import React, { ReactNode } from 'react';
import { FirebaseProvider } from './provider';

/**
 * 🛡️ CLIENT WRAPPER
 * Agora o FirebaseProvider já lida internamente com a montagem segura.
 * Este arquivo permanece para compatibilidade com o layout.tsx.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
