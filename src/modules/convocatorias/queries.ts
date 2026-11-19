import 'server-only';

import { db } from '@/lib/db';
import {
  continuableDesdeLaLista,
  DIAS_PARA_CONTINUAR_DESDE_LA_LISTA,
} from '@/modules/campaigns/politica';

/**
 * Lecturas de las mesas con fecha flexible para el panel del GM.
 */

/** Las mesas del GM que aun no se han convocado ni cerrado. */
export async function misConvocatorias(userId: string) {
  return db.convocatoria.findMany({
    where: { gm: { userId }, status: { in: ['BORRADOR', 'ABIERTA'] } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      system: true,
      status: true,
      seatsTotal: true,
      minPlayers: true,
      priceCents: true,
      currency: true,
      weekdays: true,
      startMinute: true,
      durationMinutes: true,
      frequency: true,
      _count: { select: { preReservas: true } },
    },
  });
}

/** Una mesa concreta para su gestion, o null si no es del GM. */
export async function miConvocatoria(userId: string, id: string) {
  const mesa = await db.convocatoria.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      system: true,
      imageUrl: true,
      languages: true,
      experience: true,
      minAge: true,
      tags: true,
      seatsTotal: true,
      minPlayers: true,
      priceCents: true,
      currency: true,
      weekdays: true,
      startMinute: true,
      durationMinutes: true,
      frequency: true,
      status: true,
      gameId: true,
      gm: { select: { userId: true } },
      preReservas: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          createdAt: true,
          user: { select: { name: true, slug: true, image: true } },
        },
      },
    },
  });

  return mesa && mesa.gm.userId === userId ? mesa : null;
}

/**
 * Las sesiones jugadas que el GM puede continuar desde «Nueva partida», de la
 * mas reciente a la mas antigua.
 */
export async function sesionesParaContinuar(userId: string, ahora = new Date()) {
  const desde = new Date(
    ahora.getTime() - DIAS_PARA_CONTINUAR_DESDE_LA_LISTA * 86_400_000,
  );

  const partidas = await db.game.findMany({
    where: {
      gm: { userId },
      status: { in: ['PUBLISHED', 'COMPLETED'] },
      endsAt: { gte: desde, lte: ahora },
      nextGame: null,
    },
    orderBy: { endsAt: 'desc' },
    select: {
      id: true,
      title: true,
      system: true,
      status: true,
      startsAt: true,
      endsAt: true,
      sessionNumber: true,
      campaign: { select: { title: true } },
      _count: {
        select: { bookings: { where: { status: { in: ['PAID', 'COMPLETED'] } } } },
      },
    },
  });

  // La consulta ya filtra; la regla se aplica igual para que la lista y la
  // politica no puedan decir cosas distintas.
  return partidas.filter((p) =>
    continuableDesdeLaLista({ ...p, tieneContinuacion: false }, ahora),
  );
}
