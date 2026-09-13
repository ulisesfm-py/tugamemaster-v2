import 'server-only';

import type { BookingStatus } from '@/generated/prisma/enums';
import { db } from '@/lib/db';

/**
 * Reserva de asientos.
 *
 * En esta fase todavia no hay cobro: reservar solo ocupa la plaza. El dinero
 * entra en la fase de pagos, donde `reservarAsiento` pasara a crear ademas el
 * PaymentIntent.
 */

/**
 * Estados que ocupan plaza de forma definitiva. Una reserva fallida o
 * cancelada la libera.
 *
 * Se declara mutable a proposito: Prisma no acepta arrays readonly en `in`.
 */
export const ESTADOS_PAGADOS: BookingStatus[] = ['PAID', 'COMPLETED'];

/**
 * Cuanto tiempo se le guarda la plaza a quien esta pagando.
 *
 * Una reserva PENDING es alguien que esta en la pantalla de pago. Si abandona,
 * su plaza no puede quedar bloqueada para siempre; pasado este plazo deja de
 * contar en el aforo.
 */
export const MINUTOS_DE_GRACIA = 20;

/**
 * Condicion de "esta plaza esta ocupada", para usar en cualquier consulta.
 *
 * Se expresa como filtro y no como lista de estados porque las reservas
 * PENDING caducan: no hace falta ningun proceso de limpieza, simplemente
 * dejan de contar.
 */
export function filtroPlazaOcupada() {
  return {
    OR: [
      { status: { in: ESTADOS_PAGADOS } },
      {
        status: 'PENDING' as const,
        createdAt: { gte: new Date(Date.now() - MINUTOS_DE_GRACIA * 60_000) },
      },
    ],
  };
}

export type ResultadoReserva =
  | { ok: true; bookingId: string; gratuita: boolean }
  | {
      ok: false;
      error:
        | 'NO_DISPONIBLE'
        | 'COMPLETA'
        | 'YA_RESERVADA'
        | 'ES_TU_PARTIDA'
        | 'SOLO_CONTINUACION';
      mensaje: string;
    };

/**
 * Reserva un asiento para un jugador.
 *
 * El control de aforo va dentro de una transaccion con `SELECT ... FOR UPDATE`
 * sobre la fila de la partida. Sin ese bloqueo, dos jugadores que pulsan a la
 * vez leerian ambos "queda 1 plaza" y ambos entrarian: la comprobacion y la
 * insercion tienen que ser atomicas.
 *
 * La restriccion unica (gameId, userId) cubre un caso distinto: el mismo
 * jugador pulsando dos veces.
 */
export async function reservarAsiento(
  gameId: string,
  userId: string,
): Promise<ResultadoReserva> {
  return db.$transaction(async (tx) => {
    // Bloquea la fila de la partida hasta el final de la transaccion.
    const filas = await tx.$queryRaw<
      { id: string; seatsTotal: number; status: string; startsAt: Date; gmId: string }[]
    >`
      SELECT "id", "seatsTotal", "status"::text, "startsAt", "gmId"
      FROM "Game"
      WHERE "id" = ${gameId}
      FOR UPDATE
    `;

    const partida = filas[0];

    if (!partida || partida.status !== 'PUBLISHED') {
      return {
        ok: false as const,
        error: 'NO_DISPONIBLE' as const,
        mensaje: 'Esta partida no admite reservas',
      };
    }

    if (partida.startsAt.getTime() <= Date.now()) {
      return {
        ok: false as const,
        error: 'NO_DISPONIBLE' as const,
        mensaje: 'Esta partida ya ha empezado',
      };
    }

    const gm = await tx.gmProfile.findUnique({
      where: { id: partida.gmId },
      select: { userId: true },
    });

    if (gm?.userId === userId) {
      return {
        ok: false as const,
        error: 'ES_TU_PARTIDA' as const,
        mensaje: 'No puedes reservar plaza en tu propia partida',
      };
    }

    // Continuacion de campana: solo quien jugo la sesion anterior. La lista de
    // admitidos se deriva de quien pago, no de una lista aparte.
    const conCampana = await tx.game.findUnique({
      where: { id: gameId },
      select: { previousGameId: true, priceCents: true, currency: true },
    });

    if (conCampana?.previousGameId) {
      const jugoLaAnterior = await tx.booking.findFirst({
        where: {
          gameId: conCampana.previousGameId,
          userId,
          status: { in: ['PAID', 'COMPLETED'] },
        },
        select: { id: true },
      });

      if (!jugoLaAnterior) {
        return {
          ok: false as const,
          error: 'SOLO_CONTINUACION' as const,
          mensaje: 'Esta sesion es solo para quienes jugaron la anterior',
        };
      }
    }

    const yaReservada = await tx.booking.findUnique({
      where: { gameId_userId: { gameId, userId } },
      select: { id: true, status: true },
    });

    if (yaReservada && ESTADOS_PAGADOS.includes(yaReservada.status)) {
      return {
        ok: false as const,
        error: 'YA_RESERVADA' as const,
        mensaje: 'Ya tienes plaza en esta partida',
      };
    }

    const ocupadas = await tx.booking.count({
      where: { gameId, ...filtroPlazaOcupada() },
    });

    if (ocupadas >= partida.seatsTotal) {
      return {
        ok: false as const,
        error: 'COMPLETA' as const,
        mensaje: 'No quedan plazas libres',
      };
    }

    const precio = conCampana?.priceCents ?? 0;
    const gratuita = precio === 0;

    // Si hubo una reserva cancelada antes, se reutiliza la fila: la
    // restriccion unica (gameId, userId) impide crear otra.
    //
    // Una partida gratuita queda pagada en el acto: no hay nada que cobrar y
    // dejarla en PENDING haria que caducase a los 20 minutos.
    const datos = {
      status: gratuita ? ('PAID' as const) : ('PENDING' as const),
      amountCents: precio,
      currency: conCampana?.currency ?? 'EUR',
      cancelledAt: null,
      paidAt: gratuita ? new Date() : null,
      commissionCents: gratuita ? 0 : null,
      stripeFeeCents: gratuita ? 0 : null,
      payoutCents: gratuita ? 0 : null,
    };

    const booking = yaReservada
      ? await tx.booking.update({
          where: { id: yaReservada.id },
          data: datos,
          select: { id: true },
        })
      : await tx.booking.create({
          data: { gameId, userId, ...datos },
          select: { id: true },
        });

    return { ok: true as const, bookingId: booking.id, gratuita };
  });
}

export type ResultadoCancelacion = { ok: true } | { ok: false; mensaje: string };

/**
 * El jugador libera su plaza.
 *
 * Sin dinero de por medio esto es trivial. Cuando existan cobros habra que
 * aplicar aqui la politica de cancelacion (gratis hasta 48h antes) y disparar
 * el reembolso.
 */
export async function cancelarReserva(
  bookingId: string,
  userId: string,
): Promise<ResultadoCancelacion> {
  const reserva = await db.booking.findUnique({
    where: { id: bookingId },
    select: { userId: true, status: true, game: { select: { startsAt: true } } },
  });

  if (!reserva || reserva.userId !== userId) {
    return { ok: false, mensaje: 'Esa reserva no es tuya' };
  }

  if (!['PENDING', ...ESTADOS_PAGADOS].includes(reserva.status)) {
    return { ok: false, mensaje: 'Esa reserva ya no esta activa' };
  }

  if (reserva.game.startsAt.getTime() <= Date.now()) {
    return { ok: false, mensaje: 'La partida ya ha empezado' };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  return { ok: true };
}
