/**
 * Resultado de una accion de servidor invocada desde un formulario.
 *
 * Un unico tipo para todas: asi los componentes de formulario se comparten
 * entre modulos sin duplicar botones ni avisos.
 *
 * `null` es el estado inicial, antes de que el usuario envie nada.
 */
export type EstadoAccion =
  | {
      error: string;

      /**
       * Lo que se acababa de enviar, para que el formulario no pierda lo ya
       * escrito.
       *
       * Hace falta porque React **vacia un formulario no controlado en cuanto
       * termina su accion**, tanto si fue bien como si no. Al fallar la
       * validacion, el formulario volvia a sus valores iniciales y habia que
       * rellenarlo entero por una fecha mal puesta.
       *
       * Devolviendo el `FormData`, cada campo lo usa como su nuevo valor por
       * defecto: cuando React vacia, vacia a lo que la persona habia escrito.
       * Funciona igual sin JavaScript, donde el envio es una peticion normal y
       * la pagina se vuelve a pintar con este mismo estado.
       */
      enviado?: FormData;
    }
  | { ok: true; mensaje?: string }
  | null;

/**
 * Los valores del intento que fallo, para que un formulario no pierda lo
 * escrito.
 *
 * Se usa igual en todos: `texto('title', valores.title)` devuelve lo que la
 * persona habia escrito si hubo error, y lo que traia la ficha si no.
 *
 * Acepta cualquier estado con `enviado`, no solo `EstadoAccion`: los
 * formularios de acceso tienen el suyo, que devuelve el email pero nunca la
 * contrasena.
 */
export function loEscrito(estado: { error: string; enviado?: FormData } | object | null) {
  const enviado =
    estado && 'error' in estado ? (estado as { enviado?: FormData }).enviado : undefined;

  return {
    texto(campo: string, porDefecto = ''): string {
      const valor = enviado?.get(campo);
      return typeof valor === 'string' ? valor : porDefecto;
    },

    /** Casillas de un grupo: `getAll`, porque no viaja ninguna si no hay. */
    marcadas(campo: string, porDefecto: string[]): string[] {
      return enviado ? enviado.getAll(campo).map(String) : porDefecto;
    },
  };
}
