import 'server-only';

import { db } from '@/lib/db';

import { puedeEditar } from './politica';

/**
 * Resenas que ha escrito un jugador, para su pagina de reservas.
 *
 * `editable` se decide aqui y no en la pagina: depende de la hora actual, y
 * leer el reloj durante el render de un componente es impuro.
 */
export async function misResenas(userId: string) {
  const resenas = await db.review.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      bookingId: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  });

  const ahora = new Date();

  return resenas.map((r) => ({ ...r, editable: puedeEditar(r.createdAt, ahora) }));
}
