'use server';

import { revalidatePath } from 'next/cache';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';
import { exigirAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';

import { emitirCodigo, renovarCodigo } from './service';

/** Las paginas que ensenan el codigo, para refrescarlas tras cambiarlo. */
function refrescar(): void {
  revalidatePath('/dashboard');
  revalidatePath('/cuenta/cobros');
  revalidatePath('/admin/game-masters');
}

/* ── Lo que hace el propio game master ─────────────────────────────────── */

/**
 * El perfil de GM de quien esta conectado, con su codigo.
 *
 * El GM gestiona su enlace el solo: crearlo y alargarlo no cambia lo que paga
 * nadie mas, y no hace falta que un admin intervenga en cada renovacion.
 */
async function miPerfilDeGm(): Promise<
  | { ok: true; gmProfileId: string; inviteCode: string | null }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Tienes que iniciar sesión' };

  const gm = await db.gmProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, inviteCode: true },
  });

  if (!gm) return { ok: false, error: 'Primero crea tu perfil de game master' };

  return { ok: true, gmProfileId: gm.id, inviteCode: gm.inviteCode };
}

/** El GM pide su primer enlace. Si ya tiene uno, no se lo cambia. */
export async function crearMiCodigoAction(
  _previo: EstadoAccion,
  _formData: FormData,
): Promise<EstadoAccion> {
  const gm = await miPerfilDeGm();
  if (!gm.ok) return { error: gm.error };

  if (gm.inviteCode) return { ok: true, mensaje: 'Ya tienes tu enlace.' };

  await emitirCodigo(gm.gmProfileId);
  refrescar();

  return { ok: true, mensaje: 'Listo. Ya puedes compartir tu enlace.' };
}

/**
 * El GM alarga su codigo tres meses desde hoy, haya caducado o no.
 *
 * Conserva el mismo codigo: puede estar ya escrito en su bio o en su canal.
 */
export async function renovarMiCodigoAction(
  _previo: EstadoAccion,
  _formData: FormData,
): Promise<EstadoAccion> {
  const gm = await miPerfilDeGm();
  if (!gm.ok) return { error: gm.error };

  if (!gm.inviteCode) return { error: 'Todavía no tienes enlace' };

  await renovarCodigo(gm.gmProfileId);
  refrescar();

  return { ok: true, mensaje: 'Renovado tres meses desde hoy.' };
}

/* ── Lo que hace un admin ──────────────────────────────────────────────── */

/** El GM sobre el que actua un admin. */
async function gmDelFormulario(
  formData: FormData,
): Promise<{ ok: true; gmProfileId: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Tienes que iniciar sesión' };
  if (!(await exigirAdmin()))
    return { ok: false, error: 'Esto lo decide un administrador' };

  const gmProfileId = String(formData.get('gmProfileId') ?? '');

  const gm = await db.gmProfile.findUnique({
    where: { id: gmProfileId },
    select: { id: true },
  });

  if (!gm) return { ok: false, error: 'Ese game master no existe' };

  return { ok: true, gmProfileId };
}

export async function renovarCodigoAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const gm = await gmDelFormulario(formData);
  if (!gm.ok) return { error: gm.error };

  await renovarCodigo(gm.gmProfileId);
  refrescar();

  return { ok: true, mensaje: 'Renovado tres meses desde hoy.' };
}

/**
 * Para un codigo que se ha filtrado: el anterior deja de existir al momento.
 *
 * Solo lo hace un admin. Cambiarlo rompe el enlace que el GM tenga publicado,
 * y es mejor que eso pase hablando con el que con un clic por error.
 */
export async function nuevoCodigoAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const gm = await gmDelFormulario(formData);
  if (!gm.ok) return { error: gm.error };

  await emitirCodigo(gm.gmProfileId);
  refrescar();

  return { ok: true, mensaje: 'Código nuevo. El anterior ya no sirve.' };
}
