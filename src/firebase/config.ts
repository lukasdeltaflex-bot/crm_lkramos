/**
 * Configuração do Firebase LK RAMOS.
 * Centraliza as variáveis de ambiente e fornece tratamento de strings para o Storage.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  // Remove prefixos gs:// ou barras finais que causam erro de conexão no Storage
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "")
    .replace("gs://", "")
    .replace(/\/$/, ""),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};
