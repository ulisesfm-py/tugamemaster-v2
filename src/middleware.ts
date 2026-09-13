import NextAuth from 'next-auth';

import { authConfig } from '@/lib/auth/config';

/**
 * Protege las rutas privadas segun el callback `authorized` de la
 * configuracion compartida.
 *
 * Usa la configuracion *edge-safe* a proposito: el middleware se ejecuta en
 * cada peticion y no puede cargar Prisma ni argon2.
 */
const { auth } = NextAuth(authConfig);

// Export por defecto y no desestructurado: Next analiza este fichero de forma
// estatica y necesita reconocer una funcion exportada.
export default auth;

export const config = {
  // Excluye ficheros estaticos y los propios endpoints de Auth.js.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\..*).*)'],
};
