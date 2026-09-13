/**
 * Aritmetica del dinero.
 *
 * Todo en centimos enteros. Este modulo no habla con Stripe ni con la base de
 * datos a proposito: es logica pura y por tanto comprobable sin montar nada.
 */

/**
 * Comision de la plataforma, en puntos basicos (1/100 de un 1%).
 *
 * Se guarda en enteros y no como 0.05 para que el calculo no pase nunca por un
 * decimal en coma flotante.
 */
export const COMISION_PUNTOS_BASICOS = 500; // 5,00 %

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
 * se lee de la `balance_transaction` del cobro. Nunca se estima.
 *
 * Los costes de Stripe se descuentan del GM, no los asume la plataforma.
 */
export function calcularReparto(amountCents: number, stripeFeeCents: number): Reparto {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error(`Importe invalido: ${amountCents}`);
  }

  if (!Number.isInteger(stripeFeeCents) || stripeFeeCents < 0) {
    throw new Error(`Coste de Stripe invalido: ${stripeFeeCents}`);
  }

  const commissionCents = Math.round((amountCents * COMISION_PUNTOS_BASICOS) / 10_000);

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
