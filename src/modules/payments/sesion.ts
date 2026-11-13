import type Stripe from 'stripe';

/**
 * Los parametros de la sesion de Stripe Checkout de una reserva.
 *
 * Logica pura, sin base de datos ni llamadas a Stripe: recibe datos sueltos y
 * devuelve el objeto que se le manda a Stripe, para poder comprobar en un test
 * lo que se cobra y como, sin cobrar nada.
 */

/**
 * Metodos de pago admitidos: **solo tarjeta**.
 *
 * Sin esto, Stripe ensena todos los metodos que haya activados en su panel
 * (iDEAL, Bancontact, EPS...). Son metodos de otros paises, que ningun jugador
 * de aqui usa, y cada uno es un camino del dinero que no se ha probado: otras
 * formas de fallar o caducar, y un coste de Stripe distinto que se le descuenta
 * al game master segun como pague el jugador. Apple Pay y Google Pay siguen
 * saliendo: son tarjeta por debajo.
 */
export const METODOS_DE_PAGO = ['card'] as const;

export type DatosDeSesion = {
  bookingId: string;
  email: string;
  titulo: string;
  sistema: string;
  empieza: Date;
  currency: string;
  /** Lo que se cobra con tarjeta: el total menos lo que cubre el saldo. */
  pendienteCents: number;
  creditoCents: number;
  /** Direccion de la web, sin barra final. */
  base: string;
  slugPartida: string;
};

export function parametrosDeSesion(
  d: DatosDeSesion,
): Stripe.Checkout.SessionCreateParams {
  const fecha = d.empieza.toLocaleDateString('es-ES', { dateStyle: 'long' });

  return {
    mode: 'payment',
    payment_method_types: [...METODOS_DE_PAGO],
    customer_email: d.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: d.currency.toLowerCase(),
          unit_amount: d.pendienteCents,
          product_data: {
            name: d.titulo,
            description:
              `${d.sistema} · ${fecha}` +
              (d.creditoCents > 0
                ? ` · ${(d.creditoCents / 100).toFixed(2)} EUR cubiertos con tu saldo`
                : ''),
          },
        },
      },
    ],
    // El bookingId viaja en los metadatos del PaymentIntent, no solo en los de
    // la sesion: el webhook de pago recibe el PaymentIntent, y asi no hace
    // falta volver a consultar la sesion para saber que reserva es.
    payment_intent_data: {
      metadata: { bookingId: d.bookingId },
    },
    metadata: { bookingId: d.bookingId },
    success_url: `${d.base}/partidas/${d.slugPartida}?pago=ok`,
    cancel_url: `${d.base}/partidas/${d.slugPartida}?pago=cancelado`,
    locale: 'es',
  };
}
