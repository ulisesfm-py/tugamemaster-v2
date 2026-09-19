/**
 * Punto de entrada de las piezas compartidas.
 *
 * Existe para que `@/components/ui` siga funcionando en los dieciseis sitios
 * que ya lo importaban cuando era un unico fichero.
 */
export { Avatar, Estrellas, Etiqueta, Fecha, Precio } from './basicos';
export { Button, variantesDeBoton } from './button';
export { Aviso } from './aviso';
export { Campo, CLASE_CONTROL } from './campo';
export {
  Estado,
  ESTADO_DE_INCIDENCIA,
  ESTADO_DE_PAGO,
  ESTADO_DE_PARTIDA,
  ESTADO_DE_RESERVA,
  type TonoDeEstado,
} from './estado';
export { Vacio } from './vacio';
