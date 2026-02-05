'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

/**
 * 🛠️ INFRAESTRUTURA DE DADOS LK RAMOS
 * Centraliza a inicialização dos serviços garantindo estabilidade no Browser.
 */

let app;
let db: any = null;
let auth: any = null;
let storage: any = null;

if (typeof window !== "undefined") {
    try {
        // Inicializa o App se necessário
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        
        // Inicializa instâncias de serviço
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);
        
        // Log de sanidade (apenas em dev ou quando houver erro)
        if (!firebaseConfig.storageBucket) {
            console.error("LK RAMOS AVISO: O campo 'storageBucket' está vazio no seu arquivo config.ts. Os uploads não funcionarão sem ele.");
        }
    } catch (error) {
        console.error("Falha crítica ao inicializar Firebase:", error);
    }
}

export { db, auth, storage };

export function initializeFirebase() {
  if (typeof window !== "undefined") {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return null;
}
