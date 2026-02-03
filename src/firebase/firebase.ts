
import { initializeApp, FirebaseApp, getApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, Firestore, terminate } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDcdnNBy0TZTsq_cI02KFVU9o7PJopEczM",
  authDomain: "studio-248448941-9c1c2.firebaseapp.com",
  projectId: "studio-248448941-9c1c2",
  storageBucket: "studio-248448941-9c1c2.firebasestorage.app",
  messagingSenderId: "341426752875",
  appId: "1:341426752875:web:348f88597e5b9b2057d02e",
};

// 🛡️ PROTOCOLO DE IMUTABILIDADE V56: Singleton Global Blindado
const g = globalThis as any;

// Inicialização do App com proteção contra múltiplas instâncias
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Inicialização do Firestore com configurações de rede Ultra-Estáveis
if (!g._firebaseDb) {
    try {
        /**
         * 🔌 CONFIGURAÇÃO DE REDE V56:
         * experimentalForceLongPolling + useFetchStreams: false
         * Esta combinação desativa o motor de streaming instável do browser
         * e força o protocolo de polling persistente, eliminando o erro ca9.
         */
        g._firebaseDb = initializeFirestore(app, {
            experimentalForceLongPolling: true,
            experimentalAutoDetectLongPolling: false,
            useFetchStreams: false,
        } as any);
    } catch (e) {
        // Fallback seguro se já houver uma instância ativa
        g._firebaseDb = getFirestore(app);
    }
}
const db: Firestore = g._firebaseDb;

// Inicialização segura dos demais serviços
if (!g._firebaseAuth) {
    g._firebaseAuth = getAuth(app);
}
const auth: Auth = g._firebaseAuth;

if (!g._firebaseStorage) {
    g._firebaseStorage = getStorage(app);
}
const storage: FirebaseStorage = g._firebaseStorage;

export { app, auth, db, storage };

/**
 * Função de inicialização exportada para garantir que o app
 * esteja disponível para os provedores de contexto.
 */
export function initializeFirebase(): FirebaseApp {
  return app;
}
