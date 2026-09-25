import 'server-only';

import { db } from '@/lib/db';

import { DIAS_DE_VIDA, hayMensajesNuevos } from './politica';
import { accesoDe } from './service';

/**
 * Lecturas del hilo de mesa.
 *
 * Nada de sondeos ni de conexiones abiertas: la pagina trae los mensajes ya
 * resueltos y la campanita pregunta una vez por navegacion. Para una
 * conversacion asincrona es de sobra, y no cuesta nada mantenerlo.
 */

const DIA_MS = 86_400_000;

export type MensajeDelHilo = {
  id: string;
  body: string;
  escritoEn: Date;
  autor: { id: string; name: string; slug: string; image: string | null };
  mio: boolean;
  retirado: boolean;
  denunciado: boolean;
};

export type Hilo = {
  partida: {
    id: string;
    title: string;
    slug: string;
    startsAt: Date;
    endsAt: Date;
    gm: { name: string; slug: string };
  };
  esGm: boolean;
  mensajes: MensajeDelHilo[];
};

export type HiloDePartida =
  { ok: true; hilo: Hilo } | { ok: false; mensaje: string; existe: boolean };

/** El hilo de una partida, ya comprobado que quien mira puede mirarlo. */
export async function hiloDePartida(
  slug: string,
  userId: string,
  ahora = new Date(),
): Promise<HiloDePartida> {
  const partida = await db.game.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      startsAt: true,
      endsAt: true,
      gm: { select: { user: { select: { name: true, slug: true } } } },
    },
  });

  if (!partida) return { ok: false, mensaje: 'Esa partida no existe', existe: false };

  const acceso = await accesoDe(partida.id, userId, ahora);
  if (!acceso.ok) return acceso;

  const mensajes = await db.threadMessage.findMany({
    where: { gameId: partida.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      body: true,
      createdAt: true,
      removedAt: true,
      reportedAt: true,
      author: { select: { id: true, name: true, slug: true, image: true } },
    },
  });

  return {
    ok: true,
    hilo: {
      partida: {
        id: partida.id,
        title: partida.title,
        slug: partida.slug,
        startsAt: partida.startsAt,
        endsAt: partida.endsAt,
        gm: partida.gm.user,
      },
      esGm: acceso.esGm,
      mensajes: mensajes.map((m) => ({
        id: m.id,
        // Un mensaje retirado no se sirve: quitarlo de la pantalla y dejarlo
        // viajando en el HTML seria no haberlo quitado.
        body: m.removedAt ? '' : m.body,
        escritoEn: m.createdAt,
        autor: m.author,
        mio: m.author.id === userId,
        retirado: !!m.removedAt,
        denunciado: !!m.reportedAt,
      })),
    },
  };
}

export type HiloConNovedades = { slug: string; title: string; mensajes: number };

/**
 * Partidas con mensajes sin leer para alguien.
 *
 * Sale de la marca de lectura y de los propios mensajes: no hay contador que
 * mantener, asi que no hay contador que se pueda desincronizar. Lo que uno
 * escribe no cuenta como novedad para uno mismo.
 */
export async function hilosConNovedades(
  userId: string,
  ahora = new Date(),
): Promise<HiloConNovedades[]> {
  const desde = new Date(ahora.getTime() - DIAS_DE_VIDA * DIA_MS);

  // Las mesas de las que forma parte: las que dirige y aquellas en las que
  // tiene plaza. Solo mientras el hilo siga abierto.
  const partidas = await db.game.findMany({
    where: {
      endsAt: { gte: desde },
      OR: [
        { gm: { userId } },
        { bookings: { some: { userId, status: { in: ['PAID', 'COMPLETED'] } } } },
      ],
    },
    select: { id: true, slug: true, title: true },
  });

  if (partidas.length === 0) return [];

  const ids = partidas.map((p) => p.id);

  const [marcas, ultimos] = await Promise.all([
    db.threadRead.findMany({
      where: { userId, gameId: { in: ids } },
      select: { gameId: true, readAt: true },
    }),

    db.threadMessage.findMany({
      where: { gameId: { in: ids }, authorId: { not: userId }, removedAt: null },
      orderBy: { createdAt: 'desc' },
      distinct: ['gameId'],
      select: { gameId: true, authorId: true, createdAt: true },
    }),
  ]);

  const leidoHasta = new Map(marcas.map((m) => [m.gameId, m.readAt]));
  const conNovedad = new Set(
    ultimos
      .filter((m) =>
        hayMensajesNuevos(
          { id: userId, leidoHasta: leidoHasta.get(m.gameId) ?? null },
          { autorId: m.authorId, escritoEn: m.createdAt },
        ),
      )
      .map((m) => m.gameId),
  );

  if (conNovedad.size === 0) return [];

  // Cuantos hay sin leer, para poder decir "3 mensajes" y no solo "hay algo".
  const cuentas = await db.threadMessage.groupBy({
    by: ['gameId'],
    where: {
      gameId: { in: [...conNovedad] },
      authorId: { not: userId },
      removedAt: null,
    },
    _count: { _all: true },
  });

  const sinLeer = new Map(cuentas.map((c) => [c.gameId, c._count._all]));

  return partidas
    .filter((p) => conNovedad.has(p.id))
    .map((p) => ({ slug: p.slug, title: p.title, mensajes: sinLeer.get(p.id) ?? 1 }));
}
