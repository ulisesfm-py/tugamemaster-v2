'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';
import { datosDelFormulario } from '@/modules/games/schema';

import { crearContinuacion, guardarNota } from './service';

export async function guardarNotaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const gameId = String(formData.get('gameId') ?? '');

  const resultado = await guardarNota(session.user.id, gameId, {
    content: formData.get('content'),
  });

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath(`/cuenta/partidas/${gameId}`);
  revalidatePath('/mis-reservas');

  return { ok: true, mensaje: 'Nota guardada. La verán quienes jugaron la sesión.' };
}

export async function crearContinuacionAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await crearContinuacion(
    session.user.id,
    String(formData.get('gameId') ?? ''),
    { ...datosDelFormulario(formData), campaignSummary: formData.get('campaignSummary') },
  );

  if (!resultado.ok) return { error: resultado.mensaje, enviado: formData };

  revalidatePath('/cuenta/partidas');

  // La nueva sesion nace en borrador: se lleva al GM a su pagina para que la
  // revise y la publique.
  redirect(`/cuenta/partidas/${resultado.gameId}`);
}
