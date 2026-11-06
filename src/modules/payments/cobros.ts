import 'server-only';

import type Stripe from 'stripe';

import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { filtroPlazaOcupada } from '@/modules/bookings/service';
import {
  avisarNuevaReserva,
  avisarReservaConfirmada,
} from '@/modules/notifications/service';

import { calcularReparto, repartoInsuficiente } from './dinero';

/**
 * Registro de los cobros, disparado por los webhooks de Stripe.
 *
 * Los webhooks son la fuente de verdad (ver CLAUDE.md): es aqui, y no al
 * crear la sesion de pago, donde una reserva pasa a estar pagada.
 */

/**
 * Lee de Stripe el coste real de una transaccion.
 *
 * No se estima nunca: el importe exacto esta en la `balance_transaction` del
 * cargo, y es lo que se descuenta al GM.
 */
async function costeRealDeStripe(paymentIntent: Stripe.PaymentIntent): Promise<number> {
  const cargoId =
    typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id;

  if (!cargoId) {
    throw new Error(`El PaymentIntent ${paymentIntent.id} no tiene cargo asociado`);
  }

  // Stripe adjunta la balance_transaction poco despues de confirmar el cargo,
  // y el webhook puede llegar antes. Se reintenta unas pocas veces con pausa
  // corta; si aun asi no esta, se lanza para que el webhook devuelva 500 y
  // Stripe lo reintente mas tarde, que es el comportamiento correcto.
  for (let intento = 0; intento < 4; intento++) {
    if (intento > 0) await new Promise((r) => setTimeout(r, 700 * intento));

    const cargo = await stripe().charges.retrieve(cargoId, {
      expand: ['balance_transaction'],
    });

    const transaccion = cargo.balance_transaction;

    if (transaccion && typeof transaccion !== 'string') {
      return transaccion.fee;
    }
  }

  throw new Error(
    `La balance_transaction del cargo ${cargoId} aun no esta disponible; ` +
      'se reintentara cuando Stripe reenvie el evento',
  );
}

/**
 * Marca una reserva como pagada y congela su desglose economico.
 *
 * Es idempotente: si la reserva ya estaba pagada, no hace nada. Stripe puede
 * reenviar el mismo evento, y debe poder hacerlo sin consecuencias.
 */
export async function registrarCobro(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const bookingId = paymentIntent.metadata['bookingId'];

  if (!bookingId) {
    console.warn(`PaymentIntent ${paymentIntent.id} sin bookingId en metadata`);
    return;
  }

  const reserva = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      amountCents: true,
      creditCents: true,
      commissionBps: true,
      gameId: true,
    },
  });

  if (!reserva) {
    console.warn(`PaymentIntent ${paymentIntent.id} apunta a una reserva inexistente`);
    return;
  }

  if (reserva.status === 'PAID' || reserva.status === 'COMPLETED') return;

  // Red de seguridad: la sesion de pago vive mas que los 20 minutos de la
  // plaza, asi que alguien puede llegar a pagar cuando su asiento ya se ha
  // liberado y lo ha ocupado otro. Cobrarle seria venderle algo que no existe.
  if (!(await quedaSitio(reserva.gameId, reserva.id))) {
    await devolverPorPlazaPerdida(paymentIntent, reserva.id);
    return;
  }

  const stripeFeeCents = await costeRealDeStripe(paymentIntent);

  // El reparto se calcula sobre el **precio completo**, no sobre lo que entro
  // por tarjeta: si parte se pago con saldo, el GM cobra igual su parte del
  // precio entero. Ese dinero ya esta en nuestro balance, porque el saldo
  // procede de un cobro anterior que nunca se devolvio.
  //
  // La comision es la que quedo guardada al reservar, no la vigente hoy: el
  // webhook no sabe por donde llego el jugador, y si el plan del GM cambio
  // mientras se pagaba, la plaza se vende con lo que se le ofrecio.
  const reparto = calcularReparto(
    reserva.amountCents,
    stripeFeeCents,
    reserva.commissionBps,
  );

  if (repartoInsuficiente(reparto)) {
    // No impide el cobro, pero deja constancia: ese precio no cubre ni el
    // coste de procesarlo, y el GM se quedaria sin nada.
    console.warn(
      `Reserva ${reserva.id}: el precio no cubre comision y coste de Stripe ` +
        `(${reparto.amountCents} - ${reparto.commissionCents} - ${reparto.stripeFeeCents})`,
    );
  }

  await db.$transaction([
    db.booking.update({
      where: { id: reserva.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        amountCents: reparto.amountCents,
        commissionCents: reparto.commissionCents,
        stripeFeeCents: reparto.stripeFeeCents,
        payoutCents: reparto.payoutCents,
      },
    }),
    // upsert y no create: Stripe reenvia eventos, y un reintento no puede
    // chocar contra la restriccion unica y tumbar el webhook entero.
    db.paymentEvent.upsert({
      where: { idempotencyKey: `charge:${reserva.id}` },
      update: { status: 'SUCCEEDED', stripeId: paymentIntent.id },
      create: {
        bookingId: reserva.id,
        type: 'CHARGE',
        status: 'SUCCEEDED',
        amountCents: reparto.amountCents,
        stripeId: paymentIntent.id,
        idempotencyKey: `charge:${reserva.id}`,
        rawPayload: paymentIntent as unknown as object,
      },
    }),
  ]);

  // Despues de la transaccion y no dentro: los avisos no deben alargar la
  // transaccion ni poder deshacerla. Y van despues de la salida temprana de
  // arriba, asi que un reenvio del mismo evento de Stripe no duplica el correo.
  await avisarReservaConfirmada(reserva.id);
  await avisarNuevaReserva(reserva.id);
}

/**
 * Anota un cobro fallido y libera la plaza.
 *
 * La reserva queda en FAILED, que no ocupa asiento, asi que el sitio vuelve al
 * mercado sin que intervenga ningun proceso.
 */
export async function registrarCobroFallido(
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  const bookingId = paymentIntent.metadata['bookingId'];
  if (!bookingId) return;

  const reserva = await db.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true },
  });

  // Un fallo posterior no puede tumbar una reserva ya pagada.
  if (!reserva || reserva.status !== 'PENDING') return;

  const error = paymentIntent.last_payment_error;

  // El stripeId es unico: no puede ser el del PaymentIntent a secas, porque un
  // intento que falla y luego se reintenta con exito generaria dos filas con
  // el mismo identificador. Se usa el cargo fallido cuando existe.
  const cargoFallido =
    typeof error?.charge === 'string' ? error.charge : `${paymentIntent.id}:failed`;

  const clave = `charge-failed:${reserva.id}:${cargoFallido}`;

  await db.$transaction([
    db.booking.update({ where: { id: reserva.id }, data: { status: 'FAILED' } }),
    db.paymentEvent.upsert({
      where: { idempotencyKey: clave },
      update: {},
      create: {
        bookingId: reserva.id,
        type: 'CHARGE',
        status: 'FAILED',
        amountCents: paymentIntent.amount,
        stripeId: cargoFallido,
        idempotencyKey: clave,
        failureCode: error?.code ?? null,
        failureMessage: error?.message ?? null,
        rawPayload: paymentIntent as unknown as object,
      },
    }),
  ]);
}

/**
 * Caducidad de una sesion de pago abandonada.
 *
 * La plaza ya se habia liberado sola al pasar los minutos de gracia; esto solo
 * deja el estado coherente para que la reserva no aparezca como pendiente en
 * la pagina del jugador.
 */
export async function registrarCheckoutCaducado(
  sesion: Stripe.Checkout.Session,
): Promise<void> {
  const bookingId = sesion.metadata?.['bookingId'];
  if (!bookingId) return;

  await db.booking.updateMany({
    where: { id: bookingId, status: 'PENDING' },
    data: { status: 'FAILED' },
  });
}

/** True si la partida aun admite a esta reserva concreta. */
async function quedaSitio(gameId: string, bookingId: string): Promise<boolean> {
  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: { seatsTotal: true, status: true },
  });

  if (!partida) return false;
  if (partida.status === 'CANCELLED') return false;

  // Se cuentan las plazas ocupadas por *otros*: la del propio pagador no debe
  // contarse contra el mismo.
  const ocupadasPorOtros = await db.booking.count({
    where: { gameId, id: { not: bookingId }, ...filtroPlazaOcupada() },
  });

  return ocupadasPorOtros < partida.seatsTotal;
}

/**
 * Devuelve el dinero de un cobro que llego tarde.
 *
 * Se reembolsa el importe completo: el jugador no tiene ninguna culpa de que
 * su plaza se haya ido, asi que la comision de Stripe la asume la operacion,
 * no el. Es un caso que deberia ser rarisimo.
 */
async function devolverPorPlazaPerdida(
  paymentIntent: Stripe.PaymentIntent,
  bookingId: string,
): Promise<void> {
  console.warn(
    `Reserva ${bookingId}: el pago llego cuando la plaza ya no estaba. Reembolsando.`,
  );

  const reembolso = await stripe().refunds.create(
    { payment_intent: paymentIntent.id, reason: 'requested_by_customer' },
    { idempotencyKey: `refund-plaza-perdida:${bookingId}` },
  );

  await db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    }),
    db.paymentEvent.create({
      data: {
        bookingId,
        type: 'REFUND',
        status: 'SUCCEEDED',
        amountCents: paymentIntent.amount_received,
        stripeId: reembolso.id,
        idempotencyKey: `refund-plaza-perdida:${bookingId}`,
        failureMessage: 'La plaza ya no estaba disponible al confirmarse el pago',
      },
    }),
  ]);
}

/**
 * Cierra una reserva que no necesita tarjeta.
 *
 * Ocurre con las partidas gratuitas y con las que el saldo cubre por completo.
 * No hay cobro, luego no hay coste de Stripe: el GM se lleva el precio menos
 * la comision, algo mas que en una reserva pagada con tarjeta.
 */
export async function registrarCobroSinTarjeta(bookingId: string): Promise<void> {
  const reserva = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      amountCents: true,
      creditCents: true,
      commissionBps: true,
    },
  });

  if (!reserva || reserva.status !== 'PENDING') return;

  if (reserva.amountCents > reserva.creditCents) {
    throw new Error(
      `La reserva ${bookingId} todavia tiene ${reserva.amountCents - reserva.creditCents} ` +
        'centimos pendientes: no puede cerrarse sin cobro',
    );
  }

  const reparto = calcularReparto(reserva.amountCents, 0, reserva.commissionBps);

  await db.$transaction([
    db.booking.update({
      where: { id: reserva.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        commissionCents: reparto.commissionCents,
        stripeFeeCents: 0,
        payoutCents: reparto.payoutCents,
      },
    }),
    db.paymentEvent.upsert({
      where: { idempotencyKey: `charge:${reserva.id}` },
      update: {},
      create: {
        bookingId: reserva.id,
        type: 'CHARGE',
        status: 'SUCCEEDED',
        amountCents: reserva.amountCents,
        idempotencyKey: `charge:${reserva.id}`,
        failureMessage:
          reserva.amountCents === 0
            ? 'Partida gratuita'
            : 'Cubierta integramente con saldo',
      },
    }),
  ]);

  // La salida temprana de arriba (solo sigue si estaba PENDING) es lo que
  // impide que una segunda llamada vuelva a avisar.
  await avisarReservaConfirmada(reserva.id);
  await avisarNuevaReserva(reserva.id);
}
