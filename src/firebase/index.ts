'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    const sdks = getSdks(firebaseApp);
    // Configura a persistência local para evitar perda de estado de auth entre reloads
    setPersistence(sdks.auth, browserLocalPersistence);
    return sdks;
  }

  const app = getApp();
  const sdks = getSdks(app);
  setPersistence(sdks.auth, browserLocalPersistence);
  return sdks;
}

export function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);
  
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore,
    storage: storage,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';