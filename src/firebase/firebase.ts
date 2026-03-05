'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, Firestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

/**
 * 🛠️ INFRAESTRUTURA DE DADOS LK RAMOS
 * Inicialização robusta com modo de resiliência de rede avançado.
 */

let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== "undefined") {
    try {
        // Diagnóstico de Configuração
        if (firebaseConfig.apiKey === "AIzaSyXXXXXXXXXXXX") {
            console.warn("⚠️ [LK RAMOS] ALERTA DE CONEXÃO: Você está usando chaves de API de exemplo. O Firestore não conseguirá conectar ao banco de dados real até que você configure seu arquivo .env ou src/firebase/config.ts com as credenciais do seu console Firebase.");
        }

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        
        // 🛡️ CONFIGURAÇÃO DE REDE V21: Resolvida incompatibilidade de parâmetros.
        // experimentalAutoDetectLongPolling substitui a necessidade de forçar manualmente.
        db = initializeFirestore(app, {
            experimentalAutoDetectLongPolling: true,
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });

        auth = getAuth(app);
        storage = getStorage(app, firebaseConfig.storageBucket);
        
        console.log("💎 LK RAMOS: Núcleo Firebase sincronizado com protocolo de detecção automática e suporte multi-abas.");
    } catch (error) {
        console.error("❌ Erro crítico na inicialização do Firebase:", error);
    }
}

export { db, auth, storage };

export function initializeFirebase(): FirebaseApp | null {
  if (typeof window !== "undefined") {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return null;
}
