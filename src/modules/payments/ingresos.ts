import 'server-only';

import { db } from '@/lib/db';

import {
  estadoDelDinero,
  resumirIngresos,
  sumarLineas,
  type LineaDeReserva,
} from './libro';

/**
 * Lo que un game master ha ganado, de donde sale y donde esta.
 *
 * El modelo ya guardaba todo lo necesario —`Payout` cuelga de `PayoutItem`,
 * que cuelga de `Booking`, que cuelga de la partida y del jugador— pero no
 * habia ninguna consulta que lo leyera: el GM cobraba sin poder ver nunca
 * cuanto ni por que. Esto es esa consulta.
 *
 * Se agrupa **por partida** porque asi es como se mueve el dinero: una
 * transferencia por mesa, 48 horas despues de jugarla. Dentro de cada una se
 * detalla asiento por asiento, que es el unico nivel donde existe «el jugador
 * que pago».
 */

/** Estados de reserva en los que el jugador llego a pagar. */
const PAGARON = ['PAID', 'COMPLETED', 'REFUNDED', 'CANCELLED'] as const;

/** Lo que aporta cada reserva, y si aporta. */
function lineaDe(reserva: {
  status: string;
  amountCents: number;
  commissionCents: number | null;
  stripeFeeCents: number | null;
  payoutCents: number | null;
}): LineaDeReserva {
  // Una plaza devuelta o liberada no llega al game master: se ensena porque es
  // dinero que estuvo ahi y dejo de estarlo, pero no suma.
  const cuenta = reserva.status === 'PAID' || reserva.status === 'COMPLETED';

  return {
    brutoCents: reserva.amountCents,
    comisionCents: reserva.commissionCents ?? 0,
    pasarelaCents: reserva.stripeFeeCents ?? 0,
    netoCents: reserva.payoutCents ?? 0,
    cuenta,
  };
}

/**
 * El libro completo de un game master.
 *
 * `ahora` se pasa de fuera para poder comprobar el calculo sin depender del
 * reloj de quien ejecuta las pruebas.
 */
export async function ingresosDeGm(userId: string, ahora = new Date()) {
  const gm = await db.gmProfile.findUnique({
    where: { userId },
    select: { id: true, payoutsEnabled: true, stripeAccountId: true, plan: true },
  });

  if (!gm) return null;

  const partidas = await db.game.findMany({
    where: {
      gmId: gm.id,
      // Solo las que movieron dinero: un borrador que nadie reservo no es un
      // apunte, es una pagina en blanco.
      bookings: { some: { status: { in: [...PAGARON] }, paidAt: { not: null } } },
    },
    orderBy: { startsAt: 'desc' },
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      startsAt: true,
      endsAt: true,
      status: true,
      currency: true,
      payout: {
        select: {
          status: true,
          amountCents: true,
          scheduledFor: true,
          paidAt: true,
          blockedReason: true,
          stripeTransferId: true,
        },
      },
      bookings: {
        where: { status: { in: [...PAGARON] }, paidAt: { not: null } },
        orderBy: { paidAt: 'asc' },
        select: {
          id: true,
          status: true,
          amountCents: true,
          creditCents: true,
          commissionBps: true,
          commissionCents: true,
          stripeFeeCents: true,
          payoutCents: true,
          paidAt: true,
          user: { select: { name: true, slug: true, image: true } },
        },
      },
    },
  });

  const libro = partidas.map((partida) => {
    const reservas = partida.bookings.map((reserva) => ({
      ...reserva,
      linea: lineaDe(reserva),
    }));

    return {
      ...partida,
      estado: estadoDelDinero(partida, partida.payout, ahora),
      reservas,
      total: sumarLineas(reservas.map((r) => r.linea)),
    };
  });

  return {
    gm,
    partidas: libro,
    resumen: resumirIngresos(libro),
  };
}

/**
 * Solo las cifras, sin el detalle.
 *
 * El panel enseña dos numeros y un enlace; cargar ahi el libro entero —cien
 * partidas con sus jugadores— seria traerse toda la contabilidad para pintar
 * dos lineas. Comparte el calculo con `ingresosDeGm`, asi que las dos
 * pantallas no pueden decir cosas distintas.
 */
export async function resumenDeGm(userId: string, ahora = new Date()) {
  const gm = await db.gmProfile.findUnique({
    where: { userId },
    select: { id: true, payoutsEnabled: true },
  });

  if (!gm) return null;

  const partidas = await db.game.findMany({
    where: {
      gmId: gm.id,
      bookings: { some: { status: { in: [...PAGARON] }, paidAt: { not: null } } },
    },
    select: {
      endsAt: true,
      status: true,
      payout: { select: { status: true } },
      bookings: {
        where: { status: { in: [...PAGARON] }, paidAt: { not: null } },
        select: {
          status: true,
          amountCents: true,
          commissionCents: true,
          stripeFeeCents: true,
          payoutCents: true,
        },
      },
    },
  });

  const libro = partidas.map((partida) => ({
    estado: estadoDelDinero(partida, partida.payout, ahora),
    total: sumarLineas(partida.bookings.map(lineaDe)),
  }));

  return { gm, resumen: resumirIngresos(libro) };
}
