'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';

import { datosDeConvocatoria } from './schema';
import {
  actualizarConvocatoria,
  borrarPreReserva,
  cerrarConvocatoria,
  crearConvocatoria,
  preReservar,
  publicarConvocatoria,
  retirarConvocatoria,
  subirLaminaDeConvocatoria,
} from './service';

function refrescar(id: string): void {
  revalidatePath('/cuenta/partidas');
  revalidatePath(`/cuenta/partidas/flexibles/${id}`);
}

export async function crearConvocatoriaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await crearConvocatoria(
    session.user.id,
    datosDeConvocatoria(formData),
  );
  if (!resultado.ok) return { error: resultado.mensaje, enviado: formData };

  revalidatePath('/cuenta/partidas');
  redirect(`/cuenta/partidas/flexibles/${resultado.id}`);
}

export async function actualizarConvocatoriaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const id = String(formData.get('convocatoriaId') ?? '');
  const resultado = await actualizarConvocatoria(
    session.user.id,
    id,
    datosDeConvocatoria(formData),
  );
  if (!resultado.ok) return { error: resultado.mensaje, enviado: formData };

  refrescar(id);
  return { ok: true };
}

/** Acciones de un solo boton sobre una mesa: publicar, retirar y cerrar. */
async function sobreLaMesa(
  formData: FormData,
  operacion: (userId: string, id: string) => Promise<{ ok: boolean; mensaje?: string }>,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const id = String(formData.get('convocatoriaId') ?? '');
  const resultado = await operacion(session.user.id, id);
  if (!resultado.ok) return { error: resultado.mensaje ?? 'No se pudo completar' };

  refrescar(id);
  return { ok: true };
}

export async function publicarConvocatoriaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  return sobreLaMesa(formData, publicarConvocatoria);
}

export async function retirarConvocatoriaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  return sobreLaMesa(formData, retirarConvocatoria);
}

export async function cerrarConvocatoriaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  return sobreLaMesa(formData, (userId, id) => cerrarConvocatoria(userId, id));
}

/** Sube la lamina de una mesa. Un fallo se cuenta pero no se propaga. */
export async function subirLaminaDeConvocatoriaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const file = formData.get('lamina');
  if (!(file instanceof File)) return { error: 'No has elegido ninguna imagen' };

  const id = String(formData.get('convocatoriaId') ?? '');

  try {
    const resultado = await subirLaminaDeConvocatoria(session.user.id, id, file);
    if (!resultado.ok) return { error: resultado.mensaje };

    refrescar(id);
    return { ok: true, mensaje: 'Lámina actualizada.' };
  } catch (error) {
    console.error('Fallo al subir la lamina de la mesa flexible:', error);
    return { error: 'No se ha podido guardar la imagen. Inténtalo de nuevo.' };
  }
}

/* ── Lo que hace el jugador ─────────────────────────────────────────────── */

/** Pre-reservar o borrarse, desde la pagina publica de la mesa. */
async function comoJugador(
  formData: FormData,
  operacion: (userId: string, id: string) => Promise<{ ok: boolean; mensaje?: string }>,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Inicia sesión para pre-reservar' };

  const id = String(formData.get('convocatoriaId') ?? '');
  const resultado = await operacion(session.user.id, id);
  if (!resultado.ok) return { error: resultado.mensaje ?? 'No se pudo completar' };

  const slug = String(formData.get('slug') ?? '');
  if (slug) revalidatePath(`/mesas/${slug}`);
  revalidatePath('/partidas');
  revalidatePath('/');
  revalidatePath('/mis-reservas');
  refrescar(id);

  return { ok: true };
}

export async function preReservarAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  return comoJugador(formData, preReservar);
}

export async function borrarPreReservaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  return comoJugador(formData, borrarPreReserva);
}
