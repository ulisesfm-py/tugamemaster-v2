'use server';

import { revalidatePath } from 'next/cache';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';

import { dejarResena, editarResena } from './service';

/**
 * Revalida lo que muestra una resena: las reservas del jugador y el perfil
 * publico del GM, donde viven las estrellas y el listado.
 */
function revalidar(gmSlug: string) {
  revalidatePath('/mis-reservas');
  if (gmSlug) revalidatePath(`/gm/${gmSlug}`);
}

export async function dejarResenaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await dejarResena(
    String(formData.get('bookingId') ?? ''),
    session.user.id,
    { rating: formData.get('rating'), comment: formData.get('comment') },
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidar(String(formData.get('gmSlug') ?? ''));

  return { ok: true, mensaje: 'Gracias por valorar la partida.' };
}

export async function editarResenaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await editarResena(
    String(formData.get('reviewId') ?? ''),
    session.user.id,
    { rating: formData.get('rating'), comment: formData.get('comment') },
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidar(String(formData.get('gmSlug') ?? ''));

  return { ok: true, mensaje: 'Valoración actualizada.' };
}
