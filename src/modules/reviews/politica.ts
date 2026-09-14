import type { BookingStatus } from '@/generated/prisma/enums';

/**
 * Politica de resenas.
 *
 * Logica pura, sin base de datos, como la politica de cancelacion: son las
 * reglas que se le anuncian al jugador, asi que tienen que poder comprobarse
 * sin montar nada.
 *
 * La reputacion de un GM solo puede salir de partidas reservadas, pagadas y
 * jugadas en la plataforma. Eso es lo que certifica la web en el perfil
 * publico, y estas reglas son lo que lo sostiene.
 */

/** Plazo para dejar una resena, contado desde que termina la partida. */
export const DIAS_PARA_VALORAR = 60;

/** Plazo para corregir una resena ya publicada, desde que se escribio. */
export const DIAS_PARA_EDITAR = 14;

export const RATING_MINIMO = 1;
export const RATING_MAXIMO = 5;
export const COMENTARIO_MAXIMO = 1000;

const DIA_MS = 86_400_000;

export type MotivoNoValorable =
  'NO_PAGADA' | 'NO_TERMINADA' | 'REEMBOLSADA' | 'PLAZO_AGOTADO';

export type Valorabilidad = { ok: true } | { ok: false; motivo: MotivoNoValorable };

/** Lo que se le dice al jugador cuando no puede valorar. */
export const MENSAJE_NO_VALORABLE: Record<MotivoNoValorable, string> = {
  NO_PAGADA: 'Solo se pueden valorar las partidas que jugaste y pagaste aqui',
  NO_TERMINADA: 'La partida todavia no ha terminado',
  REEMBOLSADA:
    'Esta reserva se reembolso por una incidencia, asi que no cuenta para la reputacion del game master',
  PLAZO_AGOTADO: `El plazo para valorar era de ${DIAS_PARA_VALORAR} dias tras la partida`,
};

/**
 * Si una reserva da derecho a valorar al game master.
 *
 * Se admite `COMPLETED` y tambien `PAID` con la partida ya terminada. El
 * estado `COMPLETED` lo pone el cron diario, y hacer depender de el la
 * posibilidad de valorar ataria una regla de negocio al minuto en que se
 * ejecuta el job: quien juega a las once de la noche podria valorar y quien
 * juega a las cinco de la madrugada no.
 *
 * Una reserva `REFUNDED` no valora. Una incidencia aprobada ya tiene su cauce
 * —le devolvieron el dinero— y no debe ademas dejar rastro en las estrellas.
 */
export function puedeValorar(
  reserva: { estado: BookingStatus; finPartida: Date },
  ahora: Date = new Date(),
): Valorabilidad {
  // Se comprueba antes que el estado de pago para poder explicar el motivo
  // real: una reserva reembolsada estuvo pagada en su momento.
  if (reserva.estado === 'REFUNDED') return { ok: false, motivo: 'REEMBOLSADA' };

  if (reserva.estado !== 'PAID' && reserva.estado !== 'COMPLETED') {
    return { ok: false, motivo: 'NO_PAGADA' };
  }

  const fin = reserva.finPartida.getTime();

  if (fin > ahora.getTime()) return { ok: false, motivo: 'NO_TERMINADA' };

  if (ahora.getTime() > fin + DIAS_PARA_VALORAR * DIA_MS) {
    return { ok: false, motivo: 'PLAZO_AGOTADO' };
  }

  return { ok: true };
}

/**
 * Si una resena todavia se puede corregir.
 *
 * Hay margen para arreglar una errata o repensarlo en frio, pero pasado el
 * plazo la resena se congela: una valoracion que cambia meses despues deja de
 * ser un testimonio de la partida.
 */
export function puedeEditar(escritaEn: Date, ahora: Date = new Date()): boolean {
  return ahora.getTime() <= escritaEn.getTime() + DIAS_PARA_EDITAR * DIA_MS;
}

/** Texto de las reglas, en un unico sitio para que la web no se contradiga. */
export const TEXTO_RESENAS = {
  resumen: `Puedes valorar al game master hasta ${DIAS_PARA_VALORAR} dias despues de la partida.`,
  detalle: [
    'Solo valora quien reservo y pago su plaza aqui, y solo despues de jugar. Por eso las estrellas de un game master certifican partidas gestionadas por la plataforma.',
    `Tienes ${DIAS_PARA_VALORAR} dias desde que termina la partida para dejar tu valoracion, y ${DIAS_PARA_EDITAR} dias para corregirla una vez escrita.`,
    'Una valoracion baja no retiene el pago al game master: para eso estan las incidencias.',
  ],
} as const;
