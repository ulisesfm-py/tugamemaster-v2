/**
 * Las imágenes de la marca: el logotipo y la lámina de la portada.
 *
 * **Este es el único fichero que hay que tocar para cambiarlas.** Las imágenes
 * viven en `public/marca/`, así que lo normal es no tocar ni esto: basta con
 * sustituir el fichero conservando el nombre. Ver `docs/marca.md`.
 *
 * Van aquí y no subidas al Blob como los avatares porque no son datos de nadie:
 * son parte del diseño, cambian una vez al año y conviene que viajen con el
 * código, versionadas y sin depender de que un servicio externo responda.
 *
 * Los dos admiten `null`, y ese es el caso normal mientras no haya arte: el
 * logotipo se escribe con la tipografía de la casa y la portada usa el
 * degradado. Una web sin imágenes tiene que verse terminada, no a medio hacer.
 */

export type Logotipo = {
  /** Ruta dentro de `public`. */
  src: string;
  /** Tamaño real del fichero, en píxeles. Hace falta para que no baile nada al cargar. */
  ancho: number;
  alto: number;
  /**
   * `true` si la imagen ya trae el nombre escrito.
   *
   * Entonces no se repite al lado, pero sigue leyéndose para quien escucha la
   * página: un logotipo que dice el nombre lo dice solo para quien lo ve.
   */
  llevaNombre?: boolean;
};

export type Portada = {
  src: string;
  /**
   * Qué parte de la imagen se ve cuando no cabe entera, en la sintaxis de
   * `object-position`. Por defecto, el centro. Útil para fotos donde lo que
   * importa está arriba (`'center 25%'`).
   */
  posicion?: string;
};

/**
 * El logotipo de la cabecera y el pie.
 *
 * De serie es un emblema cuadrado —el d20 de la casa— que acompaña al nombre
 * escrito. Si pones un logotipo que ya lleve el nombre dentro, marca
 * `llevaNombre: true` y ajusta el tamaño.
 */
export const LOGOTIPO: Logotipo | null = {
  src: '/marca/logo.svg',
  ancho: 32,
  alto: 32,
};

/**
 * La lámina de la portada, detrás del titular.
 *
 * Con `null` queda el degradado de la casa. Con una imagen se pinta a sangre y
 * el texto se lee sobre un velo oscuro: el titular manda sobre la foto, no al
 * revés.
 */
export const PORTADA: Portada | null = { src: '/marca/portada.svg' };
