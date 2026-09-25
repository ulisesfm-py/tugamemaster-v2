import type { BookingStatus } from '@/generated/prisma/enums';

/**
 * Reglas del hilo de mesa.
 *
 * Logica pura, sin base de datos, como el resto de politicas del proyecto:
 * son las reglas que se le anuncian a la gente, asi que tienen que poder
 * comprobarse sin montar nada.
 *
 * El hilo es asincrono a proposito. Por fuera se parece a un chat; por dentro
 * no mantiene conexiones abiertas. Y el uso real es asincrono: la duda llega
 * tres dias antes y el recordatorio la vispera.
 */

export const MENSAJE_MINIMO = 1;
export const MENSAJE_MAXIMO = 2000;
export const MOTIVO_DENUNCIA_MAXIMO = 500;

/**
 * Cuanto vive el hilo despues de que termine la partida.
 *
 * Da margen para lo de despues —la nota de sesion, cuadrar la siguiente— sin
 * dejar conversaciones abiertas para siempre. En campana cada sesion tiene su
 * hilo, asi que treinta dias cubren de sobra el hueco entre una y otra.
 */
export const DIAS_DE_VIDA = 30;

const DIA_MS = 86_400_000;

export type MotivoSinHilo =
  'NO_ES_DE_LA_MESA' | 'PAGO_SIN_CONFIRMAR' | 'PLAZA_LIBERADA' | 'HILO_CERRADO';

export type Acceso = { ok: true; esGm: boolean } | { ok: false; motivo: MotivoSinHilo };

/** Lo que se le dice a quien no puede entrar. */
export const MENSAJE_SIN_HILO: Record<MotivoSinHilo, string> = {
  NO_ES_DE_LA_MESA: 'El hilo es para el game master y quien tenga plaza en la partida',
  PAGO_SIN_CONFIRMAR:
    'Tu plaza todavía no está confirmada. En cuanto lo esté, entras al hilo',
  PLAZA_LIBERADA:
    'Liberaste tu plaza, así que ya no participas en el hilo de esta partida',
  HILO_CERRADO: `El hilo se cierra ${DIAS_DE_VIDA} días después de la partida`,
};

/**
 * Cuando deja de estar abierto el hilo de una partida.
 *
 * Se devuelve la fecha exacta y no «te quedan X dias» por lo mismo que en el
 * plazo de cancelacion: un contador redondeado miente justo cuando importa.
 */
export function cierreDelHilo(finPartida: Date): Date {
  return new Date(finPartida.getTime() + DIAS_DE_VIDA * DIA_MS);
}

/**
 * Quien entra al hilo de una partida.
 *
 * Leer y escribir van juntos: quien libera su plaza deja de hacer ambas cosas
 * en el acto, aunque sus mensajes se queden. Un hilo que se puede leer pero no
 * contestar seria un escaparate, no una mesa.
 *
 * El game master **no** puede expulsar a nadie: sacar del hilo a quien ha
 * pagado es quitarle algo que compro. Si hay que apartar a una persona, va con
 * devolucion por delante y lo decide quien puede devolver el dinero.
 */
export function accesoAlHilo(
  quien: { esGm: boolean; reserva: BookingStatus | null },
  partida: { finPartida: Date },
  ahora: Date = new Date(),
): Acceso {
  const cerrado = ahora.getTime() > cierreDelHilo(partida.finPartida).getTime();

  if (quien.esGm) {
    return cerrado ? { ok: false, motivo: 'HILO_CERRADO' } : { ok: true, esGm: true };
  }

  switch (quien.reserva) {
    case 'PAID':
    case 'COMPLETED':
      return cerrado ? { ok: false, motivo: 'HILO_CERRADO' } : { ok: true, esGm: false };

    // El cobro aun no lo ha confirmado Stripe. No es que no sea de la mesa: es
    // que todavia no lo sabemos.
    case 'PENDING':
      return { ok: false, motivo: 'PAGO_SIN_CONFIRMAR' };

    case 'CANCELLED':
    case 'REFUNDED':
      return { ok: false, motivo: 'PLAZA_LIBERADA' };

    default:
      return { ok: false, motivo: 'NO_ES_DE_LA_MESA' };
  }
}

/**
 * Quien puede retirar un mensaje.
 *
 * Su autor, porque es suyo y puede arrepentirse; y un administrador, porque
 * alguien tiene que poder quitar lo que no deberia estar escrito. El game
 * master no: modera denunciando, igual que todo el mundo.
 */
export function puedeRetirar(
  mensaje: { autorId: string },
  quien: { id: string; esAdmin: boolean },
): boolean {
  return quien.esAdmin || mensaje.autorId === quien.id;
}

/** Nadie denuncia lo suyo, y una denuncia ya puesta no se repite. */
export function puedeDenunciar(
  mensaje: { autorId: string; denunciado: boolean },
  quien: { id: string },
): boolean {
  return !mensaje.denunciado && mensaje.autorId !== quien.id;
}

/**
 * El texto tal y como se guarda.
 *
 * Es texto plano: se respetan los saltos de linea y no se interpreta ni HTML
 * ni Markdown, mismo criterio que el blog. Lo que no se interpreta no hay que
 * sanearlo.
 */
export function limpiarMensaje(texto: string): string {
  return texto
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Si hay algo sin leer para alguien.
 *
 * Lo que uno mismo escribe no cuenta: avisar a alguien de su propio mensaje
 * es el camino mas corto a que la campanita deje de mirarse.
 */
export function hayMensajesNuevos(
  quien: { id: string; leidoHasta: Date | null },
  ultimo: { autorId: string; escritoEn: Date } | null,
): boolean {
  if (!ultimo) return false;
  if (ultimo.autorId === quien.id) return false;
  if (!quien.leidoHasta) return true;

  return ultimo.escritoEn.getTime() > quien.leidoHasta.getTime();
}

/** Texto de las reglas, en un unico sitio para que la web no se contradiga. */
export const TEXTO_HILO = {
  resumen: 'Un hilo por partida para el game master y quien tenga plaza.',
  detalle: [
    'Entras en cuanto tu plaza está pagada, y dejas de participar si la liberas. Lo que hayas escrito se queda.',
    `El hilo se cierra ${DIAS_DE_VIDA} días después de la partida, y el game master puede vaciarlo antes.`,
    'No avisamos por correo: los mensajes nuevos aparecen en la campana.',
    'Si alguien se pasa de la raya, denuncia el mensaje y lo revisa un administrador.',
  ],
} as const;
