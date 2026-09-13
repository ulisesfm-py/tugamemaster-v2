import 'server-only';

import { db } from '@/lib/db';

/** Reservas de un jugador, separadas en proximas e historial. */
export async function misReservas(userId: string) {
  const reservas = await db.booking.findMany({
    where: { userId },
    orderBy: { game: { startsAt: 'desc' } },
    select: {
      id: true,
      status: true,
      amountCents: true,
      currency: true,
      createdAt: true,
      game: {
        select: {
          id: true,
          title: true,
          slug: true,
          system: true,
          startsAt: true,
          status: true,
          gm: { select: { user: { select: { name: true, slug: true } } } },
        },
      },
    },
  });

  const ahora = Date.now();

  return {
    proximas: reservas.filter(
      (r) =>
        r.game.startsAt.getTime() > ahora &&
        (r.status === 'PENDING' || r.status === 'PAID'),
    ),
    pasadas: reservas.filter(
      (r) =>
        r.game.startsAt.getTime() <= ahora ||
        !(r.status === 'PENDING' || r.status === 'PAID'),
    ),
  };
}

/** Jugadores apuntados a una partida, para el GM que la dirige. */
export async function jugadoresDe(gameId: string, userId: string) {
  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: { gm: { select: { userId: true } } },
  });

  if (!partida || partida.gm.userId !== userId) return null;

  return db.booking.findMany({
    where: { gameId, status: { in: ['PENDING', 'PAID', 'COMPLETED'] } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, slug: true, image: true } },
    },
  });
}
