import 'server-only';

import { del, put } from '@vercel/blob';

import { TAMANO_MAXIMO_BYTES } from './subidas';

/**
 * Subida de imagenes a Vercel Blob.
 *
 * Lo comparten la foto de perfil y la portada de los articulos: las dos tienen
 * que comprobar lo mismo antes de guardar nada.
 */

/** Formatos admitidos, con los bytes que los identifican. */
const FORMATOS = [
  { mime: 'image/jpeg', ext: 'jpg', magia: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: 'png', magia: [0x89, 0x50, 0x4e, 0x47] },
  // WebP es "RIFF....WEBP": se comprueba la marca RIFF y, mas abajo, WEBP.
  { mime: 'image/webp', ext: 'webp', magia: [0x52, 0x49, 0x46, 0x46] },
] as const;

export type Formato = (typeof FORMATOS)[number];

export { TAMANO_MAXIMO_BYTES };

/** Dominio de nuestro almacenamiento, para no borrar imagenes ajenas. */
export const DOMINIO_BLOB = '.public.blob.vercel-storage.com';

/**
 * Identifica el formato real por los bytes de la cabecera.
 *
 * No basta con mirar `file.type`: ese dato lo manda el navegador y se puede
 * falsificar. Comprobar la cabecera evita guardar cualquier cosa disfrazada de
 * imagen.
 */
export function formatoDeImagen(bytes: Uint8Array): Formato | null {
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

export type ResultadoImagen = { ok: true; url: string } | { ok: false; mensaje: string };

/**
 * Valida y sube una imagen.
 *
 * `nombreBase` es la ruta sin extension dentro del almacenamiento; la
 * extension sale del formato detectado, no del nombre del fichero original.
 */
export async function subirImagen(
  nombreBase: string,
  file: File,
): Promise<ResultadoImagen> {
  if (file.size === 0) {
    return { ok: false, mensaje: 'No has elegido ninguna imagen' };
  }

  if (file.size > TAMANO_MAXIMO_BYTES) {
    return { ok: false, mensaje: 'La imagen no puede pasar de 2 MB' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const formato = formatoDeImagen(bytes);

  if (!formato) {
    return { ok: false, mensaje: 'Solo se admiten imagenes JPG, PNG o WebP' };
  }

  // `addRandomSuffix` evita que dos subidas choquen y que una URL antigua
  // quede apuntando a una imagen nueva por cache. Se sube el File tal cual,
  // pero con el contentType deducido de la cabecera, no con el que declara el
  // navegador.
  const subida = await put(`${nombreBase}.${formato.ext}`, file, {
    access: 'public',
    contentType: formato.mime,
    addRandomSuffix: true,
  });

  return { ok: true, url: subida.url };
}

/**
 * Borra una imagen solo si esta en nuestro almacenamiento.
 *
 * Una URL de fuera (el avatar de Discord, por ejemplo) es de su dueno y no se
 * toca. Si el borrado falla no se propaga: un fichero huerfano no justifica
 * deshacer un cambio que ya esta guardado.
 */
export async function borrarSiEsNuestra(url: string | null | undefined): Promise<void> {
  if (!url?.includes(DOMINIO_BLOB)) return;

  await del(url).catch(() => undefined);
}
