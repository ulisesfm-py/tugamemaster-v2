import 'server-only';

import { db } from '@/lib/db';
import { enviarCorreo, urlBase } from '@/lib/email';
import { TEXTO_CONDICIONES } from '@/modules/bookings/politica';

import {
  incidenciaResuelta,
  nuevaReserva,
  pagoEnviado,
  partidaCancelada,
  reservaConfirmada,
} from './plantillas';

/**
 * Avisos por correo.
 *
 * Todos siguen la misma regla: **un aviso que falla no rompe lo que lo
 * provoca**. Si el correo no sale, el jugador ha pagado igual y su plaza sigue
 * siendo suya; lo que no puede pasar es que un fallo de Resend tumbe un cobro o
 * deje un webhook devolviendo 500 para que Stripe lo reintente eternamente.
 *
 * Por eso cada funcion se envuelve en `sinRomper`: registra el fallo y sigue.
 */

async function sinRomper(nombre: string, tarea: () => Promise<unknown>): Promise<void> {
  try {
    await tarea();
  } catch (error) {
    console.error(`No se pudo enviar el aviso "${nombre}":`, error);
  }
}

/** Al jugador: su plaza esta pagada. */
export async function avisarReservaConfirmada(bookingId: string): Promise<void> {
  await sinRomper('reserva confirmada', async () => {
    const reserva = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        amountCents: true,
        creditCents: true,
        currency: true,
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

    if (!reserva) return;

    await enviarCorreo({
      para: reserva.user.email,
      ...reservaConfirmada({
        jugador: reserva.user.name,
        partida: reserva.game.title,
        gm: reserva.game.gm.user.name,
        inicio: reserva.game.startsAt,
        precioCents: reserva.amountCents,
        saldoAplicadoCents: reserva.creditCents,
        currency: reserva.currency,
        url: `${urlBase()}/partidas/${reserva.game.slug}`,
        condiciones: TEXTO_CONDICIONES.resumen,
      }),
    });
  });
}

/** Al game master: alguien se ha apuntado a su partida. */
export async function avisarNuevaReserva(bookingId: string): Promise<void> {
  await sinRomper('nueva reserva', async () => {
    const reserva = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        gameId: true,
        user: { select: { name: true } },
        game: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            seatsTotal: true,
            gm: { select: { user: { select: { name: true, email: true } } } },
          },
        },
      },
    });

    if (!reserva) return;

    const ocupadas = await db.booking.count({
      where: { gameId: reserva.gameId, status: { in: ['PAID', 'COMPLETED'] } },
    });

    await enviarCorreo({
      para: reserva.game.gm.user.email,
      ...nuevaReserva({
        gm: reserva.game.gm.user.name,
        jugador: reserva.user.name,
        partida: reserva.game.title,
        inicio: reserva.game.startsAt,
        plazasOcupadas: ocupadas,
        plazasTotales: reserva.game.seatsTotal,
        url: `${urlBase()}/cuenta/partidas/${reserva.game.id}`,
      }),
    });
  });
}

/**
 * A cada jugador afectado: el game master ha cancelado la partida.
 *
 * Recibe los importes ya calculados porque quien cancela sabe cuanto ha
 * devuelto a cada uno; volver a deducirlo aqui seria repetir la regla en dos
 * sitios y arriesgarse a que discrepen.
 */
export async function avisarPartidaCancelada(
  devoluciones: { bookingId: string; devueltoCents: number }[],
): Promise<void> {
  for (const devolucion of devoluciones) {
    await sinRomper('partida cancelada', async () => {
      const reserva = await db.booking.findUnique({
        where: { id: devolucion.bookingId },
        select: {
          currency: true,
          user: { select: { name: true, email: true } },
          game: { select: { title: true, startsAt: true } },
        },
      });

      if (!reserva) return;

      await enviarCorreo({
        para: reserva.user.email,
        ...partidaCancelada({
          jugador: reserva.user.name,
          partida: reserva.game.title,
          inicio: reserva.game.startsAt,
          devueltoCents: devolucion.devueltoCents,
          currency: reserva.currency,
          url: `${urlBase()}/partidas`,
        }),
      });
    });
  }
}

/** Al jugador: un administrador ha resuelto su incidencia. */
export async function avisarIncidenciaResuelta(incidentId: string): Promise<void> {
  await sinRomper('incidencia resuelta', async () => {
    const incidencia = await db.incident.findUnique({
      where: { id: incidentId },
      select: {
        status: true,
        resolutionNote: true,
        reportedBy: { select: { name: true, email: true } },
        booking: {
          select: {
            amountCents: true,
            currency: true,
            game: { select: { title: true } },
          },
        },
      },
    });

    if (!incidencia || incidencia.status === 'OPEN') return;

    const aprobada = incidencia.status === 'APPROVED';

    await enviarCorreo({
      para: incidencia.reportedBy.email,
      ...incidenciaResuelta({
        jugador: incidencia.reportedBy.name,
        partida: incidencia.booking.game.title,
        aprobada,
        devueltoCents: aprobada ? incidencia.booking.amountCents : 0,
        currency: incidencia.booking.currency,
        nota: incidencia.resolutionNote,
        url: `${urlBase()}${aprobada ? '/cuenta/saldo' : '/mis-reservas'}`,
      }),
    });
  });
}

/** Al game master: se le ha transferido lo que ha ganado. */
export async function avisarPagoEnviado(payoutId: string): Promise<void> {
  await sinRomper('pago enviado', async () => {
    const payout = await db.payout.findUnique({
      where: { id: payoutId },
      select: {
        amountCents: true,
        currency: true,
        game: { select: { title: true } },
        gm: { select: { user: { select: { name: true, email: true } } } },
      },
    });

    if (!payout) return;

    await enviarCorreo({
      para: payout.gm.user.email,
      ...pagoEnviado({
        gm: payout.gm.user.name,
        partida: payout.game.title,
        importeCents: payout.amountCents,
        currency: payout.currency,
        url: `${urlBase()}/cuenta/cobros`,
      }),
    });
  });
}
