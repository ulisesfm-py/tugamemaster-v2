import 'server-only';

import type { BookingStatus } from '@/generated/prisma/enums';
import { db } from '@/lib/db';
import { abonar, bloquearMonedero, gastarHasta } from '@/modules/wallet/service';

import {
  hayDerechoADevolucion,
  importeDevolucionCents,
  PORCENTAJE_DEVOLUCION,
} from './politica';

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
  | {
      ok: true;
      bookingId: string;
      /** True si no queda nada que cobrar con tarjeta. */
      gratuita: boolean;
      /** Cuanto se ha cubierto con saldo del monedero. */
      creditoAplicadoCents: number;
      /** Lo que queda por pagar con tarjeta. */
      pendienteCents: number;
    }
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

    // El monedero se bloquea AQUI, antes de insertar nada.
    //
    // Insertar la reserva toma un lock de clave ajena sobre la fila del
    // usuario. Si el bloqueo se pidiera despues, dos reservas simultaneas del
    // mismo usuario tendrian ambas ese lock compartido y ambas intentarian
    // subirlo a exclusivo: deadlock garantizado. Pidiendolo primero, una
    // espera a la otra y no hay ciclo.
    if (precio > 0) {
      await bloquearMonedero(userId, tx);
    }

    // Si hubo una reserva cancelada antes, se reutiliza la fila: la
    // restriccion unica (gameId, userId) impide crear otra.
    const datos = {
      status: 'PENDING' as const,
      amountCents: precio,
      currency: conCampana?.currency ?? 'EUR',
      creditCents: 0,
      cancelledAt: null,
      paidAt: null,
      commissionCents: null,
      stripeFeeCents: null,
      payoutCents: null,
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

    // El saldo ya esta bloqueado: nadie mas puede gastarlo mientras se decide
    // cuanto se aplica a esta reserva.
    let creditoAplicadoCents = 0;

    if (precio > 0) {
      creditoAplicadoCents = await gastarHasta(userId, precio, booking.id, tx);

      if (creditoAplicadoCents > 0) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { creditCents: creditoAplicadoCents },
        });
      }
    }

    const pendienteCents = precio - creditoAplicadoCents;

    return {
      ok: true as const,
      bookingId: booking.id,
      // Sin nada que cobrar: o la partida es gratuita, o el saldo lo cubre
      // todo. En ambos casos no hay que pasar por Stripe.
      gratuita: pendienteCents === 0,
      creditoAplicadoCents,
      pendienteCents,
    };
  });
}

export type ResultadoCancelacion =
  { ok: true; devueltoCents: number } | { ok: false; mensaje: string };

/**
 * El jugador libera su plaza.
 *
 * Con mas de 48 horas de antelacion se le devuelve el 90% en saldo. Dentro de
 * ese plazo puede liberar la plaza igualmente, pero sin devolucion: el game
 * master ya ha preparado la partida contando con el.
 *
 * La devolucion es saldo y no dinero a la tarjeta: asi no hay un segundo cobro
 * de Stripe que nadie tenga que asumir.
 */
export async function cancelarReserva(
  bookingId: string,
  userId: string,
): Promise<ResultadoCancelacion> {
  const reserva = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      userId: true,
      status: true,
      amountCents: true,
      game: { select: { startsAt: true, title: true } },
    },
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

  // Solo se devuelve lo que se llego a pagar. Una reserva PENDING nunca se
  // cobro, asi que no hay nada que abonar.
  const sePago = ESTADOS_PAGADOS.includes(reserva.status);
  const conDevolucion = sePago && hayDerechoADevolucion(reserva.game.startsAt);

  const devueltoCents = conDevolucion
    ? importeDevolucionCents(reserva.amountCents, PORCENTAJE_DEVOLUCION)
    : 0;

  await db.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    if (devueltoCents > 0) {
      await abonar(
        {
          userId,
          amountCents: devueltoCents,
          type: 'REFUND_CREDIT',
          bookingId,
          note: `Cancelación de ${reserva.game.title} (${PORCENTAJE_DEVOLUCION}%)`,
        },
        tx,
      );
    }
  });

  return { ok: true, devueltoCents };
}
