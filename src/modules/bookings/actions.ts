'use server';

import { revalidatePath } from 'next/cache';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';

import { cancelarReserva, reservarAsiento } from './service';

export type EstadoReserva = EstadoAccion;

export async function reservarAction(
  _previo: EstadoReserva,
  formData: FormData,
): Promise<EstadoReserva> {
  const session = await auth();
  if (!session?.user) return { error: 'Inicia sesion para reservar' };

  const gameId = String(formData.get('gameId') ?? '');
  const slug = String(formData.get('slug') ?? '');

  const resultado = await reservarAsiento(gameId, session.user.id);

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath(`/partidas/${slug}`);
  revalidatePath('/partidas');
  revalidatePath('/mis-reservas');

  return { ok: true, mensaje: 'Plaza reservada.' };
}

export async function cancelarReservaAction(
  _previo: EstadoReserva,
  formData: FormData,
): Promise<EstadoReserva> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesion' };

  const resultado = await cancelarReserva(
    String(formData.get('bookingId') ?? ''),
    session.user.id,
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/mis-reservas');
  revalidatePath('/partidas');

  const slug = String(formData.get('slug') ?? '');
  if (slug) revalidatePath(`/partidas/${slug}`);

  return { ok: true, mensaje: 'Reserva cancelada.' };
}
