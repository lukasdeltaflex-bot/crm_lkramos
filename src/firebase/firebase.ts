import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
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

// Garante que o app seja inicializado de forma segura tanto no servidor quanto no cliente
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Inicializa os serviços de forma idempotente
auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

export { app, db, auth, storage };