import { initializeApp, FirebaseApp, getApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

// 🛡️ PROTOCOLO DE IMUTABILIDADE V63: Singleton Global Blindado
const g = globalThis as any;

let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

if (!g._firebaseDb) {
    try {
        /**
         * 🔌 CONFIGURAÇÃO DE REDE V63:
         * Protocolo ultra-estável para evitar erros de asserção (ca9/b815).
         * Força Long Polling e desativa Fetch Streams.
         */
        g._firebaseDb = initializeFirestore(app, {
            experimentalForceLongPolling: true,
            experimentalAutoDetectLongPolling: false,
            useFetchStreams: false,
        } as any);
    } catch (e) {
        g._firebaseDb = getFirestore(app);
    }
}
const db: Firestore = g._firebaseDb;

if (!g._firebaseAuth) {
    g._firebaseAuth = getAuth(app);
}
const auth: Auth = g._firebaseAuth;

if (!g._firebaseStorage) {
    g._firebaseStorage = getStorage(app);
}
const storage: FirebaseStorage = g._firebaseStorage;

export { app, auth, db, storage };

export function initializeFirebase(): FirebaseApp {
  return app;
}