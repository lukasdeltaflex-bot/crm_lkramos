import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

/**
 * 🛠️ NÚCLEO DE INFRAESTRUTURA LK RAMOS
 * Inicialização ultra-resiliente.
 * Garante que o Firebase não quebre durante o build (SSR).
 */

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
    // Ambiente de Navegador
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
} else {
    // Ambiente de Servidor (Build/SSR)
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

export { app, db, auth, storage };