'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

/**
 * CONFIGURAÇÃO DIRETA (MODO DE SEGURANÇA)
 * Substitua os valores abaixo pelos dados EXATOS do seu Firebase Console.
 */
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXX", // <--- COLE SUA API KEY AQUI
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

/**
 * Inicializa os serviços do Firebase de forma única.
 */
export function initializeFirebase() {
  const firebaseApp = !getApps().length 
    ? initializeApp(firebaseConfig) 
    : getApp();

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);
  
  if (typeof window !== 'undefined') {
    console.log("-----------------------------------------");
    console.log("🚀 LK RAMOS - CONEXÃO FIREBASE ATIVA");
    console.log("🆔 PROJECT ID:", firebaseApp.options.projectId);
    console.log("-----------------------------------------");

    setPersistence(auth, browserLocalPersistence).catch(err => {
        console.error("❌ Erro ao configurar persistência:", err);
    });
  }

  return { firebaseApp, auth, firestore, storage };
}

// Inicialização imediata para exportação de constantes
const services = initializeFirebase();
export const firebaseApp = services.firebaseApp;
export const auth = services.auth;
export const firestore = services.firestore;
export const storage = services.storage;

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
