import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * CONFIGURAÇÃO DIRETA FIREBASE - LK RAMOS
 * 
 * ATENÇÃO: Substitua os valores abaixo pelos dados do seu Firebase Console
 * para que o login e o sistema funcionem corretamente.
 */
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXX", // <--- COLE SUA API KEY REAL AQUI
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Singleton para garantir inicialização única
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Função de inicialização exigida pelo Client Provider.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    console.log("🚀 LK RAMOS - CONEXÃO FIREBASE ATIVA:", app.options.projectId);
  }
  
  return {
    firebaseApp: app,
    auth,
    firestore: db,
    storage
  };
}

export default app;
