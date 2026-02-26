'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, Firestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

/**
 * 🛠️ INFRAESTRUTURA DE DADOS LK RAMOS
 * Inicialização robusta com definição explícita do bucket e configurações de resiliência de rede.
 */

let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== "undefined") {
    try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        
        // 🛡️ CONFIGURAÇÃO DE REDE V11: Habilita detecção automática de Long Polling para evitar timeouts
        db = initializeFirestore(app, {
            experimentalAutoDetectLongPolling: true,
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });

        auth = getAuth(app);
        
        // Forçamos a conexão com o bucket específico para garantir que o SDK não use um endereço vazio
        storage = getStorage(app, firebaseConfig.storageBucket);
        
        console.log("💎 LK RAMOS: Núcleo Firebase inicializado com modo de resiliência.", {
            projectId: firebaseConfig.projectId,
            bucketName: firebaseConfig.storageBucket,
            storageAtivo: !!storage
        });
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
