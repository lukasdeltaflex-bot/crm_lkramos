
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // ❗ DESATIVADO: Strict Mode duplica listeners e causa erro ca9 no Firebase
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Otimização para Firebase App Hosting (Docker/Cloud Run)
  output: 'standalone',
  experimental: {
    allowedDevOrigins: [
      '*.cloudworkstations.dev',
      '*.firebaseapp.com',
      '*.web.app',
      'localhost:*'
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
};

export default nextConfig;
