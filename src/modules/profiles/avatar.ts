import 'server-only';

import { del, put } from '@vercel/blob';

import { db } from '@/lib/db';

/**
 * Subida y borrado de la foto de perfil.
 */

/** Formatos admitidos, con sus bytes de cabecera. */
const FORMATOS = [
  { mime: 'image/jpeg', ext: 'jpg', magia: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: 'png', magia: [0x89, 0x50, 0x4e, 0x47] },
  // WebP es "RIFF....WEBP": se comprueba la marca RIFF y, mas abajo, WEBP.
  { mime: 'image/webp', ext: 'webp', magia: [0x52, 0x49, 0x46, 0x46] },
] as const;

export const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;

/** Dominio de nuestro almacenamiento, para no borrar imagenes ajenas. */
const DOMINIO_BLOB = '.public.blob.vercel-storage.com';

export type ResultadoAvatar = { ok: true; url: string } | { ok: false; mensaje: string };

/**
 * Identifica el formato real por los bytes de la cabecera.
 *
 * No basta con mirar `file.type`: ese dato lo manda el navegador y se puede
 * falsificar. Comprobar la cabecera evita guardar cualquier cosa disfrazada de
 * imagen.
 */
function formatoReal(bytes: Uint8Array): (typeof FORMATOS)[number] | null {
  for (const formato of FORMATOS) {
    const coincide = formato.magia.every((b, i) => bytes[i] === b);
    if (!coincide) continue;

    if (formato.mime === 'image/webp') {
      // Bytes 8-11 deben decir "WEBP".
      const marca = String.fromCharCode(...bytes.slice(8, 12));
      if (marca !== 'WEBP') continue;
    }

    return formato;
  }

  return null;
}

export async function subirAvatar(userId: string, file: File): Promise<ResultadoAvatar> {
  if (file.size === 0) {
    return { ok: false, mensaje: 'No has elegido ninguna imagen' };
  }

  if (file.size > TAMANO_MAXIMO_BYTES) {
    return { ok: false, mensaje: 'La imagen no puede pasar de 2 MB' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const formato = formatoReal(bytes);

  if (!formato) {
    return { ok: false, mensaje: 'Solo se admiten imagenes JPG, PNG o WebP' };
  }

  const anterior = await db.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  // `addRandomSuffix` evita que dos subidas del mismo usuario choquen y que
  // una URL antigua quede apuntando a una imagen nueva por cache.
  // Se sube el File tal cual, pero con el contentType que hemos deducido de
  // la cabecera, no con el que declara el navegador.
  const subida = await put(`avatares/${userId}.${formato.ext}`, file, {
    access: 'public',
    contentType: formato.mime,
    addRandomSuffix: true,
  });

  await db.user.update({ where: { id: userId }, data: { image: subida.url } });

  // Borra la anterior solo si era nuestra: la de Discord es suya y no se toca.
  if (anterior?.image?.includes(DOMINIO_BLOB)) {
    // Si el borrado falla, el perfil ya esta actualizado: no tiene sentido
    // deshacerlo por un fichero huerfano.
    await del(anterior.image).catch(() => undefined);
  }

  return { ok: true, url: subida.url };
}

export async function quitarAvatar(userId: string): Promise<ResultadoAvatar> {
  const actual = await db.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  if (!actual?.image) return { ok: false, mensaje: 'No tienes foto que quitar' };

  await db.user.update({ where: { id: userId }, data: { image: null } });

  if (actual.image.includes(DOMINIO_BLOB)) {
    await del(actual.image).catch(() => undefined);
  }

  return { ok: true, url: '' };
}
