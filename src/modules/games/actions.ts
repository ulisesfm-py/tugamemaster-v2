'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';

import {
  actualizarPartida,
  cancelarPartida,
  crearPartida,
  despublicarPartida,
  publicarPartida,
} from './service';

export type EstadoPartida = EstadoAccion;

function datosDelFormulario(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? ''),
    system: String(formData.get('system') ?? ''),
    startsAt: String(formData.get('startsAt') ?? ''),
    durationHours: String(formData.get('durationHours') ?? ''),
    seatsTotal: String(formData.get('seatsTotal') ?? ''),
    priceCents: String(formData.get('price') ?? ''),
  };
}

export async function crearPartidaAction(
  _previo: EstadoPartida,
  formData: FormData,
): Promise<EstadoPartida> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesion' };

  const resultado = await crearPartida(session.user.id, datosDelFormulario(formData));

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/cuenta/partidas');
  redirect(`/cuenta/partidas/${resultado.gameId}`);
}

export async function actualizarPartidaAction(
  _previo: EstadoPartida,
  formData: FormData,
): Promise<EstadoPartida> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesion' };

  const gameId = String(formData.get('gameId') ?? '');

  const resultado = await actualizarPartida(
    session.user.id,
    gameId,
    datosDelFormulario(formData),
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/cuenta/partidas');
  revalidatePath(`/cuenta/partidas/${gameId}`);
  revalidatePath(`/partidas/${resultado.slug}`);
  revalidatePath('/partidas');

  return { ok: true };
}

/** Acciones de un solo boton: publicar, retirar y cancelar. */
async function accionSobrePartida(
  formData: FormData,
  operacion: (
    userId: string,
    gameId: string,
  ) => Promise<{ ok: boolean; mensaje?: string }>,
): Promise<EstadoPartida> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesion' };

  const gameId = String(formData.get('gameId') ?? '');
  const resultado = await operacion(session.user.id, gameId);

  if (!resultado.ok) return { error: resultado.mensaje ?? 'No se pudo completar' };

  revalidatePath('/cuenta/partidas');
  revalidatePath(`/cuenta/partidas/${gameId}`);
  revalidatePath('/partidas');

  return { ok: true };
}

export async function publicarPartidaAction(
  _previo: EstadoPartida,
  formData: FormData,
): Promise<EstadoPartida> {
  return accionSobrePartida(formData, publicarPartida);
}

export async function despublicarPartidaAction(
  _previo: EstadoPartida,
  formData: FormData,
): Promise<EstadoPartida> {
  return accionSobrePartida(formData, despublicarPartida);
}

export async function cancelarPartidaAction(
  _previo: EstadoPartida,
  formData: FormData,
): Promise<EstadoPartida> {
  return accionSobrePartida(formData, cancelarPartida);
}
