import 'server-only';

import { db } from '@/lib/db';
import { slugDisponible } from '@/modules/users/slug';

import { partidaSchema } from './schema';

/**
 * Reglas de negocio de las partidas.
 */

export type ResultadoPartida =
  { ok: true; gameId: string; slug: string } | { ok: false; mensaje: string };

/** Perfil de GM del usuario, o null si todavia no lo ha creado. */
async function gmDe(userId: string) {
  return db.gmProfile.findUnique({
    where: { userId },
    select: { id: true, payoutsEnabled: true },
  });
}

function horasDespues(fecha: Date, horas: number): Date {
  return new Date(fecha.getTime() + horas * 60 * 60 * 1000);
}

/**
 * La entrada llega como `unknown` a proposito: el formulario manda cadenas y
 * el esquema las convierte (`z.coerce`), asi que el tipo de entrada y el de
 * salida no coinciden. Parsear aqui dentro evita castings en quien llama.
 */
export async function crearPartida(
  userId: string,
  input: unknown,
): Promise<ResultadoPartida> {
  const parsed = partidaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos' };
  }

  const gm = await gmDe(userId);
  if (!gm) {
    return { ok: false, mensaje: 'Antes tienes que crear tu perfil de game master' };
  }

  const d = parsed.data;

  const slug = await slugDisponible(d.title, async (candidato) => {
    const ocupado = await db.game.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    return ocupado !== null;
  });

  const game = await db.game.create({
    data: {
      gmId: gm.id,
      title: d.title,
      slug,
      description: d.description,
      system: d.system,
      startsAt: d.startsAt,
      endsAt: horasDespues(d.startsAt, d.durationHours),
      seatsTotal: d.seatsTotal,
      priceCents: d.priceCents,
      // Nace siempre en borrador. Publicar es un paso aparte y con condiciones.
      status: 'DRAFT',
    },
    select: { id: true, slug: true },
  });

  return { ok: true, gameId: game.id, slug: game.slug };
}

export async function actualizarPartida(
  userId: string,
  gameId: string,
  input: unknown,
): Promise<ResultadoPartida> {
  const parsed = partidaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos' };
  }

  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: {
      slug: true,
      status: true,
      gm: { select: { userId: true } },
      _count: {
        select: { bookings: { where: { status: { in: ['PENDING', 'PAID'] } } } },
      },
    },
  });

  if (!partida || partida.gm.userId !== userId) {
    return { ok: false, mensaje: 'Esa partida no es tuya' };
  }

  if (partida.status === 'COMPLETED' || partida.status === 'CANCELLED') {
    return { ok: false, mensaje: 'Una partida terminada o cancelada ya no se edita' };
  }

  const d = parsed.data;

  // No se puede reducir el aforo por debajo de las plazas ya ocupadas: alguien
  // se quedaria sin sitio sin enterarse.
  if (d.seatsTotal < partida._count.bookings) {
    return {
      ok: false,
      mensaje: `Ya hay ${partida._count.bookings} plazas reservadas: no puedes dejar menos`,
    };
  }

  await db.game.update({
    where: { id: gameId },
    data: {
      title: d.title,
      description: d.description,
      system: d.system,
      startsAt: d.startsAt,
      endsAt: horasDespues(d.startsAt, d.durationHours),
      seatsTotal: d.seatsTotal,
      priceCents: d.priceCents,
    },
  });

  return { ok: true, gameId, slug: partida.slug };
}

export type ResultadoSimple = { ok: true } | { ok: false; mensaje: string };

/**
 * Publica una partida, haciendola visible en el portal.
 *
 * Exige que el GM tenga su cuenta de cobro lista: una partida publicada es una
 * promesa de que se puede pagar, y sin `payoutsEnabled` ese dinero no tendria
 * donde ir. Ver CLAUDE.md.
 */
export async function publicarPartida(
  userId: string,
  gameId: string,
): Promise<ResultadoSimple> {
  const gm = await gmDe(userId);
  if (!gm) return { ok: false, mensaje: 'No tienes perfil de game master' };

  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: { gmId: true, status: true, startsAt: true },
  });

  if (!partida || partida.gmId !== gm.id) {
    return { ok: false, mensaje: 'Esa partida no es tuya' };
  }

  if (!gm.payoutsEnabled) {
    return {
      ok: false,
      mensaje:
        'Configura primero la cuenta donde quieres recibir los pagos. ' +
        'Ese paso llegara con la integracion de cobros.',
    };
  }

  if (partida.startsAt.getTime() <= Date.now()) {
    return { ok: false, mensaje: 'No puedes publicar una partida cuya fecha ya paso' };
  }

  await db.game.update({ where: { id: gameId }, data: { status: 'PUBLISHED' } });
  return { ok: true };
}

/** Devuelve una partida publicada al estado de borrador. */
export async function despublicarPartida(
  userId: string,
  gameId: string,
): Promise<ResultadoSimple> {
  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: {
      status: true,
      gm: { select: { userId: true } },
      _count: {
        select: { bookings: { where: { status: { in: ['PENDING', 'PAID'] } } } },
      },
    },
  });

  if (!partida || partida.gm.userId !== userId) {
    return { ok: false, mensaje: 'Esa partida no es tuya' };
  }

  // Con gente dentro, retirarla del portal las dejaria en el limbo. Lo que
  // corresponde entonces es cancelarla, que es una decision distinta.
  if (partida._count.bookings > 0) {
    return {
      ok: false,
      mensaje: 'Ya hay jugadores apuntados: cancela la partida en vez de retirarla',
    };
  }

  await db.game.update({ where: { id: gameId }, data: { status: 'DRAFT' } });
  return { ok: true };
}

/**
 * Cancela una partida.
 *
 * En esta fase no hay dinero de por medio, asi que basta con marcar la partida
 * y liberar las reservas. Cuando existan cobros, cancelar tendra que disparar
 * ademas los reembolsos.
 */
export async function cancelarPartida(
  userId: string,
  gameId: string,
): Promise<ResultadoSimple> {
  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: { status: true, gm: { select: { userId: true } } },
  });

  if (!partida || partida.gm.userId !== userId) {
    return { ok: false, mensaje: 'Esa partida no es tuya' };
  }

  if (partida.status === 'COMPLETED') {
    return { ok: false, mensaje: 'Una partida ya jugada no se puede cancelar' };
  }

  await db.$transaction([
    db.game.update({ where: { id: gameId }, data: { status: 'CANCELLED' } }),
    db.booking.updateMany({
      where: { gameId, status: { in: ['PENDING', 'PAID'] } },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    }),
  ]);

  return { ok: true };
}
