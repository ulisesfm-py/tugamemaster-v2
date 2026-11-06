import 'server-only';

import { db } from '@/lib/db';
import { ESTADOS_PAGADOS, filtroPlazaOcupada } from '@/modules/bookings/service';

import { PLAZAS_POCAS } from './ficha';
import type { Filtros } from './schema';
import { agrupaSistemas, type Sistema } from './sistemas';

/**
 * Consultas de lectura de partidas.
 */

/**
 * Campos comunes de una tarjeta de partida.
 *
 * Es una funcion y no una constante porque el filtro de plazas ocupadas
 * depende de la hora actual: como constante, la fecha limite se calcularia una
 * sola vez al cargar el modulo y se quedaria congelada.
 *
 * Se exporta para que el perfil del GM pinte las mismas tarjetas que el resto
 * de la web: si cada consulta eligiera sus campos, la tarjeta ensenaria una
 * cosa distinta segun la pagina.
 */
export function seleccionTarjeta() {
  return {
    id: true,
    title: true,
    slug: true,
    system: true,
    imageUrl: true,
    tags: true,
    experience: true,
    startsAt: true,
    endsAt: true,
    seatsTotal: true,
    priceCents: true,
    currency: true,
    gm: {
      select: {
        id: true,
        plan: true,
        user: { select: { name: true, slug: true, image: true } },
      },
    },
    _count: {
      select: { bookings: { where: filtroPlazaOcupada() } },
    },
  } as const;
}

/** Fin de la ventana de fechas que pide el filtro. */
function hasta(cuando: 'semana' | 'mes'): Date {
  const dias = cuando === 'semana' ? 7 : 30;
  return new Date(Date.now() + dias * 86_400_000);
}

/** Listado publico: solo partidas publicadas que aun no han empezado. */
export async function listarPartidas(filtros: Filtros) {
  const partidas = await db.game.findMany({
    where: {
      status: 'PUBLISHED',
      startsAt: { gte: new Date() },
      ...(filtros.q
        ? {
            OR: [
              { title: { contains: filtros.q, mode: 'insensitive' } },
              { description: { contains: filtros.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filtros.system
        ? { system: { contains: filtros.system, mode: 'insensitive' } }
        : {}),
      ...(filtros.maxPrecio !== undefined
        ? { priceCents: { lte: Math.round(filtros.maxPrecio * 100) } }
        : {}),
      ...(filtros.experiencia ? { experience: filtros.experiencia } : {}),
      ...(filtros.etiqueta ? { tags: { has: filtros.etiqueta } } : {}),
      ...(filtros.cuando
        ? { startsAt: { gte: new Date(), lte: hasta(filtros.cuando) } }
        : {}),
    },
    orderBy: { startsAt: 'asc' },
    take: 60,
    select: seleccionTarjeta(),
  });

  // Las dos condiciones de aforo se resuelven en memoria: dependen del recuento
  // de reservas, que Prisma no permite comparar contra otra columna en el
  // where. Con 60 filas como maximo es irrelevante; si el catalogo crece,
  // tocara mantener un contador desnormalizado en Game.
  return partidas.filter((p) => {
    const libres = p.seatsTotal - p._count.bookings;

    if (filtros.ultimasPlazas) return libres > 0 && libres <= PLAZAS_POCAS;
    if (filtros.soloLibres) return libres > 0;

    return true;
  });
}

/** Sistemas de juego existentes, para el desplegable de filtros. */
export async function sistemasDisponibles(): Promise<string[]> {
  const filas = await db.game.findMany({
    where: { status: 'PUBLISHED', startsAt: { gte: new Date() } },
    distinct: ['system'],
    select: { system: true },
    orderBy: { system: 'asc' },
    take: 40,
  });

  return filas.map((f) => f.system);
}

/** Detalle publico de una partida. `userId` decide que ve quien la mira. */
export async function detallePartida(slug: string, userId?: string) {
  const partida = await db.game.findUnique({
    where: { slug },
    select: {
      ...seleccionTarjeta(),
      description: true,
      status: true,
      sessionNumber: true,
      previousGameId: true,
      campaignId: true,
      languages: true,
      minAge: true,
      campaign: { select: { title: true, slug: true } },
      previousGame: { select: { title: true, slug: true } },
      gm: {
        select: {
          id: true,
          headline: true,
          languages: true,
          userId: true,
          plan: true,
          user: { select: { name: true, slug: true, image: true } },
        },
      },
    },
  });

  if (!partida) return null;

  const plazasOcupadas = partida._count.bookings;

  const miReserva = userId
    ? await db.booking.findUnique({
        where: { gameId_userId: { gameId: partida.id, userId } },
        select: { id: true, status: true },
      })
    : null;

  // Para una continuacion de campana, saber si el visitante puede apuntarse.
  const puedeContinuar =
    partida.previousGameId && userId
      ? (await db.booking.count({
          where: {
            gameId: partida.previousGameId,
            userId,
            status: { in: ['PAID', 'COMPLETED'] },
          },
        })) > 0
      : true;

  return {
    ...partida,
    plazasOcupadas,
    plazasLibres: partida.seatsTotal - plazasOcupadas,
    miReserva,
    esMia: userId !== undefined && partida.gm.userId === userId,
    puedeContinuar,
  };
}

/** Partidas de un GM, para su panel. */
export async function misPartidas(userId: string) {
  const gm = await db.gmProfile.findUnique({
    where: { userId },
    select: { id: true, payoutsEnabled: true },
  });

  if (!gm) return null;

  const partidas = await db.game.findMany({
    where: { gmId: gm.id },
    orderBy: { startsAt: 'desc' },
    select: { ...seleccionTarjeta(), status: true },
  });

  return { gm, partidas };
}

/** Una partida concreta para el formulario de edicion del GM. */
export async function miPartida(userId: string, gameId: string) {
  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      system: true,
      imageUrl: true,
      languages: true,
      experience: true,
      minAge: true,
      tags: true,
      startsAt: true,
      endsAt: true,
      seatsTotal: true,
      priceCents: true,
      status: true,
      sessionNumber: true,
      gm: { select: { userId: true } },
      campaign: { select: { title: true, slug: true, summary: true } },
      sessionNote: { select: { content: true } },
      // Si ya existe, no se puede crear otra continuacion.
      nextGame: { select: { id: true, title: true } },
      _count: {
        select: { bookings: { where: { status: { in: ESTADOS_PAGADOS } } } },
      },
    },
  });

  if (!partida || partida.gm.userId !== userId) return null;

  return partida;
}

/**
 * Los sistemas que se juegan aqui, con cuantas mesas abiertas tiene cada uno.
 *
 * Se agrupan por slug: «D&D 5e» y «D&D 5E» son el mismo sistema escrito de dos
 * maneras, y quien busca uno espera encontrar las dos. Ver `sistemas.ts`.
 */
export async function catalogoDeSistemas(): Promise<Sistema[]> {
  const filas = await db.game.groupBy({
    by: ['system'],
    where: { status: 'PUBLISHED', startsAt: { gte: new Date() } },
    _count: { _all: true },
  });

  return agrupaSistemas(
    filas.map((f) => ({ system: f.system, partidas: f._count._all })),
  );
}

/**
 * Un sistema y sus mesas abiertas, o null si nadie dirige nada de eso.
 *
 * Devolver null y no una lista vacia es deliberado: una direccion inventada
 * tiene que dar 404, no una pagina en blanco con cara de sistema real.
 */
export async function sistemaPorSlug(slug: string) {
  const sistema = (await catalogoDeSistemas()).find((s) => s.slug === slug);
  if (!sistema) return null;

  const partidas = await db.game.findMany({
    where: {
      status: 'PUBLISHED',
      startsAt: { gte: new Date() },
      system: { in: sistema.variantes },
    },
    orderBy: { startsAt: 'asc' },
    take: 24,
    select: seleccionTarjeta(),
  });

  // Quien lo dirige, sin repetir: es la otra razon para entrar aqui.
  const gms = [...new Map(partidas.map((p) => [p.gm.id, p.gm])).values()];

  return { sistema, partidas, gms };
}
