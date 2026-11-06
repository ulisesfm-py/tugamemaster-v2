'use server';

import { revalidatePath } from 'next/cache';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

import { emitirCodigo, renovarCodigo } from './service';

/**
 * Lo que un admin puede hacer con el codigo de un fundador.
 *
 * Solo sobre fundadores: a un GM estandar no se le emite codigo, porque no
 * tiene a quien aplicarselo.
 */
async function fundadorDelFormulario(
  formData: FormData,
): Promise<{ ok: true; gmProfileId: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Tienes que iniciar sesión' };
  if (!session.user.isAdmin)
    return { ok: false, error: 'Esto lo decide un administrador' };

  const gmProfileId = String(formData.get('gmProfileId') ?? '');

  const gm = await db.gmProfile.findUnique({
    where: { id: gmProfileId },
    select: { plan: true },
  });

  if (!gm) return { ok: false, error: 'Ese game master no existe' };
  if (gm.plan !== 'FUNDADOR')
    return { ok: false, error: 'Solo los fundadores tienen código' };

  return { ok: true, gmProfileId };
}

export async function renovarCodigoAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const fundador = await fundadorDelFormulario(formData);
  if (!fundador.ok) return { error: fundador.error };

  await renovarCodigo(fundador.gmProfileId);
  revalidatePath('/admin/game-masters');

  return { ok: true, mensaje: 'Renovado tres meses desde hoy.' };
}

/** Para un codigo que se ha filtrado: el anterior deja de existir al momento. */
export async function nuevoCodigoAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const fundador = await fundadorDelFormulario(formData);
  if (!fundador.ok) return { error: fundador.error };

  await emitirCodigo(fundador.gmProfileId);
  revalidatePath('/admin/game-masters');

  return { ok: true, mensaje: 'Código nuevo. El anterior ya no sirve.' };
}
