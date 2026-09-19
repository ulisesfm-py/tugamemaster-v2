import * as Sentry from '@sentry/nextjs';

import { dsnServidor, OPCIONES_COMUNES } from '@/lib/observabilidad';

/**
 * Arranque de la instrumentacion del servidor.
 *
 * Next llama a `register` una sola vez por instancia, antes de atender la
 * primera peticion. Se inicializa Sentry aqui y no en un fichero de
 * configuracion aparte para que la condicion de "solo si hay DSN" viva en un
 * unico sitio.
 */
export function register(): void {
  const dsn = dsnServidor();
  if (!dsn) return;

  // El runtime edge y el de Node son procesos distintos y cada uno necesita su
  // propia inicializacion. El middleware corre en edge.
  if (
    process.env['NEXT_RUNTIME'] === 'nodejs' ||
    process.env['NEXT_RUNTIME'] === 'edge'
  ) {
    Sentry.init({ dsn, ...OPCIONES_COMUNES });
  }
}

/**
 * Errores que Next captura al renderizar o al atender una peticion.
 *
 * Sin DSN, `captureRequestError` no tiene cliente al que enviar y no hace
 * nada, pero se comprueba igualmente para no depender de ese detalle interno.
 */
export const onRequestError: typeof Sentry.captureRequestError = async (...args) => {
  if (!dsnServidor()) return;

  await Sentry.captureRequestError(...args);
};
