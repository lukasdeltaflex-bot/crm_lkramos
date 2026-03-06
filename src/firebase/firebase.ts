'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, Firestore, persistentLocalCache, memoryLocalCache } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

/**
 * 🛠️ INFRAESTRUTURA DE DADOS LK RAMOS - ULTRA RESILIENTE
 * Otimizado para ambientes com restrição de rede, proxies corporativos e Safari iOS.
 */

let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== "undefined") {
    try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        
        // 🛡️ PROTOCOLO DE CONEXÃO BLINDADO (MODO COMPATIBILIDADE TOTAL)
        // Forçamos Long Polling e desativamos Fetch Streams para máxima estabilidade.
        // Removemos configurações manuais de host para permitir que o SDK escolha a melhor rota.
        const firestoreSettings = {
            experimentalForceLongPolling: true,
            experimentalAutoDetectLongPolling: false,
            useFetchStreams: false, 
        };

        // Gerenciamento de cache resiliente (Safe para Safari Mobile e Modo Privado)
        // Removido TabManager para evitar conflitos de bloqueio de escrita em navegadores restritos.
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

        auth = getAuth(app);
        storage = getStorage(app, firebaseConfig.storageBucket);
        
        console.log("💎 LK RAMOS: Conectividade Firestore estabilizada via Long Polling.");
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
