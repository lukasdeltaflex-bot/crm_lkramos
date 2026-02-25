'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

/**
 * 🛠️ INFRAESTRUTURA DE DADOS LK RAMOS
 * Centraliza a inicialização dos serviços garantindo estabilidade no Browser.
 */

let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== "undefined") {
    try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        auth = getAuth(app);
        
        // Inicialização explícita com a URL do bucket para evitar falhas de "default bucket"
        const bucketUrl = firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined;
        storage = getStorage(app, bucketUrl);
        
        console.log("💎 LK RAMOS: Núcleo Firebase inicializado.", {
            bucket: firebaseConfig.storageBucket || "PENDENTE"
        });
    } catch (error) {
        console.error("❌ Falha crítica ao inicializar Firebase:", error);
    }
}

export { db, auth, storage };

export function initializeFirebase(): FirebaseApp | null {
  if (typeof window !== "undefined") {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return null;
}
