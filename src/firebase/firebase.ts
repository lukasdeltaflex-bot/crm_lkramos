'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

/**
 * 🛠️ NÚCLEO DE INFRAESTRUTURA LK RAMOS
 * Restaurado 'use client' conforme diretrizes críticas para garantir
 * que o SDK seja inicializado apenas no contexto do navegador.
 */

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

export { app, db, auth, storage };