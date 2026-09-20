/**
 * El libro de ingresos de un game master.
 *
 * Logica pura: no habla con la base de datos ni con Stripe, asi que se puede
 * comprobar sin montar nada. Quien consulta las filas es `ingresos.ts`.
 *
 * La idea de fondo: **el estado del dinero de una partida no se guarda, se
 * deduce**. Un `Payout` solo existe cuando el cron lo crea, 48 horas despues
 * de terminar la mesa; antes de eso el dinero del GM esta igual de
 * comprometido, pero no hay fila que lo diga. Si la pagina se limitara a
 * listar `Payout`, un GM con tres partidas vendidas y ninguna jugada veria
 * cero euros y pensaria que la web se ha comido su dinero.
 */

/** En que punto del camino esta el dinero de una partida. */
export type EstadoDelDinero =
  /** La partida aun no se ha jugado. */
  | 'FUTURA'
  /** Jugada, dentro del plazo de retencion de 48 h. */
  | 'EN_ESPERA'
  /** Pasado el plazo: la transferencia esta en marcha. */
  | 'EN_CAMINO'
  /** Transferido a su cuenta. */
  | 'PAGADO'
  /** Detenido por una incidencia o por la cuenta sin verificar. */
  | 'RETENIDO'
  /** Stripe rechazo la transferencia. */
  | 'FALLIDO';

/** Como se llama y que se explica de cada estado. */
export const ESTADO_DEL_DINERO: Record<
  EstadoDelDinero,
  { texto: string; explicacion: string; tono: 'bien' | 'espera' | 'mal' | 'apagado' }
> = {
  FUTURA: {
    texto: 'Cuando se juegue',
    explicacion: 'Tus jugadores ya han pagado. El dinero se mueve al terminar la mesa.',
    tono: 'apagado',
  },
  EN_ESPERA: {
    texto: 'En el plazo de 48 h',
    explicacion:
      'La mesa ya se ha jugado. Esperamos 48 horas por si alguien reporta una incidencia.',
    tono: 'espera',
  },
  EN_CAMINO: {
    texto: 'En camino',
    explicacion: 'La transferencia sale en la próxima ejecución del pago automático.',
    tono: 'espera',
  },
  PAGADO: {
    texto: 'Pagado',
    explicacion: 'Transferido a tu cuenta de Stripe.',
    tono: 'bien',
  },
  RETENIDO: {
    texto: 'Retenido',
    explicacion: 'Hay algo que resolver antes de poder transferirlo.',
    tono: 'mal',
  },
  FALLIDO: {
    texto: 'Falló la transferencia',
    explicacion: 'Lo reintentamos solos. Si se repite, revisa tu cuenta de cobro.',
    tono: 'mal',
  },
};

/**
 * Horas que el dinero se retiene tras terminar la partida.
 *
 * Vive aqui, en la parte pura, y `payouts.ts` la importa: es el mismo plazo
 * que ejecuta el cron y el que la pagina le promete al game master. Con una
 * copia en cada sitio, cambiar el plazo dejaria a la web mintiendo.
 */
export const HORAS_DE_RETENCION = 48;

/**
 * Deduce en que punto esta el dinero de una partida.
 *
 * El orden importa: lo que ya dice una fila de `Payout` manda sobre cualquier
 * deduccion por fechas. Solo cuando no hay `Payout` —o esta pendiente— se mira
 * el reloj, porque entonces el estado real es «el cron todavia no ha pasado».
 */
export function estadoDelDinero(
  partida: { endsAt: Date; status: string },
  payout: { status: string } | null,
  ahora = new Date(),
): EstadoDelDinero {
  if (payout?.status === 'PAID') return 'PAGADO';
  if (payout?.status === 'BLOCKED') return 'RETENIDO';
  if (payout?.status === 'FAILED') return 'FALLIDO';

  if (partida.status === 'CANCELLED') return 'RETENIDO';

  const terminada = partida.endsAt.getTime() <= ahora.getTime();
  if (!terminada) return 'FUTURA';

  // Un Payout pendiente ya esta en marcha, se haya cumplido el plazo o no.
  if (payout?.status === 'PENDING') return 'EN_CAMINO';

  const limite = partida.endsAt.getTime() + HORAS_DE_RETENCION * 3_600_000;
  return ahora.getTime() < limite ? 'EN_ESPERA' : 'EN_CAMINO';
}

/** Una linea del libro: lo que aporta una reserva. */
export type LineaDeReserva = {
  /** Lo que pago el jugador por su plaza. */
  brutoCents: number;
  /** Lo que se queda la plataforma. */
  comisionCents: number;
  /** Lo que cobro Stripe por la transaccion. */
  pasarelaCents: number;
  /** Lo que le queda al game master. */
  netoCents: number;
  /** False si la reserva se devolvio: no aporta nada, pero se ensena. */
  cuenta: boolean;
};

/** Suma de varias lineas. Las devueltas no suman. */
export function sumarLineas(lineas: readonly LineaDeReserva[]): LineaDeReserva {
  return lineas.reduce<LineaDeReserva>(
    (total, linea) =>
      linea.cuenta
        ? {
            brutoCents: total.brutoCents + linea.brutoCents,
            comisionCents: total.comisionCents + linea.comisionCents,
            pasarelaCents: total.pasarelaCents + linea.pasarelaCents,
            netoCents: total.netoCents + linea.netoCents,
            cuenta: true,
          }
        : total,
    { brutoCents: 0, comisionCents: 0, pasarelaCents: 0, netoCents: 0, cuenta: true },
  );
}

export type Resumen = {
  /** Ya transferido a su cuenta. */
  cobradoCents: number;
  /** Jugado y en camino, o esperando el plazo de 48 h. */
  enCaminoCents: number;
  /** Detenido por una incidencia, una cuenta sin verificar o un fallo. */
  retenidoCents: number;
  /** Vendido en mesas que todavia no se han jugado. */
  porJugarseCents: number;
  /** Lo que han pagado los jugadores, antes de descuentos. */
  brutoCents: number;
  /** Lo que se ha quedado la plataforma. */
  comisionCents: number;
  /** Lo que se ha llevado la pasarela de pago. */
  pasarelaCents: number;
};

const VACIO: Resumen = {
  cobradoCents: 0,
  enCaminoCents: 0,
  retenidoCents: 0,
  porJugarseCents: 0,
  brutoCents: 0,
  comisionCents: 0,
  pasarelaCents: 0,
};

/**
 * Reparte el total de cada partida en el cajon que le toca.
 *
 * Los cuatro primeros importes son **excluyentes**: cada euro esta en uno y
 * solo uno, de modo que sumarlos da todo lo que el GM ha vendido nunca. Los
 * tres ultimos son otra vista del mismo dinero —de donde sale y a donde va—,
 * no un quinto cajon.
 */
export function resumirIngresos(
  partidas: readonly { estado: EstadoDelDinero; total: LineaDeReserva }[],
): Resumen {
  return partidas.reduce<Resumen>((resumen, { estado, total }) => {
    const cajon = (
      {
        PAGADO: 'cobradoCents',
        EN_CAMINO: 'enCaminoCents',
        EN_ESPERA: 'enCaminoCents',
        RETENIDO: 'retenidoCents',
        FALLIDO: 'retenidoCents',
        FUTURA: 'porJugarseCents',
      } as const
    )[estado];

    return {
      ...resumen,
      [cajon]: resumen[cajon] + total.netoCents,
      brutoCents: resumen.brutoCents + total.brutoCents,
      comisionCents: resumen.comisionCents + total.comisionCents,
      pasarelaCents: resumen.pasarelaCents + total.pasarelaCents,
    };
  }, VACIO);
}
