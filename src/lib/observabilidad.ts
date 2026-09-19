/**
 * Ajustes comunes de Sentry.
 *
 * **Sin DSN no se inicializa nada** y la aplicacion funciona igual, como pasa
 * con Resend, Discord y Vercel Blob. Un proyecto recien clonado no deberia
 * necesitar cuenta en ningun servicio de terceros para arrancar.
 *
 * No lleva `server-only` a proposito: estos ajustes los comparten el arranque
 * del servidor y el del navegador.
 */

/** DSN del servidor. El del navegador es otro, y publico por definicion. */
export function dsnServidor(): string | undefined {
  return process.env['SENTRY_DSN'] || undefined;
}

export function dsnNavegador(): string | undefined {
  return process.env['NEXT_PUBLIC_SENTRY_DSN'] || undefined;
}

/** De donde viene el error: producción, vista previa o el portátil de alguien. */
function entorno(): string {
  return process.env['VERCEL_ENV'] ?? process.env.NODE_ENV ?? 'development';
}

export const OPCIONES_COMUNES = {
  environment: entorno(),

  /**
   * **Nada de datos personales.**
   *
   * Con esto en `true` —que es lo que deja el asistente de Sentry— el SDK
   * adjunta la IP, las cabeceras y los datos del usuario a cada error. Aqui se
   * manejan correos, reservas y pagos: mandarlos a un tercero para depurar una
   * excepcion es un precio que no hace falta pagar. El identificador de usuario
   * se puede anadir a mano donde haga falta.
   */
  sendDefaultPii: false,

  /**
   * Sin muestreo de rendimiento.
   *
   * Lo que se quiere de Sentry aqui son los errores. Las trazas de rendimiento
   * son las que consumen la cuota, y activarlas es una decision aparte que se
   * toma cuando haya trafico que medir.
   */
  tracesSampleRate: 0,

  // El SDK avisa por consola de lo que hace; en desarrollo es ruido.
  debug: false,
} as const;
