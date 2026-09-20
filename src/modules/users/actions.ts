'use server';

import { AuthError } from 'next-auth';
import { unstable_rethrow } from 'next/navigation';

import { signIn, signOut } from '@/lib/auth';

import { registerSchema } from './schema';
import { registrarUsuario } from './service';

/**
 * Acciones de servidor de los formularios de acceso.
 *
 * Devuelven el mensaje de error en lugar de lanzarlo, para que el formulario
 * pueda mostrarlo conservando lo que el usuario habia escrito.
 */

export type EstadoFormulario = { error: string } | null;

const DESTINO_TRAS_ENTRAR = '/dashboard';

export async function registrarAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' };
  }

  const resultado = await registrarUsuario(parsed.data);

  if (!resultado.ok) {
    return { error: resultado.mensaje };
  }

  // Alta correcta: se inicia sesion directamente, sin pedir las credenciales
  // que el usuario acaba de escribir.
  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: DESTINO_TRAS_ENTRAR,
    });
  } catch (error) {
    // signIn provoca una redireccion lanzando una excepcion interna de Next;
    // unstable_rethrow la deja pasar (es lo que hace que la redireccion
    // ocurra) y solo devuelve el control si el error es de otro tipo.
    unstable_rethrow(error);

    return {
      error: 'Tu cuenta se creó, pero no pudimos iniciar sesión. Prueba a entrar.',
    };
  }

  return null;
}

export async function entrarAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'Rellena los dos campos' };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: DESTINO_TRAS_ENTRAR,
    });
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof AuthError) {
      // Mensaje deliberadamente ambiguo: decir cual de los dos campos falla
      // permitiria averiguar que emails tienen cuenta.
      return { error: 'Email o contraseña incorrectos' };
    }

    throw error;
  }

  return null;
}

export async function entrarConDiscordAction(): Promise<void> {
  await signIn('discord', { redirectTo: DESTINO_TRAS_ENTRAR });
}

export async function salirAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
