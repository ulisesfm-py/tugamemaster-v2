/**
 * Aritmetica del dinero.
 *
 * Todo en centimos enteros. Este modulo no habla con Stripe ni con la base de
 * datos a proposito: es logica pura y por tanto comprobable sin montar nada.
 */

import type { OrigenReserva, PlanGm } from '@/generated/prisma/enums';

/**
 * Comisiones de la plataforma, en puntos basicos (1/100 de un 1%).
 *
 * Se guardan en enteros y no como 0.10 para que el calculo no pase nunca por
 * un decimal en coma flotante.
 *
 * Estos valores solo deciden las reservas **nuevas**: cada reserva guarda el
 * suyo al reservar (`Booking.commissionBps`) y el cobro aplica el guardado.
 */
export const COMISION_ESTANDAR = 1000; // 10 %

/** Lo que paga un GM fundador por los jugadores que le trae la web. */
export const COMISION_FUNDADOR = 500; // 5 %

/** Lo que paga un GM fundador por los jugadores que trae el, con su enlace. */
export const COMISION_FUNDADOR_ENLACE = 0;

/**
 * La comision que corresponde a una reserva nueva.
 *
 * El enlace solo cuenta para un fundador: un GM estandar no tiene enlace, y si
 * deja de ser fundador pierde tambien la ventaja de sus propios jugadores.
 */
export function comisionAplicable(plan: PlanGm, origen: OrigenReserva): number {
  if (plan === 'FUNDADOR') {
    return origen === 'ENLACE_GM' ? COMISION_FUNDADOR_ENLACE : COMISION_FUNDADOR;
  }

  return COMISION_ESTANDAR;
}

/** Puntos basicos como porcentaje legible: 1000 -> "10", 1250 -> "12,5". */
export function porcentaje(puntosBasicos: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(
    puntosBasicos / 100,
  );
}

export type Reparto = {
  /** Lo que pago el jugador. */
  amountCents: number;
  /** Lo que se queda TuGameMaster. */
  commissionCents: number;
  /** Lo que cobro Stripe por la transaccion, dato real de su balance. */
  stripeFeeCents: number;
  /** Lo que recibe el GM. */
  payoutCents: number;
};

/**
 * Reparte un cobro entre plataforma, Stripe y game master.
 *
 * El coste de Stripe llega de fuera porque es un dato suyo, no una formula:
 * se lee de la `balance_transaction` del cobro. Nunca se estima. La comision
 * tambien llega de fuera: es la que quedo guardada en la reserva.
 *
 * Los costes de Stripe se descuentan del GM, no los asume la plataforma.
 */
export function calcularReparto(
  amountCents: number,
  stripeFeeCents: number,
  comisionBps: number,
): Reparto {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error(`Importe invalido: ${amountCents}`);
  }

  if (!Number.isInteger(stripeFeeCents) || stripeFeeCents < 0) {
    throw new Error(`Coste de Stripe invalido: ${stripeFeeCents}`);
  }

  if (!Number.isInteger(comisionBps) || comisionBps < 0 || comisionBps > 10_000) {
    throw new Error(`Comision invalida: ${comisionBps}`);
  }

  const commissionCents = Math.round((amountCents * comisionBps) / 10_000);

  // Con importes pequenos, el coste fijo de Stripe puede superar lo que queda
  // tras la comision. Se deja en cero antes que transferir un negativo, que
  // Stripe rechazaria, y se avisa por registro porque significa que ese precio
  // no cubre sus propios costes.
  const bruto = amountCents - commissionCents - stripeFeeCents;
  const payoutCents = Math.max(0, bruto);

  return { amountCents, commissionCents, stripeFeeCents, payoutCents };
}

/** True si el reparto no alcanza para pagar al GM: el precio es demasiado bajo. */
export function repartoInsuficiente(reparto: Reparto): boolean {
  return (
    reparto.amountCents > 0 &&
    reparto.amountCents - reparto.commissionCents - reparto.stripeFeeCents <= 0
  );
}

/** Formatea un importe en centimos para mostrarlo. */
export function formatearImporte(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(
    cents / 100,
  );
}
