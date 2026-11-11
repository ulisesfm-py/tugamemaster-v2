/**
 * Limite de intentos: las reglas.
 *
 * Logica pura, sin base de datos: aqui se decide *cuantos* intentos se
 * admiten y como se le dice al usuario que espere. Contar es cosa de
 * `service.ts`.
 *
 * Todas son ventanas fijas: la primera vez que se usa una clave empieza una
 * ventana de `ventanaSeg` segundos, y los intentos de esa ventana se suman. Es
 * menos fina que una ventana deslizante, pero cabe en una sola fila por clave
 * y se actualiza de forma atomica sin bloquear nada.
 */

export type Regla = {
  /** Prefijo de la clave: separa los contadores de una regla de los de otra. */
  nombre: string;
  /** Intentos que caben en la ventana. El siguiente ya se rechaza. */
  max: number;
  ventanaSeg: number;
};

const QUINCE_MINUTOS = 15 * 60;
const UNA_HORA = 60 * 60;

export const REGLAS = {
  /**
   * Intentos de entrar contra un mismo correo. Frena a quien prueba
   * contrasenas contra una cuenta. Un acierto reinicia el contador, pero un
   * tercero tambien puede gastarlo a proposito para dejar a alguien fuera un
   * rato: es el precio de frenar la fuerza bruta, y dura minutos.
   */
  loginEmail: { nombre: 'login-email', max: 10, ventanaSeg: QUINCE_MINUTOS },

  /**
   * Intentos de entrar desde una misma IP, con cualquier correo. Frena a quien
   * prueba muchas cuentas con pocas contrasenas, que el limite por correo no
   * ve. Mas holgado porque tras una misma IP puede haber una oficina o un
   * piso entero.
   */
  loginIp: { nombre: 'login-ip', max: 40, ventanaSeg: QUINCE_MINUTOS },

  /**
   * Altas desde una misma IP. Cada alta cuesta un argon2 y una cuenta
   * gratuita basta para probar contrasenas de partidas privadas.
   */
  registroIp: { nombre: 'registro-ip', max: 10, ventanaSeg: UNA_HORA },

  /**
   * Contrasenas de una partida privada que un mismo jugador puede probar. Un
   * despiste son uno o dos intentos; cinco ya es adivinar.
   */
  privadaUsuario: { nombre: 'privada-usuario', max: 5, ventanaSeg: QUINCE_MINUTOS },

  /**
   * Contrasenas probadas contra una misma partida entre todos. Es el tope que
   * no esquivan los que abren varias cuentas. Si alguien lo gasta a proposito,
   * solo se bloquea esa mesa, y solo una hora.
   */
  privadaPartida: { nombre: 'privada-partida', max: 60, ventanaSeg: UNA_HORA },
} as const satisfies Record<string, Regla>;

/**
 * Las filas con la ventana vencida hace mas de esto no sirven para nada y las
 * borra el cron. Un dia sobra: la ventana mas larga es de una hora.
 */
export const CADUCIDAD_FILAS_SEG = 24 * UNA_HORA;

export type Veredicto = {
  permitido: boolean;
  /** Segundos que faltan para que la ventana se reinicie. */
  reintentarEnSeg: number;
};

/**
 * Decide con el contador que devuelve la base de datos, *despues* de sumar el
 * intento actual: con `max = 5`, los intentos 1 a 5 pasan y el 6 no.
 */
export function veredicto(
  contador: number,
  max: number,
  reintentarEnSeg: number,
): Veredicto {
  return {
    permitido: contador <= max,
    reintentarEnSeg: Math.max(0, Math.ceil(reintentarEnSeg)),
  };
}

/** Lo que se le dice a quien se ha pasado: cuanto tiene que esperar. */
export function mensajeDeEspera(segundos: number): string {
  if (segundos <= 60) {
    return 'Demasiados intentos. Vuelve a probar dentro de un minuto.';
  }

  const minutos = Math.ceil(segundos / 60);

  if (minutos < 60) {
    return `Demasiados intentos. Vuelve a probar dentro de ${minutos} minutos.`;
  }

  return 'Demasiados intentos. Vuelve a probar dentro de una hora.';
}
