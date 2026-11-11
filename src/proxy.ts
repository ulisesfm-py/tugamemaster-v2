import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';

import { authConfig } from '@/lib/auth/config';
import { CABECERA_CSP, construirCsp, nuevoNonce } from '@/lib/cabeceras';

/**
 * Proxy de Next (antes "middleware"). Hace dos cosas en cada pagina:
 *
 * 1. Protege las rutas privadas segun el callback `authorized` de la
 *    configuracion compartida. Es una primera barrera optimista; cada pagina
 *    y cada accion de servidor vuelve a comprobarlo por su cuenta.
 * 2. Genera el nonce de la CSP y lo deja donde Next lo busca para aplicarlo a
 *    sus propios scripts.
 *
 * Usa la configuracion *edge-safe* a proposito: se ejecuta en cada peticion y
 * no puede cargar Prisma ni argon2.
 */
const { auth } = NextAuth(authConfig);

// Auth.js llama a `authorized` antes que a esta funcion: si la peticion no
// esta autorizada, responde con la redireccion y aqui no se llega.
export default auth((request) => {
  const nonce = nuevoNonce();
  const csp = construirCsp(nonce, process.env.NODE_ENV === 'development');

  // Next lee el nonce de la CSP de la *peticion*, no de la respuesta.
  const cabeceras = new Headers(request.headers);
  cabeceras.set('x-nonce', nonce);
  cabeceras.set(CABECERA_CSP, csp);

  const respuesta = NextResponse.next({ request: { headers: cabeceras } });
  respuesta.headers.set(CABECERA_CSP, csp);

  return respuesta;
});

export const config = {
  // Todo menos los endpoints (`/api`: Auth.js, webhooks y cron no son paginas),
  // los ficheros estaticos de Next y cualquier ruta con un punto (imagenes,
  // iconos). El punto va como `[.]` y no como `\.`: dentro de un string de JS
  // `\.` es solo un punto, la expresion pasaba a excluir todas las rutas menos
  // `/` y este proxy dejo de ejecutarse en las demas sin que nada lo avisara.
  matcher: ['/((?!api/|_next/static|_next/image|.*[.].*).*)'],
};
