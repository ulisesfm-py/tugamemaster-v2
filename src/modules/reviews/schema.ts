import { z } from 'zod';

import { COMENTARIO_MAXIMO, RATING_MAXIMO, RATING_MINIMO } from './politica';

/**
 * Validacion de una resena.
 *
 * El comentario es opcional: obligar a escribir para poder puntuar haria que
 * la gente rellenara cualquier cosa, y la puntuacion es el dato que importa.
 * Un comentario vacio se guarda como `null`, no como cadena vacia.
 *
 * "Sin comentario" llega de tres formas distintas y las tres valen: `null` es
 * lo que devuelve `FormData.get` cuando el campo no viaja, `undefined` cuando
 * se llama al servicio desde codigo, y la cadena vacia cuando el textarea se
 * envia en blanco. Si solo se aceptara la cadena, un envio sin el campo
 * moriria con un "expected string, received null" que no dice nada al jugador.
 */
export const resenaSchema = z.object({
  rating: z.coerce
    .number({ message: 'Elige entre 1 y 5 estrellas' })
    .int('Elige entre 1 y 5 estrellas')
    .min(RATING_MINIMO, 'Elige entre 1 y 5 estrellas')
    .max(RATING_MAXIMO, 'Elige entre 1 y 5 estrellas'),

  comment: z
    .string()
    .trim()
    .max(
      COMENTARIO_MAXIMO,
      `El comentario no puede pasar de ${COMENTARIO_MAXIMO} caracteres`,
    )
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type ResenaInput = z.infer<typeof resenaSchema>;
