import 'server-only';

import { db } from '@/lib/db';
import { stripe, urlBase } from '@/lib/stripe';

import { parametrosDeSesion } from './sesion';

/**
 * Cobro al jugador mediante Stripe Checkout.
 *
 * Se usa la pagina alojada de Stripe: el jugador sale a stripe.com, paga y
 * vuelve. Stripe se encarga del 3DS, de las carteras moviles, de los idiomas y
 * de la accesibilidad. En el camino del dinero, cuanto menos codigo propio,
 * mejor.
 *
 * El cobro es inmediato y el dinero queda en el balance de la plataforma. La
 * transferencia al GM ocurre 48h despues de la partida, en el job diario.
 */

export type ResultadoCheckout =
  { ok: true; url: string } | { ok: false; mensaje: string };

/**
 * Crea la sesion de pago de una reserva.
 *
 * No se fija `expires_at`: seria un parametro que cambia en cada llamada y
 * romperia la idempotencia, porque Stripe exige que una misma clave se use
 * siempre con los mismos parametros.
 *
 * Que la sesion viva mas que los 20 minutos de la plaza no es un problema:
 * `registrarCobro` comprueba el aforo antes de dar la reserva por buena y
 * reembolsa si la plaza ya no esta.
 */
export async function crearSesionDeCheckout(
  bookingId: string,
): Promise<ResultadoCheckout> {
  const reserva = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      amountCents: true,
      creditCents: true,
      currency: true,
      user: { select: { email: true } },
      game: {
        select: { title: true, slug: true, system: true, startsAt: true },
      },
    },
  });

  if (!reserva) return { ok: false, mensaje: 'Esa reserva no existe' };

  if (reserva.status !== 'PENDING') {
    return { ok: false, mensaje: 'Esta reserva ya no está pendiente de pago' };
  }

  // Solo se cobra lo que el saldo no cubre.
  const pendienteCents = reserva.amountCents - reserva.creditCents;

  if (pendienteCents <= 0) {
    return {
      ok: false,
      mensaje: 'Esta reserva no necesita pago: la cubre tu saldo',
    };
  }

  const base = urlBase();

  const sesion = await stripe().checkout.sessions.create(
    parametrosDeSesion({
      bookingId: reserva.id,
      email: reserva.user.email,
      titulo: reserva.game.title,
      sistema: reserva.game.system,
      empieza: reserva.game.startsAt,
      currency: reserva.currency,
      pendienteCents,
      creditoCents: reserva.creditCents,
      base,
      slugPartida: reserva.game.slug,
    }),
    {
      // Una misma reserva produce siempre la misma sesion: si el jugador
      // recarga o pulsa dos veces, no se generan dos cobros.
      idempotencyKey: `checkout:${reserva.id}`,
    },
  );

  if (!sesion.url) {
    return { ok: false, mensaje: 'Stripe no devolvio una URL de pago' };
  }

  return { ok: true, url: sesion.url };
}
