import { MetadataRoute } from 'next';
import { db } from '@/firebase/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';

/**
 * 🚀 MANIFESTO DINÂMICO LK RAMOS
 * Gera o arquivo manifest do PWA em tempo real, permitindo a troca do ícone pelo painel.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let customIconURL = null;

  // Tentativa de buscar a primeira configuração de branding disponível no Firestore
  // Em um sistema multi-usuário, o ideal seria uma configuração global ou cookies de sessão.
  try {
    if (db) {
        const settingsSnap = await getDocs(query(collection(db, 'userSettings'), limit(1)));
        if (!settingsSnap.empty) {
            const data = settingsSnap.docs[0].data();
            customIconURL = data.pwaIconURL || null;
        }
    }
  } catch (e) {
    console.warn("🛡️ PWA Manifest: Falha ao carregar ícone customizado. Usando padrão.");
  }

  // Fallback para ícone padrão se não houver customizado
  const defaultIcons = [
    {
      src: 'https://picsum.photos/seed/lk-pwa-192/192/192',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: 'https://picsum.photos/seed/lk-pwa-512/512/512',
      sizes: '512x512',
      type: 'image/png',
    },
  ];

  const icons = customIconURL ? [
    {
      src: customIconURL,
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable' as any,
    },
    {
      src: customIconURL,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable' as any,
    }
  ] : defaultIcons;

  return {
    name: 'LK RAMOS',
    short_name: 'LK RAMOS',
    description: 'Gestão de Propostas de Alta Performance',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2a4a7f',
    icons: icons,
  };
}
