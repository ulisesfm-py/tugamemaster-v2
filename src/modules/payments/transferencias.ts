/**
 * Reglas de la transferencia al game master.
 *
 * Logica pura: no habla con Stripe ni con la base de datos. Decide que hacer
 * con lo que `payouts.ts` le cuenta, y por eso se puede comprobar caso por
 * caso sin mover dinero.
 *
 * Tres ideas, todas para que **nunca se pague dos veces** y para que un pago
 * rechazado se reintente de verdad:
 *
 * 1. **Antes de transferir se pregunta a Stripe** si ya existe una
 *    transferencia para esa partida (todas llevan `transfer_group` = id de la
 *    partida). Si existe, no se crea otra. Es el seguro de fondo: pase lo que
 *    pase con nuestra base o con las claves, Stripe tiene la ultima palabra.
 * 2. **Solo se transfiere con dinero disponible.** Stripe tarda dias en
 *    liberar un cobro; intentarlo antes era garantizar un rechazo.
 * 3. **La clave de idempotencia cambia solo tras un rechazo claro.** Stripe
 *    guarda la respuesta de cada clave al menos 24 horas y la devuelve tal
 *    cual: el 20/11/2026 el reintento devolvio el mismo rechazo, con el mismo
 *    `req_`, que la noche anterior. Si Stripe rechazo la peticion, no se movio
 *    dinero y una clave nueva es segura. Si no se sabe que paso (se corto la
 *    conexion, Stripe dio un 500), se mantiene la clave: si la transferencia
 *    llego a crearse, la misma clave la devuelve en vez de crear otra.
 */

/** Por que el pago esta esperando y no ha fallado. Es lo que lee el GM. */
export const MOTIVO_ESPERANDO_FONDOS =
  'Stripe todavía no ha liberado el dinero de los cobros de esta partida. La transferencia sale sola en cuanto esté disponible';

/** Una transferencia que Stripe ya tiene para la partida. */
export type TransferenciaExistente = {
  id: string;
  amount: number;
  amountReversed: number;
};

export type Decision =
  /** Ya hay una transferencia por el importe justo: se apunta como pagada. */
  | { tipo: 'YA_PAGADA'; transferId: string }
  /** Hay algo en Stripe que no cuadra: no se toca y lo mira un admin. */
  | { tipo: 'REVISAR'; motivo: string }
  /** No hay dinero disponible todavia: se espera, sin llamar a Stripe. */
  | { tipo: 'ESPERAR_FONDOS' }
  | { tipo: 'TRANSFERIR' };

/**
 * Que hacer con una partida lista para pagar.
 *
 * El orden importa: lo que ya existe en Stripe va antes que cualquier otra
 * cosa. Con una transferencia hecha, da igual el saldo.
 */
export function decidirTransferencia(datos: {
  existentes: TransferenciaExistente[];
  totalCents: number;
  /** Saldo disponible en la moneda de la partida. */
  disponibleCents: number;
}): Decision {
  if (datos.existentes.length > 1) {
    return {
      tipo: 'REVISAR',
      motivo:
        'Stripe tiene más de una transferencia para esta partida; la revisa un administrador',
    };
  }

  const existente = datos.existentes[0];

  if (existente) {
    // Una revertida, o una por otro importe, no es este pago: no se crea otra
    // encima ni se da por pagada. Que lo mire una persona.
    if (existente.amountReversed > 0 || existente.amount !== datos.totalCents) {
      return {
        tipo: 'REVISAR',
        motivo:
          'Ya hay una transferencia en Stripe para esta partida que no cuadra; la revisa un administrador',
      };
    }

    return { tipo: 'YA_PAGADA', transferId: existente.id };
  }

  if (datos.disponibleCents < datos.totalCents) return { tipo: 'ESPERAR_FONDOS' };

  return { tipo: 'TRANSFERIR' };
}

/**
 * La clave de idempotencia de la transferencia de una partida.
 *
 * El primer intento conserva la forma de siempre (`payout:<partida>:<importe>`)
 * para que una transferencia lanzada antes de este cambio siga reconociendose.
 * Cada rechazo claro suma un intento y estrena clave.
 */
export function claveDeTransferencia(
  gameId: string,
  totalCents: number,
  rechazosPrevios: number,
): string {
  const base = `payout:${gameId}:${totalCents}`;
  return rechazosPrevios > 0 ? `${base}:r${rechazosPrevios}` : base;
}

export type Fallo =
  /** Stripe rechazo la peticion: no se movio dinero. */
  | { tipo: 'RECHAZO'; codigo: string | null; sinFondos: boolean; mensaje: string }
  /** No se sabe si la transferencia llego a crearse. */
  | { tipo: 'INCIERTO'; mensaje: string };

/**
 * Los errores en los que Stripe dice «no» sin haber hecho nada.
 *
 * Son los del SDK para peticiones invalidas (saldo insuficiente, cuenta de
 * destino que no admite transferencias…) y de permisos. Todo lo demas —corte
 * de conexion, error interno de Stripe, limite de peticiones, un conflicto de
 * clave o cualquier cosa que no reconozcamos— es incierto.
 */
const RECHAZOS = new Set(['StripeInvalidRequestError', 'StripePermissionError']);

/** Clasifica lo que ha lanzado `transfers.create`. */
export function clasificarFallo(error: unknown): Fallo {
  const e = (typeof error === 'object' && error !== null ? error : {}) as {
    type?: unknown;
    code?: unknown;
    message?: unknown;
  };

  const mensaje = typeof e.message === 'string' ? e.message : String(error);

  if (typeof e.type === 'string' && RECHAZOS.has(e.type)) {
    const codigo = typeof e.code === 'string' ? e.code : null;
    return {
      tipo: 'RECHAZO',
      codigo,
      sinFondos: codigo === 'balance_insufficient',
      mensaje,
    };
  }

  return { tipo: 'INCIERTO', mensaje };
}
