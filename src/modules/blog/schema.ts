import { z } from 'zod';

import {
  COMENTARIO_MAXIMO,
  COMENTARIO_MINIMO,
  CONTENIDO_MAXIMO,
  CONTENIDO_MINIMO,
  RESUMEN_MAXIMO,
  TITULO_MAXIMO,
  TITULO_MINIMO,
} from './politica';

/**
 * Validacion de articulos y comentarios.
 *
 * El cuerpo del articulo es **texto plano**: se respetan los saltos de linea
 * al mostrarlo, pero no se interpreta ni HTML ni Markdown. Interpretar marcas
 * escritas por una persona obliga a sanear la salida, y eso es una fuente de
 * agujeros que no compensa mientras escriban solo los administradores.
 */

const resumenOpcional = z
  .string()
  .trim()
  .max(RESUMEN_MAXIMO, `El resumen no puede pasar de ${RESUMEN_MAXIMO} caracteres`)
  .nullish()
  .transform((v) => (v && v.length > 0 ? v : null));

export const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITULO_MINIMO, `El titulo debe tener al menos ${TITULO_MINIMO} caracteres`)
    .max(TITULO_MAXIMO, 'El titulo es demasiado largo'),

  excerpt: resumenOpcional,

  content: z
    .string()
    .trim()
    .min(CONTENIDO_MINIMO, `Escribe al menos ${CONTENIDO_MINIMO} caracteres`)
    .max(CONTENIDO_MAXIMO, 'El articulo es demasiado largo'),
});

export type PostInput = z.infer<typeof postSchema>;

export const comentarioSchema = z.object({
  body: z
    .string()
    .trim()
    .min(COMENTARIO_MINIMO, 'Escribe algo antes de enviar')
    .max(
      COMENTARIO_MAXIMO,
      `El comentario no puede pasar de ${COMENTARIO_MAXIMO} caracteres`,
    ),
});
