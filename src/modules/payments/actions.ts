'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { unstable_rethrow } from 'next/navigation';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';

import { enlaceDeAlta, estadoGuardado, sincronizarCuenta } from './connect';

/**
 * Acciones del alta de cobros.
 */

export async function empezarAltaAction(
  _previo: EstadoAccion,
  _formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  let destino: string;

  try {
    const resultado = await enlaceDeAlta(session.user.id);
    if (!resultado.ok) return { error: resultado.mensaje };
    destino = resultado.url;
  } catch (error) {
    unstable_rethrow(error);
    console.error('No se pudo crear el enlace de alta de Stripe:', error);
    return {
      error: 'No hemos podido conectar con Stripe. Intentalo de nuevo en un momento.',
    };
  }

  // El enlace apunta a stripe.com, fuera de la aplicacion.
  redirect(destino);
}

/**
 * Relee el estado en Stripe.
 *
 * Se usa al volver del formulario de alta: el webhook es la fuente de verdad,
 * pero puede tardar unos segundos y el GM estaria mirando una pagina que dice
 * que le falta algo ya resuelto.
 */
export async function refrescarEstadoAction(
  _previo: EstadoAccion,
  _formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const guardado = await estadoGuardado(session.user.id);

  if (!guardado?.stripeAccountId) {
    return { error: 'Todavía no has empezado el alta' };
  }

  try {
    await sincronizarCuenta(guardado.stripeAccountId);
  } catch (error) {
    unstable_rethrow(error);
    console.error('No se pudo consultar el estado en Stripe:', error);
    return { error: 'No hemos podido consultar tu estado en Stripe.' };
  }

  revalidatePath('/cuenta/cobros');
  revalidatePath('/cuenta/partidas');

  return { ok: true, mensaje: 'Estado actualizado.' };
}
