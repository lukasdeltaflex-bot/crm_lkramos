'use client';

import app, { auth, db, storage } from './firebase';

/**
 * Exportação centralizada exigida pelo ClientProvider.
 * Retorna as instâncias singleton do Firebase.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined' && app.options.projectId !== 'seu-projeto') {
    console.log("🚀 LK RAMOS - CONEXÃO FIREBASE ATIVA:", app.options.projectId);
  } else if (typeof window !== 'undefined') {
    console.warn("⚠️ LK RAMOS: Firebase detectado com chaves padrão. Por favor, configure seu firebase.ts");
  }
  
  return {
    firebaseApp: app,
    auth,
    firestore: db,
    storage
  };
}

export * from './firebase';
export { db as firestore } from './firebase'; 
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
