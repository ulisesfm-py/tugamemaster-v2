import type { DefaultSession } from 'next-auth';

/**
 * Campos propios de TuGameMaster que viajan en la sesion y en el token.
 *
 * Sin esta declaracion, `session.user.isAdmin` no existiria para TypeScript y
 * habria que recurrir a `any`, que el lint prohibe.
 */

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      slug: string;
      isAdmin: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    slug: string;
    isAdmin: boolean;
  }
}

// Se aumenta '@auth/core/jwt' y no 'next-auth/jwt': este ultimo es solo un
// `export * from '@auth/core/jwt'`, y aumentar un reexport no fusiona nada con
// la interfaz original.
declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    slug: string;
    isAdmin: boolean;
  }
}

// El adaptador devuelve usuarios con nuestros campos propios; sin esto,
// devolverlos desde createUser seria un error de tipos.
declare module 'next-auth/adapters' {
  interface AdapterUser {
    slug: string;
    isAdmin: boolean;
  }
}
