'use server';

import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';

import { DemasiadosIntentos, signIn, signOut } from '@/lib/auth';
import {
  guardarCodigoDeViaje,
  olvidarCodigoDeViaje,
} from '@/modules/invitaciones/cookie';
import { buscarCodigo } from '@/modules/invitaciones/service';
import { REGLAS, mensajeDeEspera } from '@/modules/limites/politica';
import { consumirIntentoDeIp } from '@/modules/limites/service';

import { registerSchema } from './schema';
import { registrarUsuario } from './service';

/**
 * Acciones de servidor de los formularios de acceso.
 *
 * Devuelven el mensaje de error en lugar de lanzarlo, para que el formulario
 * pueda mostrarlo conservando lo que el usuario habia escrito.
 */

export type EstadoFormulario = { error: string; enviado?: FormData } | null;

/**
 * Lo que puede volver al formulario cuando algo falla.
 *
 * **La contrasena no.** No tiene por que viajar de vuelta ni quedarse escrita
 * en el HTML de la pagina, y el navegador ya la rellena solo.
 */
function sinContrasena(formData: FormData): FormData {
  const eco = new FormData();

  for (const campo of ['name', 'email', 'codigo']) {
    const valor = formData.get(campo);
    if (typeof valor === 'string') eco.set(campo, valor);
  }

  return eco;
}

const DESTINO_TRAS_ENTRAR = '/dashboard';

export async function registrarAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    codigo: formData.get('codigo') ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisa los datos',
      enviado: sinContrasena(formData),
    };
  }

  // Cada alta cuesta un argon2, y una cuenta gratuita es todo lo que hace falta
  // para probar contrasenas de partidas privadas: se frena por IP.
  const cupo = await consumirIntentoDeIp(REGLAS.registroIp, await headers());
  if (!cupo.permitido) {
    return {
      error: mensajeDeEspera(cupo.reintentarEnSeg),
      enviado: sinContrasena(formData),
    };
  }

  const resultado = await registrarUsuario(parsed.data);

  if (!resultado.ok) {
    return { error: resultado.mensaje, enviado: sinContrasena(formData) };
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
    return { error: 'Rellena los dos campos', enviado: sinContrasena(formData) };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: DESTINO_TRAS_ENTRAR,
    });
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof DemasiadosIntentos) {
      return {
        error: mensajeDeEspera(error.reintentarEnSeg),
        enviado: sinContrasena(formData),
      };
    }

    if (error instanceof AuthError) {
      // Mensaje deliberadamente ambiguo: decir cual de los dos campos falla
      // permitiria averiguar que emails tienen cuenta.
      return {
        error: 'Email o contraseña incorrectos',
        enviado: sinContrasena(formData),
      };
    }

    throw error;
  }

  return null;
}

/**
 * Entrar o darse de alta con Discord.
 *
 * Si el formulario trae un codigo de fundador, se comprueba aqui, antes de
 * salir hacia Discord: a la vuelta ya no hay formulario en el que avisar de
 * que no valia. Si vale, viaja en una cookie de pocos minutos hasta que se
 * crea la cuenta (ver `invitaciones/cookie.ts`).
 *
 * Sin codigo se borra cualquiera que quedara de un intento anterior: quien
 * entra desde la pantalla de login no esta usando ningun codigo.
 */
export async function entrarConDiscordAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const codigo = String(formData.get('codigo') ?? '').trim();

  if (codigo) {
    const invitacion = await buscarCodigo(codigo);
    if (!invitacion.ok)
      return { error: invitacion.mensaje, enviado: sinContrasena(formData) };

    await guardarCodigoDeViaje(codigo);
  } else {
    await olvidarCodigoDeViaje();
  }

  await signIn('discord', { redirectTo: DESTINO_TRAS_ENTRAR });

  return null;
}

export async function salirAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
