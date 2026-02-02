'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

/**
 * Inicializa os serviços do Firebase LK RAMOS.
 * Esta função deve ser chamada preferencialmente no lado do cliente.
 */
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;

  // Verifica se as chaves básicas estão presentes para evitar o erro auth/invalid-api-key
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "xxxxxxxx" || firebaseConfig.apiKey.trim() === "") {
    console.error("❌ LK RAMOS: NEXT_PUBLIC_FIREBASE_API_KEY não configurada no arquivo .env.local");
    // Não inicializamos se a chave for inválida para evitar crash do Auth
    return null;
  }

  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  const sdks = getSdks(firebaseApp);
  
  if (typeof window !== 'undefined') {
    // DIAGNÓSTICO TÉCNICO LK RAMOS
    console.log("-----------------------------------------");
    console.log("🚀 LK RAMOS - CONEXÃO FIREBASE ATIVA");
    console.log("🆔 PROJECT ID:", firebaseApp.options.projectId);
    console.log("🔑 CONFIG STATUS: OK");
    console.log("-----------------------------------------");

    setPersistence(sdks.auth, browserLocalPersistence).catch(err => {
        console.error("❌ Erro ao configurar persistência:", err);
    });
  }

  return sdks;
}

export function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);
  const auth = getAuth(firebaseApp);
  
  return {
    firebaseApp,
    auth,
    firestore,
    storage,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
