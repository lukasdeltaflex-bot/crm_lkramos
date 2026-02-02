import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * CONFIGURAÇÃO DIRETA DO FIREBASE (HARDCODED PARA DEBUG)
 * 
 * ATENÇÃO: Substitua os valores abaixo pelos dados reais do seu projeto
 * obtidos em: Firebase Console -> Configurações do Projeto -> Seus Apps.
 */
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXX", // <--- SUBSTITUA POR SUA CHAVE REAL AQUI
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Singleton para garantir inicialização única no Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
