import { MetadataRoute } from 'next';

/**
 * 🚀 MANIFESTO LK RAMOS
 * Tornei o manifesto estático para garantir que o build do Next.js passe sem erros.
 * Consultas ao banco de dados durante o build podem causar falhas na publicação.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LK RAMOS',
    short_name: 'LK RAMOS',
    description: 'Gestão de Propostas de Alta Performance',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2a4a7f',
    icons: [
      {
        src: 'https://picsum.photos/seed/lk-pwa-192/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: 'https://picsum.photos/seed/lk-pwa-512/512/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
