/**
 * Quien esta detras de la web, para el aviso legal y la politica de
 * privacidad.
 *
 * La LSSI (art. 10) obliga a publicar nombre, NIF, domicilio y un correo de
 * contacto del titular. No son secretos: tienen que salir en la web.
 *
 * Mientras quede algun `PENDIENTE`, el despliegue de produccion se niega a
 * compilar (ver scripts/vercel-build.mjs): un aviso legal a medio rellenar es
 * peor que ninguno.
 */
export const TITULAR = {
  nombre: 'PENDIENTE',
  nif: 'PENDIENTE',
  domicilio: 'PENDIENTE',
  correo: 'hola@tugamemaster.com',
  dominio: 'tugamemaster.com',
} as const;

/** Fecha de la ultima revision de los textos legales. */
export const REVISION_TEXTOS_LEGALES = new Date('2026-11-07');
