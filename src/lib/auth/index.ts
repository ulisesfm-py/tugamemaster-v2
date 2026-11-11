import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import {
  consumirIntento,
  consumirIntentoDeIp,
  reiniciar,
} from '@/modules/limites/service';
import { REGLAS } from '@/modules/limites/politica';
import { loginSchema } from '@/modules/users/schema';
import { verificarCredenciales } from '@/modules/users/service';

import { crearAdaptador } from './adapter';
import { authConfig } from './config';

/**
 * Demasiados intentos de entrar. Es un error distinto del de "credenciales
 * invalidas" para que el formulario pueda decir que hay que esperar, y no que
 * la contrasena esta mal cuando quiza era la buena.
 */
export class DemasiadosIntentos extends CredentialsSignin {
  override code = 'demasiados_intentos';

  constructor(readonly reintentarEnSeg: number) {
    super();
  }
}

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
  adapter: crearAdaptador(),

  providers: [
    ...authConfig.providers,

    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contrasena', type: 'password' },
      },

      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // El limite va aqui y no en la accion del formulario porque esta
        // funcion tambien responde a quien llama directamente a
        // /api/auth/callback/credentials, sin pasar por ningun formulario.
        // Se cuenta el intento *antes* de comprobar la contrasena.
        const porIp = await consumirIntentoDeIp(REGLAS.loginIp, request.headers);
        const porCorreo = await consumirIntento(REGLAS.loginEmail, email);
        const bloqueo = [porIp, porCorreo].find((v) => !v.permitido);
        if (bloqueo) throw new DemasiadosIntentos(bloqueo.reintentarEnSeg);

        const usuario = await verificarCredenciales(email, password);

        // Devolver null hace que Auth.js responda "credenciales invalidas"
        // sin distinguir el motivo.
        if (!usuario) return null;

        // Quien acierta no gasta intentos: el contador es para los fallos.
        await reiniciar(REGLAS.loginEmail, email);

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.name,
          image: usuario.image,
          slug: usuario.slug,
          isAdmin: usuario.isAdmin,
        };
      },
    }),
  ],
});
