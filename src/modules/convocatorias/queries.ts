import 'server-only';

import { db } from '@/lib/db';
import {
  continuableDesdeLaLista,
  DIAS_PARA_CONTINUAR_DESDE_LA_LISTA,
} from '@/modules/campaigns/politica';

import { DIAS_EN_EL_LISTADO } from './politica';

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

/** Lo que necesita la tarjeta de una mesa flexible. */
function seleccionTarjetaFlexible() {
  return {
    id: true,
    title: true,
    slug: true,
    system: true,
    imageUrl: true,
    experience: true,
    tags: true,
    weekdays: true,
    startMinute: true,
    durationMinutes: true,
    frequency: true,
    seatsTotal: true,
    minPlayers: true,
    priceCents: true,
    currency: true,
    gm: {
      select: {
        id: true,
        plan: true,
        user: { select: { name: true, slug: true, image: true } },
      },
    },
    _count: { select: { preReservas: true } },
  } as const;
}

/**
 * Las mesas flexibles abiertas, para el listado y la portada.
 *
 * Las mas recientes primero: no tienen fecha por la que ordenar. Las que
 * llevan mas de `DIAS_EN_EL_LISTADO` sin convocarse no salen.
 */
export async function mesasFlexiblesAbiertas(
  filtro: { gmId?: string; limite?: number } = {},
  ahora = new Date(),
) {
  const desde = new Date(ahora.getTime() - DIAS_EN_EL_LISTADO * 86_400_000);

  return db.convocatoria.findMany({
    where: {
      status: 'ABIERTA',
      createdAt: { gte: desde },
      ...(filtro.gmId ? { gmId: filtro.gmId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filtro.limite ?? 30,
    select: seleccionTarjetaFlexible(),
  });
}

/**
 * Una mesa flexible para su pagina publica.
 *
 * Un borrador o una cerrada solo la ve su game master; para el resto no
 * existe. Una convocada devuelve el slug de su partida, a donde se redirige.
 */
export async function detalleMesaFlexible(slug: string, userId?: string) {
  const mesa = await db.convocatoria.findUnique({
    where: { slug },
    select: {
      ...seleccionTarjetaFlexible(),
      description: true,
      languages: true,
      minAge: true,
      status: true,
      game: { select: { slug: true } },
      gm: {
        select: {
          id: true,
          plan: true,
          userId: true,
          headline: true,
          languages: true,
          user: { select: { name: true, slug: true, image: true } },
        },
      },
    },
  });

  if (!mesa) return null;

  const miPreReserva = userId
    ? await db.preReserva.findUnique({
        where: { convocatoriaId_userId: { convocatoriaId: mesa.id, userId } },
        select: { id: true, createdAt: true },
      })
    : null;

  return { ...mesa, esMia: mesa.gm.userId === userId, miPreReserva };
}

/** Las pre-reservas de un jugador en mesas aun sin convocar, para su panel. */
export async function misPreReservas(userId: string) {
  return db.preReserva.findMany({
    where: { userId, convocatoria: { status: 'ABIERTA' } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      convocatoriaId: true,
      convocatoria: {
        select: {
          title: true,
          slug: true,
          system: true,
          minPlayers: true,
          seatsTotal: true,
          weekdays: true,
          startMinute: true,
          durationMinutes: true,
          frequency: true,
          _count: { select: { preReservas: true } },
        },
      },
    },
  });
}

/**
 * Para el GM, en la gestion de una partida convocada: cuantos de los que se
 * pre-reservaron han reservado ya, y quienes faltan.
 *
 * Null si la partida no sale de una mesa flexible.
 */
export async function preReservadosDePartida(gameId: string) {
  const mesa = await db.convocatoria.findUnique({
    where: { gameId },
    select: {
      slug: true,
      priorityUntil: true,
      preReservas: {
        orderBy: { createdAt: 'asc' },
        select: { userId: true, user: { select: { name: true, slug: true } } },
      },
    },
  });

  if (!mesa) return null;

  const conReserva = await db.booking.findMany({
    where: {
      gameId,
      userId: { in: mesa.preReservas.map((p) => p.userId) },
      status: { in: ['PENDING', 'PAID', 'COMPLETED'] },
    },
    select: { userId: true },
  });

  const reservaron = new Set(conReserva.map((b) => b.userId));

  return {
    slug: mesa.slug,
    priorityUntil: mesa.priorityUntil,
    total: mesa.preReservas.length,
    reservados: reservaron.size,
    faltan: mesa.preReservas.filter((p) => !reservaron.has(p.userId)).map((p) => p.user),
  };
}
