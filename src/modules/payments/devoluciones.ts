import 'server-only';

import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { saldoDe } from '@/modules/wallet/service';

/**
 * Conversion de saldo en dinero real.
 *
 * Por defecto las devoluciones son saldo. Esto es la valvula de escape: cuando
 * alguien reclama que quiere su dinero de vuelta, un administrador puede
 * devolverlo a la tarjeta. Existe para que un caso aislado no acabe en una
 * reclamacion de consumo o en un chargeback, que salen mucho mas caros.
 */

export type ResultadoDevolucion =
  { ok: true; devueltoCents: number } | { ok: false; mensaje: string };

/**
 * Devuelve a la tarjeta el importe de una reserva concreta.
 *
 * Solo puede devolverse lo que realmente se cobro con tarjeta: si parte se
 * pago con saldo, esa parte no tiene a donde volver y sigue siendo saldo.
 *
 * Se descuenta del monedero del usuario, asi que no puede cobrar dos veces lo
 * mismo: una vez en saldo y otra en dinero.
 */
export async function devolverADinero(
  bookingId: string,
  adminId: string,
  nota: string,
): Promise<ResultadoDevolucion> {
  const reserva = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      amountCents: true,
      creditCents: true,
      currency: true,
      game: { select: { title: true } },
      paymentEvents: {
        where: { type: 'CHARGE', status: 'SUCCEEDED' },
        select: { stripeId: true },
      },
    },
  });

  if (!reserva) return { ok: false, mensaje: 'Esa reserva no existe' };

  const cobradoConTarjeta = reserva.amountCents - reserva.creditCents;

  if (cobradoConTarjeta <= 0) {
    return {
      ok: false,
      mensaje:
        'Esta reserva se pagó íntegramente con saldo: no hay nada que devolver a una tarjeta',
    };
  }

  const paymentIntentId = reserva.paymentEvents[0]?.stripeId;

  if (!paymentIntentId) {
    return { ok: false, mensaje: 'No se encuentra el cobro original en Stripe' };
  }

  // El usuario tiene que tener saldo suficiente: si ya se lo gasto, devolverle
  // ademas el dinero seria pagarle dos veces.
  const saldo = await saldoDe(reserva.userId);

  if (saldo < cobradoConTarjeta) {
    return {
      ok: false,
      mensaje:
        `El usuario solo tiene ${(saldo / 100).toFixed(2)} EUR de saldo y ya ha gastado ` +
        'el resto. Ajusta el importe a mano antes de devolver.',
    };
  }

  const reembolso = await stripe().refunds.create(
    {
      payment_intent: paymentIntentId,
      amount: cobradoConTarjeta,
      reason: 'requested_by_customer',
      metadata: { bookingId: reserva.id, adminId },
    },
    { idempotencyKey: `cashout:${reserva.id}` },
  );

  await db.$transaction([
    // Apunte negativo: el saldo se convierte en dinero y deja de estar
    // disponible en la plataforma.
    db.walletEntry.create({
      data: {
        userId: reserva.userId,
        amountCents: -cobradoConTarjeta,
        currency: reserva.currency,
        type: 'CASH_OUT',
        bookingId: reserva.id,
        note: nota.trim() || `Devuelto a la tarjeta: ${reserva.game.title}`,
        createdById: adminId,
      },
    }),
    db.paymentEvent.upsert({
      where: { idempotencyKey: `cashout:${reserva.id}` },
      update: {},
      create: {
        bookingId: reserva.id,
        type: 'REFUND',
        status: 'SUCCEEDED',
        amountCents: cobradoConTarjeta,
        currency: reserva.currency,
        stripeId: reembolso.id,
        idempotencyKey: `cashout:${reserva.id}`,
        failureMessage: nota.trim() || 'Devolución a la tarjeta decidida por un admin',
      },
    }),
  ]);

  return { ok: true, devueltoCents: cobradoConTarjeta };
}
