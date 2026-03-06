'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, Firestore, persistentLocalCache, memoryLocalCache, getFirestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

/**
 * 🛠️ INFRAESTRUTURA DE DADOS LK RAMOS - SINGLETON RESILIENTE
 * Otimizado para evitar múltiplas inicializações e garantir conectividade em redes instáveis.
 */

let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== "undefined") {
    try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        
        // 🛡️ VERIFICAÇÃO DE SINGLETON: Evita erro de "Firestore has already been initialized"
        // que pode causar falhas de conexão no Next.js HMR.
        try {
            db = getFirestore(app);
        } catch (e) {
            // Se falhar (ex: configurações pendentes), inicializamos com o protocolo blindado
            const firestoreSettings = {
                experimentalForceLongPolling: true,
                experimentalAutoDetectLongPolling: false,
                useFetchStreams: false,
                ignoreUndefinedProperties: true,
            };

            const localCache = (() => {
                try {
                    return persistentLocalCache({});
                } catch (e) {
                    console.warn("⚠️ LK RAMOS: Cache persistente não suportado. Usando modo memória.");
                    return memoryLocalCache();
                }
            })();

            db = initializeFirestore(app, {
                ...firestoreSettings,
                localCache
            });
        }

        auth = getAuth(app);
        storage = getStorage(app, firebaseConfig.storageBucket);
        
        console.log("💎 LK RAMOS: Conectividade Firestore estabilizada.");
    } catch (error) {
        console.error("❌ Falha crítica na inicialização Firebase:", error);
    }
}

export { db, auth, storage };

export function initializeFirebase(): FirebaseApp | null {
  if (typeof window !== "undefined") {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return null;
}
