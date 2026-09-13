/**
 * Politica de cancelacion y devolucion.
 *
 * Logica pura, sin base de datos: son las reglas que se anuncian al jugador
 * antes de reservar, y tienen que poder comprobarse sin montar nada.
 *
 * Las devoluciones se abonan como **saldo**, no vuelven a la tarjeta. Si el
 * dinero nunca sale, no hay un segundo cobro de Stripe que nadie tenga que
 * asumir.
 */

/** Margen para cancelar con devolucion. */
export const HORAS_CANCELACION_CON_DEVOLUCION = 48;

/** Porcentaje que se devuelve al cancelar dentro de plazo. */
export const PORCENTAJE_DEVOLUCION = 90;

/** Porcentaje que se devuelve cuando la culpa es del game master. */
export const PORCENTAJE_DEVOLUCION_INCIDENCIA = 100;

/** True si todavia se esta a tiempo de cancelar con devolucion. */
export function hayDerechoADevolucion(inicio: Date, ahora = new Date()): boolean {
  const margenMs = HORAS_CANCELACION_CON_DEVOLUCION * 3_600_000;
  return inicio.getTime() - ahora.getTime() >= margenMs;
}

/**
 * Importe a devolver, en centimos.
 *
 * Se redondea hacia abajo: ante un centimo indivisible, el redondeo no puede
 * ir en contra de la plataforma de forma sistematica.
 */
export function importeDevolucionCents(precioCents: number, porcentaje: number): number {
  if (!Number.isInteger(precioCents) || precioCents < 0) {
    throw new Error(`Precio invalido: ${precioCents}`);
  }

  if (porcentaje < 0 || porcentaje > 100) {
    throw new Error(`Porcentaje invalido: ${porcentaje}`);
  }

  return Math.floor((precioCents * porcentaje) / 100);
}

/** Cuanto falta para que se acabe el plazo de cancelacion con devolucion. */
export function horasHastaFinDePlazo(inicio: Date, ahora = new Date()): number {
  const limite = inicio.getTime() - HORAS_CANCELACION_CON_DEVOLUCION * 3_600_000;
  return Math.max(0, (limite - ahora.getTime()) / 3_600_000);
}

/** Texto de las condiciones, en un unico sitio para no contradecirse. */
export const TEXTO_CONDICIONES = {
  resumen: `Cancelación gratuita hasta ${HORAS_CANCELACION_CON_DEVOLUCION} horas antes: se te devuelve el ${PORCENTAJE_DEVOLUCION}% en saldo.`,
  detalle: [
    `Si cancelas con más de ${HORAS_CANCELACION_CON_DEVOLUCION} horas de antelación, se te devuelve el ${PORCENTAJE_DEVOLUCION}% del precio en saldo para futuras partidas. El ${100 - PORCENTAJE_DEVOLUCION}% restante cubre los gastos de gestión.`,
    `Dentro de las últimas ${HORAS_CANCELACION_CON_DEVOLUCION} horas puedes liberar tu plaza, pero no hay devolución: el game master ya ha preparado la partida contando contigo.`,
    `Si el game master no se presenta o hay una incidencia, se te devuelve el ${PORCENTAJE_DEVOLUCION_INCIDENCIA}% en saldo. Si prefieres recuperarlo en tu tarjeta, escríbenos y lo revisamos.`,
    'El saldo no caduca y se aplica automáticamente en tu siguiente reserva.',
  ],
} as const;
