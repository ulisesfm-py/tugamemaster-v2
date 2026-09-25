import { z } from 'zod';

import { limpiarMensaje, MENSAJE_MAXIMO, MOTIVO_DENUNCIA_MAXIMO } from './politica';

/**
 * Validacion de lo que se escribe en el hilo.
 *
 * El texto se limpia antes de medirlo: un mensaje de mil espacios no es un
 * mensaje, y uno que solo se pasa del limite por saltos de linea sobrantes no
 * deberia rechazarse.
 */
export const mensajeSchema = z.object({
  body: z
    .string({ message: 'Escribe algo antes de enviar' })
    .transform(limpiarMensaje)
    .refine((v) => v.length > 0, 'Escribe algo antes de enviar')
    .refine(
      (v) => v.length <= MENSAJE_MAXIMO,
      `Un mensaje no puede pasar de ${MENSAJE_MAXIMO} caracteres`,
    ),
});

export const denunciaSchema = z.object({
  reason: z
    .string({ message: 'Cuenta en una línea qué pasa con ese mensaje' })
    .trim()
    .min(3, 'Cuenta en una línea qué pasa con ese mensaje')
    .max(
      MOTIVO_DENUNCIA_MAXIMO,
      `El motivo no puede pasar de ${MOTIVO_DENUNCIA_MAXIMO} caracteres`,
    ),
});
