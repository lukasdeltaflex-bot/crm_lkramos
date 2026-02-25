/**
 * Configuração do Firebase LK RAMOS.
 * Centraliza as variáveis de ambiente e fornece tratamento de strings para o Storage.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-248448941-9c1c2",
  // 🛡️ BLINDAGEM NUCLEAR V15: Fallback para o bucket padrão se o env falhar.
  // O erro 404 no terminal indica que o bucket real quase certamente termina em .appspot.com
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-248448941-9c1c2.appspot.com")
    .replace("gs://", "")
    .replace(/\/$/, ""),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};