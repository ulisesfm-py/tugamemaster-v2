/**
 * Que se puede cambiar de una partida que ya tiene jugadores.
 *
 * Logica pura: ni base de datos ni reloj, para comprobarla sin montar nada.
 *
 * **La fecha no se puede cambiar mientras haya plazas ocupadas.** Hay tres
 * razones, y las tres vienen de que hoy cambiar la fecha no avisa a nadie:
 *
 * - Quien reservo no se entera, y no tiene por que mirar el hilo.
 * - El plazo de cancelacion con devolucion (48 h) se cuenta sobre la fecha
 *   vigente: adelantar la partida puede dejar a un jugador sin devolucion sin
 *   que lo sepa.
 * - La salida de emergencia, cancelar y crear otra, devuelve el 100 % en saldo y
 *   la comision de Stripe de cada plaza (la de procesamiento y la de Radar) la
 *   absorbe la plataforma, porque no hay pago al GM del que descontarla.
 *
 * Reprogramar con aviso y cancelacion gratuita para quien no pueda esta
 * pensado y por escribir: `docs/reprogramar-partida.md`.
 *
 * Una plaza ocupada es una pagada o jugada, o una que alguien esta pagando
 * ahora mismo (`filtroPlazaOcupada` en `bookings/service.ts`). Las gratuitas
 * cuentan igual: el problema de que nadie se entere es el mismo.
 */

export const MENSAJE_FECHA_BLOQUEADA =
  'La fecha de una partida con jugadores no se puede cambiar. Si necesitas moverla, escríbenos y lo vemos.';

/** True si la partida tiene plazas ocupadas y, por tanto, su fecha esta fija. */
export function fechaBloqueada(plazasOcupadas: number): boolean {
  return plazasOcupadas > 0;
}

/**
 * La entrada con la fecha que la partida ya tiene, o `null` si se intenta
 * cambiar.
 *
 * El formulario no manda la fecha de una partida con jugadores (el campo ni se
 * pinta), asi que lo normal es que no venga. Si alguien la manda igualmente y es
 * otra, se rechaza en vez de ignorarla: quien llama directamente a la accion
 * tiene que enterarse de que no ha cambiado nada.
 *
 * Una entrada que no es un objeto se devuelve tal cual: la validacion de la
 * ficha ya se encarga de rechazarla.
 */
export function conLaFechaActual(input: unknown, actual: Date): unknown {
  if (typeof input !== 'object' || input === null) return input;

  const enviada = (input as { startsAt?: unknown }).startsAt;

  if (
    typeof enviada === 'string' &&
    enviada !== '' &&
    new Date(enviada).getTime() !== actual.getTime()
  ) {
    return null;
  }

  return { ...input, startsAt: actual };
}
