'use client';

import app, { auth, db, storage } from './firebase';

/**
 * Exportação centralizada exigida pelo ClientProvider e hooks.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined' && app.options.projectId !== 'seu-projeto') {
    console.log("🚀 LK RAMOS - CONEXÃO FIREBASE ATIVA:", app.options.projectId);
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
