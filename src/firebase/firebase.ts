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

if (typeof window !== "undefined") {
    try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        
        // 🔐 ATIVAÇÃO APP CHECK (Proteção contra Robôs e Acessos Externos)
        // Nota: A fiscalização (Enforcement) deve ser ativada no console do Firebase após o registro da chave.
        if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("XXXXXXXXXXXX")) {
            try {
                initializeAppCheck(app, {
                    provider: new ReCaptchaV3Provider("COLOCAR_AQUI_A_SITE_KEY_PUBLICA"),
                    isTokenAutoRefreshEnabled: true,
                });
                console.log("🛡️ LK RAMOS: App Check inicializado.");
            } catch (e) {
                console.warn("🛡️ LK RAMOS: Falha ao carregar App Check. Verifique a Site Key.");
            }
        }

        // 🛡️ VERIFICAÇÃO DE SINGLETON FIRESTORE
        try {
            db = getFirestore(app);
        } catch (e) {
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

        auth = getAuth(app);
        storage = getStorage(app, firebaseConfig.storageBucket);

        // 🛡️ INICIALIZAÇÃO SEGURA DO ANALYTICS
        if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("XXXXXXXXXXXX")) {
            isSupported().then(supported => {
                if (supported) {
                    analytics = getAnalytics(app);
                }
            }).catch(() => {});
        }
        
        console.log("💎 LK RAMOS: Conectividade Firebase estabilizada.");
    } catch (error) {
        console.error("❌ Falha crítica na inicialização Firebase:", error);
    }
}

export { db, auth, storage, analytics };

export function initializeFirebase(): FirebaseApp | null {
  if (typeof window !== "undefined") {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return null;
}
