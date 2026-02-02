import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDcdnNBy0TZTsq_cI02KFVU9o7PJopEczM",
  authDomain: "studio-248448941-9c1c2.firebaseapp.com",
  projectId: "studio-248448941-9c1c2",
  storageBucket: "studio-248448941-9c1c2.firebasestorage.app",
  messagingSenderId: "341426752875",
  appId: "1:341426752875:web:348f88597e5b9b2057d02e",
};

// Singleton pattern absoluto para evitar reinicialização do Firestore em desenvolvimento (Assertion Failed)
const globalForFirebase = globalThis as unknown as {
  app: FirebaseApp | undefined;
  auth: Auth | undefined;
  db: Firestore | undefined;
  storage: FirebaseStorage | undefined;
};

// Inicialização única do App
export const app = globalForFirebase.app || (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp());

// Inicialização única do Firestore com cache ilimitado e proteção de instância
export const db = globalForFirebase.db || initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    localCache: undefined // Força comportamento padrão se houver erro de persistência
});

// Inicialização única do Auth e Storage
export const auth = globalForFirebase.auth || getAuth(app);
export const storage = globalForFirebase.storage || getStorage(app);

// Persistência no objeto global em desenvolvimento
if (process.env.NODE_ENV !== "production") {
    globalForFirebase.app = app;
    globalForFirebase.auth = auth;
    globalForFirebase.db = db;
    globalForFirebase.storage = storage;
}

export function initializeFirebase(): FirebaseApp {
  return app;
}
