import 'server-only';

import { db } from '@/lib/db';
import { borrarSiEsNuestra, subirImagen, TAMANO_MAXIMO_BYTES } from '@/lib/imagen';

/**
 * Subida y borrado de la foto de perfil.
 *
 * La validacion y la subida en si viven en `lib/imagen`, compartidas con las
 * portadas del blog. Aqui queda lo propio del perfil: a quien pertenece la
 * imagen y que se hace con la anterior.
 */

export { TAMANO_MAXIMO_BYTES };

export type ResultadoAvatar = { ok: true; url: string } | { ok: false; mensaje: string };

export async function subirAvatar(userId: string, file: File): Promise<ResultadoAvatar> {
  const anterior = await db.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  const subida = await subirImagen(`avatares/${userId}`, file);
  if (!subida.ok) return subida;

  await db.user.update({ where: { id: userId }, data: { image: subida.url } });

  // Borra la anterior solo si era nuestra: la de Discord es suya y no se toca.
  await borrarSiEsNuestra(anterior?.image);

  return { ok: true, url: subida.url };
}

export async function quitarAvatar(userId: string): Promise<ResultadoAvatar> {
  const actual = await db.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  if (!actual?.image) return { ok: false, mensaje: 'No tienes foto que quitar' };

  await db.user.update({ where: { id: userId }, data: { image: null } });

  await borrarSiEsNuestra(actual.image);

  return { ok: true, url: '' };
}
