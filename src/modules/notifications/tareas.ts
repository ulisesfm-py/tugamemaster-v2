import 'server-only';

import { db } from '@/lib/db';
import { enviarCorreo, urlBase } from '@/lib/email';
import { hayDerechoADevolucion } from '@/modules/bookings/politica';
import { DIAS_PARA_VALORAR } from '@/modules/reviews/politica';

import { pideResena, recordatorioPartida } from './plantillas';

/**
 * Avisos que dispara el job diario, no un evento del usuario.
 *
 * Los dos se apoyan en una marca en la reserva (`reminderSentAt`,
 * `reviewRequestSentAt`) para no reenviarse cada madrugada. La garantia de no
 * duplicar vive en la base de datos, no en que el cron corra una sola vez:
 * ejecutarlo dos veces seguidas no manda dos correos.
 *
 * **La marca se escribe se haya enviado o no.** Es deliberado: reintentar cada
 * noche durante semanas contra una direccion que rebota es justo lo que arruina
 * la reputacion de un remitente, y un recordatorio reintentado al dia siguiente
 * llega cuando la partida ya se ha jugado. Un fallo queda en el registro y en
 * los detalles del `ScheduledJob`, que es donde se puede ver.
 */

export type ResultadoTarea = { procesadas: number; detalles: string[] };

/**
 * Cuanta antelacion tiene el recordatorio.
 *
 * Son 72 y no 48 por una razon de producto. El recordatorio hace dos trabajos:
 * que no se te olvide, y que si no puedes venir liberes la plaza. El segundo
 * vale mas dinero —el GM aun puede revenderla y el jugador aun recupera el
 * 90%— y solo funciona **mientras el plazo de cancelacion siga abierto**.
 *
 * Con una ventana de 48 horas el aviso llegaba siempre con el plazo ya
 * cerrado: se avisaba justo cuando ya no se podia hacer nada. Con 72, el
 * recordatorio cae entre 48 y 72 horas antes, que es exactamente cuando
 * avisar todavia sirve de algo.
 */
export const VENTANA_RECORDATORIO_HORAS = 72;

/** Tope por ejecucion, para no agotar el tiempo de la funcion. */
const LOTE = 100;

/**
 * Recuerda su partida a quien tiene plaza pagada.
 *
 * Con un cron diario no existe el "exactamente 48 horas antes": se avisa a
 * quien juega dentro de la ventana, asi que el recordatorio cae entre dos y
 * tres dias antes segun la hora de la partida. Ninguna regla depende del
 * minuto exacto, como exige CLAUDE.md.
 */
export async function recordarPartidas(ahora = new Date()): Promise<ResultadoTarea> {
  const limite = new Date(ahora.getTime() + VENTANA_RECORDATORIO_HORAS * 3_600_000);

  const reservas = await db.booking.findMany({
    where: {
      status: 'PAID',
      reminderSentAt: null,
      game: {
        status: 'PUBLISHED',
        // Ya empezadas no: un recordatorio que llega tarde es ruido.
        startsAt: { gt: ahora, lte: limite },
      },
    },
    take: LOTE,
    select: {
      id: true,
      user: { select: { name: true, email: true } },
      game: {
        select: {
          title: true,
          slug: true,
          startsAt: true,
          gm: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const detalles: string[] = [];
  let procesadas = 0;

  for (const reserva of reservas) {
    const enviado = await enviarCorreo({
      para: reserva.user.email,
      ...recordatorioPartida({
        jugador: reserva.user.name,
        partida: reserva.game.title,
        gm: reserva.game.gm.user.name,
        inicio: reserva.game.startsAt,
        // Se decide ahora, no en la plantilla: el plazo sigue abierto o no
        // segun cuando caiga este envio.
        conDevolucion: hayDerechoADevolucion(reserva.game.startsAt, ahora),
        url: `${urlBase()}/partidas/${reserva.game.slug}`,
      }),
    });

    await db.booking.update({
      where: { id: reserva.id },
      data: { reminderSentAt: ahora },
    });

    procesadas++;
    detalles.push(
      `${enviado ? 'recordada' : 'recordatorio no enviado'}: ${reserva.game.title} a ${reserva.user.email}`,
    );
  }

  return { procesadas, detalles };
}

/**
 * Pide resena a quien ya jugo y todavia no ha valorado.
 *
 * Solo dentro del plazo en que la resena se puede dejar: pedirla pasados los
 * 60 dias seria mandar a alguien a una puerta cerrada.
 */
export async function pedirResenas(ahora = new Date()): Promise<ResultadoTarea> {
  const masAntiguaAdmitida = new Date(ahora.getTime() - DIAS_PARA_VALORAR * 86_400_000);

  const reservas = await db.booking.findMany({
    where: {
      status: 'COMPLETED',
      reviewRequestSentAt: null,
      // Quien ya valoro por su cuenta no necesita que se lo pidan.
      review: null,
      game: { endsAt: { lte: ahora, gte: masAntiguaAdmitida } },
    },
    take: LOTE,
    select: {
      id: true,
      user: { select: { name: true, email: true } },
      game: {
        select: {
          title: true,
          gm: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const detalles: string[] = [];
  let procesadas = 0;

  for (const reserva of reservas) {
    const enviado = await enviarCorreo({
      para: reserva.user.email,
      ...pideResena({
        jugador: reserva.user.name,
        partida: reserva.game.title,
        gm: reserva.game.gm.user.name,
        diasDePlazo: DIAS_PARA_VALORAR,
        url: `${urlBase()}/mis-reservas`,
      }),
    });

    await db.booking.update({
      where: { id: reserva.id },
      data: { reviewRequestSentAt: ahora },
    });

    procesadas++;
    detalles.push(
      `${enviado ? 'pedida resena' : 'peticion no enviada'}: ${reserva.game.title} a ${reserva.user.email}`,
    );
  }

  return { procesadas, detalles };
}
