import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Compara la contrasena que escribio un jugador con la de la partida sin que
 * el tiempo de respuesta dependa de cuantas letras acierta.
 *
 * `===` se detiene en la primera letra distinta, y esa diferencia, medida
 * muchas veces, deja adivinar la contrasena letra a letra. Se comparan los
 * hashes y no los textos porque `timingSafeEqual` exige la misma longitud, y
 * decirle a quien llama que la longitud no coincide ya seria una pista.
 */
export function contrasenasIguales(escrita: string, guardada: string): boolean {
  const a = createHash('sha256').update(escrita).digest();
  const b = createHash('sha256').update(guardada).digest();
  return timingSafeEqual(a, b);
}
