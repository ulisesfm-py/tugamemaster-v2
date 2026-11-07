/**
 * Quien esta detras de la web, para el aviso legal, la privacidad y el
 * contacto.
 *
 * Version minima a proposito (decidido al preparar el despliegue): nombre y
 * correo, sin NIF ni domicilio, mientras la web no facture. Cuando lo haga,
 * se completa aqui y sale en las tres paginas a la vez.
 */
export const TITULAR = {
  nombre: 'Ulises',
  correo: 'ulises.fm.py@gmail.com',
  dominio: 'tugamemaster.com',
} as const;

/** Fecha de la ultima revision de los textos legales. */
export const REVISION_TEXTOS_LEGALES = new Date('2026-11-07');
