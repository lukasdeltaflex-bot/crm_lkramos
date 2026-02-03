import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDcdnNBy0TZTsq_cI02KFVU9o7PJopEczM",
  authDomain: "studio-248448941-9c1c2.firebaseapp.com",
  projectId: "studio-248448941-9c1c2",
  storageBucket: "studio-248448941-9c1c2.firebasestorage.app",
  messagingSenderId: "341426752875",
  appId: "1:341426752875:web:348f88597e5b9b2057d02e",
};

// 🛡️ SINGLETON BLINDADO V24: Proteção absoluta contra erros de estado b815/ca9
const g = globalThis as any;

if (!g._firebaseApp) {
    g._firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}
const app = g._firebaseApp;

// Firestore Singleton - Configuração única e estável via Long Polling
if (!g._firebaseDb) {
    try {
        g._firebaseDb = initializeFirestore(app, {
            cacheSizeBytes: CACHE_SIZE_UNLIMITED,
            experimentalForceLongPolling: true, // Crucial para evitar erro ca9 em nuvem
        });
    } catch (e) {
        g._firebaseDb = getFirestore(app);
    }
}
const db = g._firebaseDb;

if (!g._firebaseAuth) {
    g._firebaseAuth = getAuth(app);
}
const auth = g._firebaseAuth;

if (!g._firebaseStorage) {
    g._firebaseStorage = getStorage(app);
}
const storage = g._firebaseStorage;

export { app, auth, db, storage };

export function initializeFirebase(): FirebaseApp {
  return app;
}
