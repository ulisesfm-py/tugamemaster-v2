import type { GameStatus } from '@/generated/prisma/enums';

/**
 * Reglas de las campanas y sus continuaciones.
 *
 * Logica pura, sin base de datos, como el resto de politicas del proyecto.
 */

export const NOTA_MINIMA = 20;
export const NOTA_MAXIMA = 5000;
export const RESUMEN_MAXIMO = 1000;

/**
 * Si una partida puede darse por jugada.
 *
 * Vale `COMPLETED`, que es lo que pone el cron, y tambien una publicada cuya
 * hora de fin ya paso: escribir donde quedo la sesion en caliente, al levantarse
 * de la mesa, no puede depender de que hayan dado las cuatro de la madrugada.
 *
 * Un borrador no cuenta aunque su fecha haya pasado —nunca se jugo— y una
 * cancelada tampoco.
 */
export function partidaTerminada(
  estado: GameStatus,
  fin: Date,
  ahora: Date = new Date(),
): boolean {
  if (estado === 'COMPLETED') return true;
  if (estado !== 'PUBLISHED') return false;

  return fin.getTime() <= ahora.getTime();
}

/**
 * Sufijo "- Sesion 3" al final de un titulo, en cualquiera de sus formas.
 *
 * Se aceptan varios separadores y la palabra con tilde o sin ella porque el
 * titulo lo escribe el GM a mano y nadie teclea igual dos veces.
 */
const SUFIJO_SESION = /\s*[-–—·:|]?\s*sesi[oó]n\s*\d+\s*$/i;

/** El titulo sin el "- Sesion N" final, que es el nombre de la campana. */
export function tituloBase(titulo: string): string {
  return titulo.replace(SUFIJO_SESION, '').trim() || titulo.trim();
}

/** Titulo propuesto para la siguiente sesion. El GM puede cambiarlo. */
export function tituloDeContinuacion(tituloAnterior: string, numero: number): string {
  return `${tituloBase(tituloAnterior)} - Sesión ${numero}`;
}

/**
 * Numero que le toca a la siguiente sesion.
 *
 * Una partida suelta que se convierte en campana es la sesion 1, asi que su
 * continuacion es la 2.
 */
export function numeroSiguiente(numeroAnterior: number | null): number {
  return (numeroAnterior ?? 1) + 1;
}
