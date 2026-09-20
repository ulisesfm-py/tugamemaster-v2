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
  subirLamina,
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
    // Casillas: `getAll` porque el formulario manda una entrada por marcada y
    // ninguna cuando no hay ninguna.
    languages: formData.getAll('languages').map(String),
    tags: formData.getAll('tags').map(String),
    experience: String(formData.get('experience') ?? ''),
    minAge: String(formData.get('minAge') ?? ''),
  };
}

export async function crearPartidaAction(
  _previo: EstadoPartida,
  formData: FormData,
): Promise<EstadoPartida> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

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
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

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
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const gameId = String(formData.get('gameId') ?? '');
  const resultado = await operacion(session.user.id, gameId);

  if (!resultado.ok) return { error: resultado.mensaje ?? 'No se pudo completar' };

  revalidatePath('/cuenta/partidas');
  revalidatePath(`/cuenta/partidas/${gameId}`);
  revalidatePath('/partidas');

  // Y la pagina publica de la partida, que es donde se anuncia que ha quedado
  // cancelada o retirada. Sin esto se seguia sirviendo la version anterior.
  const slug = String(formData.get('slug') ?? '');
  if (slug) revalidatePath(`/partidas/${slug}`);

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

/**
 * Sube la lamina de una partida.
 *
 * Va en su propia accion, y no dentro del formulario, porque la imagen se
 * guarda bajo el id de la partida: hasta que no existe, no hay donde ponerla.
 *
 * Un fallo de la subida se registra y se cuenta, pero no se propaga: la
 * partida ya esta guardada y no tiene por que perderse por una imagen.
 */
export async function subirLaminaAction(
  _previo: EstadoPartida,
  formData: FormData,
): Promise<EstadoPartida> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const file = formData.get('lamina');
  if (!(file instanceof File)) return { error: 'No has elegido ninguna imagen' };

  const gameId = String(formData.get('gameId') ?? '');
  const slug = String(formData.get('slug') ?? '');

  try {
    const resultado = await subirLamina(session.user.id, gameId, file);
    if (!resultado.ok) return { error: resultado.mensaje };

    revalidatePath('/cuenta/partidas');
    revalidatePath(`/cuenta/partidas/${gameId}`);
    revalidatePath('/partidas');
    revalidatePath('/');
    if (slug) revalidatePath(`/partidas/${slug}`);

    return { ok: true, mensaje: 'Lamina actualizada.' };
  } catch (error) {
    console.error('Fallo al subir la lamina de la partida:', error);
    return { error: 'No se ha podido guardar la imagen. Intentalo de nuevo.' };
  }
}
