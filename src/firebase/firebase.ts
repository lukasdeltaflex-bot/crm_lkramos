'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

/**
 * 🛠️ INFRAESTRUTURA V67 (FINAL - STORAGE FIXED)
 * Isolamento total de SSR e inicialização garantida apenas no Browser.
 */

let app;
let db: any = null;
let auth: any = null;
let storage: any = null;

if (typeof window !== "undefined") {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Singleton Firestore Estabilizado
    const g = globalThis as any;
    if (!g._firebaseDb) {
        g._firebaseDb = initializeFirestore(app, {
            experimentalForceLongPolling: true,
            useFetchStreams: false,
        });
    }
    db = g._firebaseDb;
    auth = getAuth(app);
    
    // Singleton Storage Estabilizado
    if (!g._firebaseStorage) {
        g._firebaseStorage = getStorage(app);
    }
    storage = g._firebaseStorage;
}

export { db, auth, storage };

export function initializeFirebase() {
  if (typeof window !== "undefined") {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return null;
}
