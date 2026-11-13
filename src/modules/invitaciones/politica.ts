import type { PlanGm } from '@/generated/prisma/enums';

/**
 * Reglas del codigo de invitacion de los game masters fundadores.
 *
 * Logica pura: ni base de datos ni reloj propio, para poder comprobarla sin
 * montar nada. Quien la usa le pasa la fecha y el azar.
 *
 * El codigo **solo vale al crear la cuenta**. Quien se registra con el queda
 * emparejado con ese GM para siempre; una cuenta que ya existe no se empareja
 * nunca, para que nadie pueda pasarle su codigo a un jugador que encontro a
 * traves de la web y ahorrarse asi la comision.
 */

/**
 * Los caracteres del codigo. Sin los que se confunden al copiarlo a mano de
 * una pantalla a otra: ni 0/O, ni 1/I/L.
 */
export const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const LONGITUD_CODIGO = 8;

/**
 * Cuantos game masters fundadores habra. Es lo que se dice en la pagina de
 * fundadores y en la oferta; la web no lo impone, lo decide quien nombra.
 */
export const PLAZAS_DE_FUNDADOR = 10;

/** Cuanto tiempo admite registros un codigo desde que se emite o se renueva. */
export const MESES_DE_VALIDEZ = 3;

/**
 * Un codigo nuevo.
 *
 * `azar` devuelve enteros en [0, max): en produccion sale de `crypto`, y en
 * las pruebas se le pasa uno fijo para saber que esperar.
 */
export function generarCodigo(azar: (max: number) => number): string {
  let codigo = '';

  for (let i = 0; i < LONGITUD_CODIGO; i++) {
    codigo += ALFABETO[azar(ALFABETO.length)];
  }

  return codigo;
}

/**
 * Lo que alguien escribio, en la forma en que se guarda, o null si no puede
 * ser un codigo.
 *
 * Admite minusculas, espacios y guiones, que es como se copia de un mensaje.
 * No corrige letras confusas: si alguien escribe una O, el codigo no existe y
 * se le dice, en vez de adivinar.
 */
export function normalizarCodigo(entrada: string): string | null {
  const limpio = entrada.replace(/[\s-]/g, '').toUpperCase();

  if (limpio.length !== LONGITUD_CODIGO) return null;
  if (![...limpio].every((c) => ALFABETO.includes(c))) return null;

  return limpio;
}

/** El codigo como se ensena: en dos bloques de cuatro, que se lee mejor. */
export function formatearCodigo(codigo: string): string {
  return `${codigo.slice(0, 4)}-${codigo.slice(4)}`;
}

/** Hasta cuando vale un codigo emitido o renovado en `desde`. */
export function caducidadDesde(desde: Date): Date {
  const fin = new Date(desde);
  fin.setMonth(fin.getMonth() + MESES_DE_VALIDEZ);
  return fin;
}

export type EstadoDelCodigo = 'VIGENTE' | 'CADUCADO' | 'SIN_PLAN';

/**
 * Si un codigo admite registros ahora mismo.
 *
 * Deja de valer al caducar y tambien en cuanto su GM deja de ser fundador: el
 * codigo es una de las condiciones del plan, no algo suyo aparte.
 */
export function estadoDelCodigo(
  gm: { plan: PlanGm; inviteCodeExpiresAt: Date | null },
  ahora: Date,
): EstadoDelCodigo {
  if (gm.plan !== 'FUNDADOR') return 'SIN_PLAN';
  if (!gm.inviteCodeExpiresAt || gm.inviteCodeExpiresAt <= ahora) return 'CADUCADO';
  return 'VIGENTE';
}
