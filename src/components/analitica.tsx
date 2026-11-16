'use client';

import { Analytics } from '@vercel/analytics/next';

import { urlParaMedir } from '@/lib/analitica';

/**
 * Cuenta las visitas con Vercel Web Analytics: sin cookies, sin identificar a
 * nadie. Es un componente de cliente porque `beforeSend` es una funcion y no
 * puede cruzar de servidor a cliente como propiedad.
 *
 * Que se mide y que no, en `src/lib/analitica.ts`.
 */
export function Analitica() {
  return (
    <Analytics
      beforeSend={(evento) => {
        const url = urlParaMedir(evento.url);
        return url === null ? null : { ...evento, url };
      }}
    />
  );
}
