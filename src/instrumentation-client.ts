import * as Sentry from '@sentry/nextjs';

import { dsnNavegador, OPCIONES_COMUNES } from '@/lib/observabilidad';

/**
 * Instrumentacion del navegador.
 *
 * El DSN del cliente va en `NEXT_PUBLIC_SENTRY_DSN` porque tiene que viajar
 * en el paquete que se descarga el navegador. **Eso no lo convierte en un
 * secreto filtrado**: un DSN esta pensado para ser publico, solo sirve para
 * enviar eventos al proyecto y no da acceso a leer nada.
 *
 * No se activa Session Replay: graba lo que el usuario ve y escribe, y aqui
 * hay formularios de pago. Un error con su traza es suficiente.
 */
const dsn = dsnNavegador();

if (dsn) {
  Sentry.init({ dsn, ...OPCIONES_COMUNES });
}

/** Permite a Sentry seguir los cambios de ruta del App Router. */
export const onRouterTransitionStart = dsn
  ? Sentry.captureRouterTransitionStart
  : undefined;
