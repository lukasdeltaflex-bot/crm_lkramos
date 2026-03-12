import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, Firestore, persistentLocalCache, memoryLocalCache, getFirestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { firebaseConfig } from "./config";

/**
 * 🛠️ INFRAESTRUTURA DE DADOS LK RAMOS - SINGLETON RESILIENTE
 * Removido 'use client' do topo para permitir importação em rotas de servidor (build).
 */

let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

// Inicialização segura que funciona em ambiente Node (build) e Browser
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

if (typeof window !== "undefined") {
    // 🔐 ATIVAÇÃO APP CHECK (Apenas Cliente)
    if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("XXXXXXXXXXXX")) {
        try {
            initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider("6Lf_fYcsAAAAAO6FkYzdDKt5wlcat-yGOxH0otxD"),
                isTokenAutoRefreshEnabled: true,
            });
        } catch (e) {
            console.warn("🛡️ App Check não inicializado.");
        }
    }

    // 🛡️ INICIALIZAÇÃO SEGURA DO ANALYTICS (Apenas Cliente)
    isSupported().then(supported => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    }).catch(() => {});

    // Firestore com Cache Persistente (Apenas Cliente)
    const firestoreSettings = {
        experimentalForceLongPolling: true,
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
} else {
    // Fallback básico para ambiente de servidor (build)
    db = getFirestore(app);
}

auth = getAuth(app);
storage = getStorage(app, firebaseConfig.storageBucket);

export { db, auth, storage, analytics };

export function initializeFirebase(): FirebaseApp {
  return app;
}
