import 'server-only';

import { db } from '@/lib/db';
import { ESTADOS_PAGADOS } from '@/modules/bookings/service';
import { avisarPartidaCancelada } from '@/modules/notifications/service';
import { slugDisponible } from '@/modules/users/slug';
import { abonar } from '@/modules/wallet/service';

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
 * Cancela una partida y devuelve integramente a quien ya habia pagado.
 *
 * Cancela el GM, no el jugador: la politica de las 48 horas no pinta nada
 * aqui. Quien pago recupera el **100%** en saldo, sin importar cuanto falte
 * para la partida, porque no ha hecho nada mal.
 *
 * La devolucion es saldo y no dinero a la tarjeta, igual que en el resto de
 * la plataforma: si el dinero no sale, no hay una segunda comision de Stripe
 * que nadie tenga que asumir. Ver docs/payments.md.
 *
 * El GM no cobra: `pagarGms` solo recoge partidas en COMPLETED, y esta queda
 * en CANCELLED.
 */
export async function cancelarPartida(
  userId: string,
  gameId: string,
): Promise<ResultadoSimple> {
  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: {
      status: true,
      title: true,
      gm: { select: { userId: true } },
      bookings: {
        where: { status: { in: ['PENDING', 'PAID', 'COMPLETED'] } },
        select: { id: true, userId: true, status: true, amountCents: true },
      },
    },
  });

  if (!partida || partida.gm.userId !== userId) {
    return { ok: false, mensaje: 'Esa partida no es tuya' };
  }

  if (partida.status === 'COMPLETED') {
    return { ok: false, mensaje: 'Una partida ya jugada no se puede cancelar' };
  }

  if (partida.status === 'CANCELLED') {
    return { ok: false, mensaje: 'Esa partida ya estaba cancelada' };
  }

  // Una PENDING nunca llego a cobrarse: no hay nada que devolver.
  const pagadas = partida.bookings.filter((b) => ESTADOS_PAGADOS.includes(b.status));
  const sinPagar = partida.bookings.filter((b) => !ESTADOS_PAGADOS.includes(b.status));

  await db.$transaction(async (tx) => {
    await tx.game.update({ where: { id: gameId }, data: { status: 'CANCELLED' } });

    if (sinPagar.length > 0) {
      await tx.booking.updateMany({
        where: { id: { in: sinPagar.map((b) => b.id) } },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
    }

    for (const reserva of pagadas) {
      await tx.booking.update({
        where: { id: reserva.id },
        data: { status: 'REFUNDED', cancelledAt: new Date(), refundedAt: new Date() },
      });

      if (reserva.amountCents > 0) {
        await abonar(
          {
            userId: reserva.userId,
            amountCents: reserva.amountCents,
            type: 'REFUND_CREDIT',
            bookingId: reserva.id,
            note: `El game master cancelo ${partida.title}`,
          },
          tx,
        );
      }
    }
  });

  // Fuera de la transaccion: avisar es importante, pero no tanto como para
  // arriesgarse a deshacer una devolucion ya hecha si falla el correo.
  //
  // Se avisa a todos los que tenian plaza, hubiera dinero de por medio o no:
  // quien reservo una partida gratuita tambien se ha quedado sin mesa.
  await avisarPartidaCancelada([
    ...pagadas.map((b) => ({ bookingId: b.id, devueltoCents: b.amountCents })),
    ...sinPagar.map((b) => ({ bookingId: b.id, devueltoCents: 0 })),
  ]);

  return { ok: true };
}
