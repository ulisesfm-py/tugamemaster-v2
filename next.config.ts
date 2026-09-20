import { withSentryConfig } from '@sentry/nextjs/config';
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
      {
        // Portadas de los articulos del blog, en el mismo Blob store. Se
        // enumera aparte y no con un comodin: cada carpeta que se abre hay
        // que abrirla a proposito.
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/blog/**',
      },
      {
        // Laminas de las partidas, que suben los game masters.
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/partidas/**',
      },
    ],
  },
};

/**
 * Subir los mapas de fuentes exige credenciales de Sentry (`SENTRY_AUTH_TOKEN`,
 * organizacion y proyecto). Sin ellas se desactiva: el build tiene que
 * funcionar en un portatil recien clonado y en un CI sin secretos, y sin mapas
 * las trazas llegan minificadas pero llegan.
 */
const subirMapas = Boolean(
  process.env['SENTRY_AUTH_TOKEN'] &&
  process.env['SENTRY_ORG'] &&
  process.env['SENTRY_PROJECT'],
);

export default withSentryConfig(nextConfig, {
  org: process.env['SENTRY_ORG'],
  project: process.env['SENTRY_PROJECT'],

  // Sin esto, el plugin escribe en cada build avisos sobre lo que no puede
  // hacer por falta de credenciales.
  silent: true,

  sourcemaps: { disable: !subirMapas },
});
