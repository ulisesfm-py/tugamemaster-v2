import 'server-only';

import { db } from '@/lib/db';
import { ESTADOS_PAGADOS } from '@/modules/bookings/service';

/**
 * Consultas de campanas y notas de sesion.
 */

/**
 * Nota de sesion, si quien pregunta tiene derecho a verla.
 *
 * La ven el game master y quienes jugaron esa sesion. Nunca es publica: cuenta
 * donde quedo la historia y que hicieron los personajes de los demas, asi que
 * publicarla reventaria la campana a quien se plantee entrar en la siguiente.
 */
export async function notaVisible(gameId: string, userId: string | undefined) {
  if (!userId) return null;

  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: {
      gm: { select: { userId: true } },
      sessionNote: { select: { content: true, updatedAt: true } },
      bookings: {
        where: { userId, status: { in: ESTADOS_PAGADOS } },
        select: { id: true },
      },
    },
  });

  if (!partida?.sessionNote) return null;

  const esElGm = partida.gm.userId === userId;
  const jugo = partida.bookings.length > 0;

  return esElGm || jugo ? partida.sessionNote : null;
}

/** Campana publica con sus sesiones en orden. */
export async function campanaPublica(slug: string) {
  const campana = await db.campaign.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      summary: true,
      createdAt: true,
      gm: {
        select: {
          id: true,
          headline: true,
          plan: true,
          user: { select: { name: true, slug: true, image: true } },
        },
      },
      games: {
        // Los borradores no salen: son sesiones que el GM aun no ha publicado.
        where: { status: { in: ['PUBLISHED', 'COMPLETED', 'CANCELLED'] } },
        orderBy: [{ sessionNumber: 'asc' }, { startsAt: 'asc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          system: true,
          startsAt: true,
          status: true,
          sessionNumber: true,
          seatsTotal: true,
          priceCents: true,
          currency: true,
          previousGameId: true,
          _count: {
            select: { bookings: { where: { status: { in: ESTADOS_PAGADOS } } } },
          },
        },
      },
    },
  });

  return campana;
}

/**
 * Datos de continuacion de una partida, para la pagina publica.
 *
 * Sirve para avisar de que las plazas estan reservadas a quienes jugaron la
 * sesion anterior. Sin este aviso el jugador solo se entera al intentar
 * reservar y que le rechacen.
 */
export async function contextoDeCampana(gameId: string) {
  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: {
      sessionNumber: true,
      campaign: { select: { title: true, slug: true } },
      previousGame: { select: { title: true, slug: true } },
    },
  });

  if (!partida?.campaign) return null;

  return partida;
}
