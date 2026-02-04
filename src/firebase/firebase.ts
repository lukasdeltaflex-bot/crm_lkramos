import { initializeApp, FirebaseApp, getApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDcdnNBy0TZTsq_cI02KFVU9o7PJopEczM",
  authDomain: "studio-248448941-9c1c2.firebaseapp.com",
  projectId: "studio-248448941-9c1c2",
  storageBucket: "studio-248448941-9c1c2.firebasestorage.app",
  messagingSenderId: "341426752875",
  appId: "1:341426752875:web:348f88597e5b9b2057d02e",
};

// 🛡️ PROTOCOLO DE IMUTABILIDADE V60: Singleton Global Blindado
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
         * 🔌 CONFIGURAÇÃO DE REDE V60:
         * Forçagem de Long Polling e desativação absoluta de Fetch Streams.
         * Esta é a cura técnica definitiva para o erro ca9/b815 em ambientes Cloud.
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
