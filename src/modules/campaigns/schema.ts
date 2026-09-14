import { z } from 'zod';

import { NOTA_MAXIMA, NOTA_MINIMA, RESUMEN_MAXIMO } from './politica';

/**
 * Validacion de las notas de sesion y del resumen de campana.
 */

export const notaSchema = z.object({
  content: z
    .string()
    .trim()
    .min(NOTA_MINIMA, `Cuenta algo mas: al menos ${NOTA_MINIMA} caracteres`)
    .max(NOTA_MAXIMA, 'La nota es demasiado larga'),
});

/**
 * Resumen publico de la campana. Opcional y con las tres formas de "vacio",
 * igual que el comentario de una resena.
 */
export const resumenSchema = z
  .string()
  .trim()
  .max(RESUMEN_MAXIMO, `El resumen no puede pasar de ${RESUMEN_MAXIMO} caracteres`)
  .nullish()
  .transform((v) => (v && v.length > 0 ? v : null));
