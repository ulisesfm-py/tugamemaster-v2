import { hash, verify } from '@node-rs/argon2';

/**
 * Hash de contrasenas con argon2id.
 *
 * Se usa @node-rs/argon2 (binario precompilado) en lugar del paquete `argon2`,
 * que compila con node-gyp y necesita herramientas de build en Windows y en
 * el contenedor de despliegue.
 *
 * Parametros segun la recomendacion de OWASP para argon2id: 19 MiB de memoria,
 * 2 iteraciones y paralelismo 1.
 */
const OPCIONES = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

/** Longitud minima aceptada. El resto de reglas se validan con Zod. */
export const LONGITUD_MINIMA_PASSWORD = 10;

export function hashPassword(plano: string): Promise<string> {
  return hash(plano, OPCIONES);
}

/**
 * Comprueba una contrasena contra su hash.
 *
 * Devuelve false ante un hash corrupto o de otro algoritmo en vez de lanzar:
 * a quien llama solo le interesa si las credenciales son validas, y un error
 * aqui filtraria detalles de como se almacenan.
 */
export async function verifyPassword(
  hashGuardado: string,
  plano: string,
): Promise<boolean> {
  try {
    return await verify(hashGuardado, plano, OPCIONES);
  } catch {
    return false;
  }
}
