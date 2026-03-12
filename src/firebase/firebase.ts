import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { 
    initializeFirestore, 
    Firestore, 
    persistentLocalCache, 
    memoryLocalCache, 
    getFirestore,
    connectFirestoreEmulator
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

/**
 * 🛠️ NÚCLEO DE INFRAESTRUTURA LK RAMOS
 * Inicialização ultra-resiliente para evitar travamentos no SSR e PWA.
 */

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// 🔐 Inicialização segura do Firestore
if (typeof window !== "undefined") {
    // No navegador, usamos cache persistente para suporte Offline
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({}),
        ignoreUndefinedProperties: true,
    });
} else {
    // No servidor (Build/SSR), usamos o Firestore padrão sem cache de disco
    db = getFirestore(app);
}

auth = getAuth(app);
storage = getStorage(app);

export { app, db, auth, storage };
