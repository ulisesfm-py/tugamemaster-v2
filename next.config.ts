import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Avatares que sirve Discord tras el login OAuth. Cualquier otro origen
    // se bloquea: next/image no debe poder usarse como proxy de imagenes
    // arbitrarias de internet.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/avatars/**',
      },
      {
        // Avatares que suben los propios usuarios a nuestro Blob store.
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/avatares/**',
      },
    ],
  },
};

export default nextConfig;
