import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { db } from '@/lib/db';
import { loginSchema } from '@/modules/users/schema';
import { verificarCredenciales } from '@/modules/users/service';

import { authConfig } from './config';

/**
 * Configuracion completa de Auth.js, para el runtime de Node.
 *
 * Anade a la configuracion compartida lo que no puede correr en edge: el
 * adaptador de Prisma y el proveedor de credenciales (que necesita argon2).
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // El adaptador da de alta al usuario y enlaza su cuenta de Discord. Con
  // sesiones JWT no se usa la tabla Session, pero si User y Account.
  adapter: PrismaAdapter(db),

  providers: [
    ...authConfig.providers,

    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contrasena', type: 'password' },
      },

      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const usuario = await verificarCredenciales(
          parsed.data.email,
          parsed.data.password,
        );

        // Devolver null hace que Auth.js responda "credenciales invalidas"
        // sin distinguir el motivo.
        if (!usuario) return null;

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.name,
          image: usuario.avatarUrl,
          slug: usuario.slug,
          isAdmin: usuario.isAdmin,
        };
      },
    }),
  ],
});
