import Discord from 'next-auth/providers/discord';
import type { NextAuthConfig } from 'next-auth';

/**
 * Configuracion de Auth.js *sin* dependencias de Node.
 *
 * El middleware se ejecuta en el runtime edge, donde no existen ni Prisma ni
 * argon2. Por eso la configuracion esta partida: aqui va lo que el middleware
 * necesita para leer la sesion, y en `./index.ts` se le anaden el adaptador de
 * base de datos y el proveedor de credenciales.
 *
 * Ver https://authjs.dev/guides/edge-compatibility
 */

/** Rutas que exigen sesion iniciada. */
const RUTAS_PRIVADAS = ['/dashboard', '/mis-partidas', '/mis-reservas', '/cuenta'];

/** Rutas reservadas a administradores. */
const RUTAS_ADMIN = ['/admin'];

export const authConfig = {
  // Sesion en JWT y no en base de datos: el proveedor de credenciales de
  // Auth.js no admite sesiones de base de datos. Es una limitacion conocida
  // de la libreria, no una preferencia.
  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  // Necesario detras del proxy de Vercel para que Auth.js confie en la
  // cabecera Host al construir las URLs de callback.
  trustHost: true,

  providers: [
    // Discord solo se registra si hay credenciales. Sin ellas la aplicacion
    // funciona igual, simplemente no se ofrece ese boton.
    ...(process.env['AUTH_DISCORD_ID'] && process.env['AUTH_DISCORD_SECRET']
      ? [
          Discord({
            clientId: process.env['AUTH_DISCORD_ID'],
            clientSecret: process.env['AUTH_DISCORD_SECRET'],
            // Discord devuelve su emisor (`iss`) en la vuelta del login, y
            // Auth.js lo compara con el del proveedor. El de Discord no trae
            // ninguno y Auth.js usa uno de relleno (`https://authjs.dev`), asi
            // que rechazaba todas las entradas con `error=Configuration`. Es
            // el que publica Discord en /.well-known/openid-configuration.
            issuer: 'https://discord.com',
            // Solo identidad basica: ningun permiso sobre servidores o
            // mensajes (ver CLAUDE.md).
            authorization: { params: { scope: 'identify email' } },
          }),
        ]
      : []),
  ],

  callbacks: {
    /** Decide si una peticion puede continuar. Lo usa el middleware. */
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const usuario = auth?.user;

      if (RUTAS_ADMIN.some((r) => pathname.startsWith(r))) {
        return Boolean(usuario?.isAdmin);
      }

      if (RUTAS_PRIVADAS.some((r) => pathname.startsWith(r))) {
        return Boolean(usuario);
      }

      return true;
    },

    /**
     * Vuelca en el token los datos que la aplicacion consulta en cada peticion.
     * Solo se rellenan al iniciar sesion; despues el token viaja ya formado.
     */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.slug = user.slug;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id;
      session.user.slug = token.slug;
      session.user.isAdmin = token.isAdmin;
      return session;
    },
  },
} satisfies NextAuthConfig;
