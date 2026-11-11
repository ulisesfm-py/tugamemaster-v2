'use server';

import { revalidatePath } from 'next/cache';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';
import { exigirAdmin } from '@/lib/auth/admin';

import {
  denunciarMensaje,
  descartarDenuncia,
  escribirMensaje,
  marcarLeido,
  retirarMensaje,
  vaciarHilo,
} from './service';

/**
 * Acciones del hilo de mesa.
 *
 * Cada una vuelve a comprobar quien llama. Una accion de servidor es un
 * endpoint por si misma: que la pagina ya haya decidido quien entra no impide
 * que alguien la invoque por su cuenta.
 */

function revalidar(slug: string) {
  if (slug) revalidatePath(`/partidas/${slug}/hilo`);
}

export async function escribirMensajeAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await escribirMensaje(
    String(formData.get('gameId') ?? ''),
    session.user.id,
    { body: formData.get('body') },
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidar(String(formData.get('slug') ?? ''));

  return { ok: true };
}

export async function retirarMensajeAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await retirarMensaje(String(formData.get('messageId') ?? ''), {
    id: session.user.id,
    esAdmin: (await exigirAdmin()) !== null,
  });

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidar(String(formData.get('slug') ?? ''));
  revalidatePath('/admin/hilos');

  return { ok: true, mensaje: 'Mensaje retirado.' };
}

export async function denunciarMensajeAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await denunciarMensaje(
    String(formData.get('messageId') ?? ''),
    session.user.id,
    { reason: formData.get('reason') },
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidar(String(formData.get('slug') ?? ''));
  revalidatePath('/admin/hilos');

  return { ok: true, mensaje: 'Lo revisará un administrador.' };
}

export async function descartarDenunciaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await descartarDenuncia(String(formData.get('messageId') ?? ''), {
    esAdmin: (await exigirAdmin()) !== null,
  });

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/admin/hilos');

  return { ok: true, mensaje: 'Denuncia descartada.' };
}

export async function vaciarHiloAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await vaciarHilo(
    String(formData.get('gameId') ?? ''),
    session.user.id,
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidar(String(formData.get('slug') ?? ''));

  return { ok: true, mensaje: 'Hilo vaciado.' };
}

/**
 * Marcar el hilo como leido.
 *
 * La llama el hilo al abrirse, y no la pagina al renderizarse: escribir
 * mientras se pinta dejaria la marca puesta tambien cuando la pagina se
 * regenera sola.
 */
export async function marcarLeidoAction(gameId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  // Sin comprobar acceso a proposito: una marca de lectura de alguien que no
  // esta en la mesa no enseña nada ni da acceso a nada.
  await marcarLeido(gameId, session.user.id);
}
