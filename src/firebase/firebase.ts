import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED, getFirestore as getExistingFirestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDcdnNBy0TZTsq_cI02KFVU9o7PJopEczM",
  authDomain: "studio-248448941-9c1c2.firebaseapp.com",
  projectId: "studio-248448941-9c1c2",
  storageBucket: "studio-248448941-9c1c2.firebasestorage.app",
  messagingSenderId: "341426752875",
  appId: "1:341426752875:web:348f88597e5b9b2057d02e",
};

// Singleton Blindado V11: Prevenção absoluta contra reinicialização de instâncias
const globalForFirebase = globalThis as unknown as {
  app: FirebaseApp | undefined;
  auth: Auth | undefined;
  db: Firestore | undefined;
  storage: FirebaseStorage | undefined;
};

const app = globalForFirebase.app || (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp());

let db: Firestore;
if (globalForFirebase.db) {
    db = globalForFirebase.db;
} else {
    try {
        // Tenta inicializar com configurações otimizadas para ambientes Cloud
        db = initializeFirestore(app, {
            cacheSizeBytes: CACHE_SIZE_UNLIMITED,
            experimentalForceLongPolling: true, // Evita instabilidade de WebSockets (Erro ca9)
        });
    } catch (e) {
        // Se já estiver inicializado, recupera a instância existente para evitar b815
        db = getExistingFirestore(app);
    }
    globalForFirebase.db = db;
}

const auth = globalForFirebase.auth || getAuth(app);
const storage = globalForFirebase.storage || getStorage(app);

if (process.env.NODE_ENV !== "production") {
    globalForFirebase.app = app;
    globalForFirebase.auth = auth;
    globalForFirebase.db = db;
    globalForFirebase.storage = storage;
}

export { app, auth, db, storage };

export function initializeFirebase(): FirebaseApp {
  return app;
}
