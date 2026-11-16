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
  // Direccion de reenvio (ImprovMX) al correo personal del titular: la web no
  // publica su Gmail, que ademas es el acceso del administrador. Se contesta
  // desde Gmail como esta direccion (SMTP de Resend). Ver docs/despliegue.md.
  correo: 'contacto@tugamemaster.com',
  dominio: 'tugamemaster.com',
} as const;

/** Fecha de la ultima revision de los textos legales. */
export const REVISION_TEXTOS_LEGALES = new Date('2026-11-16');
