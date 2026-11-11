/**
 * Limites de las imagenes que suben los usuarios.
 *
 * Fichero puro, sin `server-only`: lo leen el formulario (navegador), el
 * servidor (`lib/imagen.ts`) y `next.config.ts`, y los tres tienen que decir lo
 * mismo.
 */

/** Lo que puede pesar una imagen. */
export const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;

/**
 * Lo que Next deja pasar en el cuerpo de una Server Action.
 *
 * Por defecto son **1 MB**, y no es nuestro limite: una imagen de entre 1 y 2
 * MB cumple las reglas de la web, pero Next la rechazaba antes de que la
 * accion llegara a ejecutarse, con un 500 sin explicacion. El cuerpo es la
 * imagen mas lo que anade `multipart/form-data` (campos, separadores, nombres:
 * Next recomienda dejar entre 10 y 20 KB), asi que se deja medio megabyte de
 * margen. Vercel admite hasta 4,5 MB por peticion, de sobra.
 */
export const LIMITE_DE_CUERPO_BYTES = TAMANO_MAXIMO_BYTES + 512 * 1024;
