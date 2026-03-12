'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, Firestore, persistentLocalCache, memoryLocalCache, getFirestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { firebaseConfig } from "./config";

/**
 * 🛠️ INFRAESTRUTURA DE DADOS LK RAMOS - SINGLETON RESILIENTE
 */

let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

// Modificado para inicializar os serviços mesmo no lado do servidor (Next.js SSR/Edge)
// No entanto, Analytics e AppCheck permanecem apenas no lado do cliente.
try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    if (typeof window !== "undefined") {
        // 🔐 ATIVAÇÃO APP CHECK (Apenas Cliente)
        if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("XXXXXXXXXXXX")) {
            try {
                initializeAppCheck(app, {
                    provider: new ReCaptchaV3Provider("6Lf_fYcsAAAAAO6FkYzdDKt5wlcat-yGOxH0otxD"),
                    isTokenAutoRefreshEnabled: true,
                });
                console.log("🛡️ LK RAMOS: App Check inicializado com sucesso.");
            } catch (e) {
                console.warn("🛡️ LK RAMOS: Falha ao carregar App Check.");
            }
        }

        // 🛡️ INICIALIZAÇÃO SEGURA DO ANALYTICS (Apenas Cliente)
        if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("XXXXXXXXXXXX")) {
            isSupported().then(supported => {
                if (supported) {
                    analytics = getAnalytics(app);
                }
            }).catch(() => {});
        }
    }

    // Firestore e Storage podem ser inicializados no servidor para operações básicas (como manifest.ts)
    try {
        db = getFirestore(app);
    } catch (e) {
        if (typeof window !== "undefined") {
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
                    return memoryLocalCache();
                }
            })();

            db = initializeFirestore(app, {
                ...firestoreSettings,
                localCache
            });
        }
    }

    auth = getAuth(app);
    storage = getStorage(app, firebaseConfig.storageBucket);
    
    if (typeof window !== "undefined") {
        console.log("💎 LK RAMOS: Conectividade Firebase estabilizada.");
    }
} catch (error) {
    console.error("❌ Falha crítica na inicialização Firebase:", error);
}

export { db, auth, storage, analytics };

export function initializeFirebase(): FirebaseApp | null {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}
