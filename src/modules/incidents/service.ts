import 'server-only';

import { db } from '@/lib/db';
import {
  importeDevolucionCents,
  PORCENTAJE_DEVOLUCION_INCIDENCIA,
} from '@/modules/bookings/politica';
import { avisarIncidenciaResuelta } from '@/modules/notifications/service';
import { abonar } from '@/modules/wallet/service';

/**
 * Incidencias: el jugador reclama que la partida no se presto como debia.
 *
 * Una incidencia abierta **bloquea el pago al GM** de esa partida. Esa es su
 * funcion principal: detener el dinero mientras se revisa.
 *
 * La resuelve siempre una persona. En la v1 no hay automatismo, y es
 * deliberado: decidir si un GM se presento o no exige criterio.
 */

export type ResultadoIncidencia =
  { ok: true; incidentId: string } | { ok: false; mensaje: string };

/**
 * El jugador abre una incidencia sobre su reserva.
 *
 * Se admite desde que la partida empieza y mientras no se haya pagado al GM.
 * Una vez transferido el dinero, la via automatica se cierra y el caso tiene
 * que tratarse a mano.
 */
export async function reportarIncidencia(
  bookingId: string,
  userId: string,
  motivo: string,
): Promise<ResultadoIncidencia> {
  const texto = motivo.trim();

  if (texto.length < 20) {
    return {
      ok: false,
      mensaje: 'Cuentanos que paso con algo mas de detalle (al menos 20 caracteres)',
    };
  }

  if (texto.length > 2000) {
    return { ok: false, mensaje: 'El texto es demasiado largo' };
  }

  const reserva = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      userId: true,
      status: true,
      game: {
        select: {
          startsAt: true,
          payout: { select: { status: true } },
        },
      },
      incidents: { select: { id: true, status: true } },
    },
  });

  if (!reserva || reserva.userId !== userId) {
    return { ok: false, mensaje: 'Esa reserva no es tuya' };
  }

  if (reserva.status !== 'PAID' && reserva.status !== 'COMPLETED') {
    return { ok: false, mensaje: 'Solo se pueden reclamar reservas pagadas' };
  }

  if (reserva.game.startsAt.getTime() > Date.now()) {
    return { ok: false, mensaje: 'La partida todavia no ha empezado' };
  }

  if (reserva.game.payout?.status === 'PAID') {
    return {
      ok: false,
      mensaje:
        'El pago al game master ya se ha realizado. Escribenos y lo revisamos a mano.',
    };
  }

  const yaAbierta = reserva.incidents.find((i) => i.status === 'OPEN');
  if (yaAbierta) {
    return { ok: false, mensaje: 'Ya tienes una incidencia abierta en esta partida' };
  }

  const incidencia = await db.incident.create({
    data: { bookingId, reportedById: userId, reason: texto },
    select: { id: true },
  });

  return { ok: true, incidentId: incidencia.id };
}

export type ResultadoResolucion = { ok: true } | { ok: false; mensaje: string };

/**
 * Un administrador aprueba la incidencia: el jugador recupera el 100% en saldo.
 *
 * El pago al GM de esa partida queda anulado. Si por lo que fuera ya se hubiera
 * pagado, se avisa en vez de abonar por partida doble.
 */
export async function aprobarIncidencia(
  incidentId: string,
  adminId: string,
  nota: string,
): Promise<ResultadoResolucion> {
  const incidencia = await db.incident.findUnique({
    where: { id: incidentId },
    select: {
      status: true,
      reportedById: true,
      booking: {
        select: {
          id: true,
          amountCents: true,
          status: true,
          game: { select: { title: true, payout: { select: { status: true } } } },
        },
      },
    },
  });

  if (!incidencia) return { ok: false, mensaje: 'Esa incidencia no existe' };

  if (incidencia.status !== 'OPEN') {
    return { ok: false, mensaje: 'Esa incidencia ya esta resuelta' };
  }

  if (incidencia.booking.game.payout?.status === 'PAID') {
    return {
      ok: false,
      mensaje:
        'El pago al game master ya salio. Hay que recuperarlo antes de abonar al jugador.',
    };
  }

  const devueltoCents = importeDevolucionCents(
    incidencia.booking.amountCents,
    PORCENTAJE_DEVOLUCION_INCIDENCIA,
  );

  await db.$transaction(async (tx) => {
    await tx.incident.update({
      where: { id: incidentId },
      data: {
        status: 'APPROVED',
        resolvedById: adminId,
        resolvedAt: new Date(),
        resolutionNote: nota.trim() || null,
      },
    });

    await tx.booking.update({
      where: { id: incidencia.booking.id },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });

    // Una reserva reembolsada no puntua al GM. Si el jugador ya habia dejado
    // resena antes de reclamar, se retira: de lo contrario la regla se
    // esquivaria valorando primero y reclamando despues. `deleteMany` porque
    // lo normal es que no haya ninguna.
    await tx.review.deleteMany({ where: { bookingId: incidencia.booking.id } });

    if (devueltoCents > 0) {
      await abonar(
        {
          userId: incidencia.reportedById,
          amountCents: devueltoCents,
          type: 'REFUND_CREDIT',
          bookingId: incidencia.booking.id,
          note: `Incidencia aprobada en ${incidencia.booking.game.title}`,
          createdById: adminId,
        },
        tx,
      );
    }
  });

  await avisarIncidenciaResuelta(incidentId);

  return { ok: true };
}

/**
 * Un administrador desestima la incidencia: el pago al GM sigue su curso.
 *
 * El `Payout` bloqueado vuelve a entrar en el job diario por si solo, porque la
 * consulta recoge los que quedaron en BLOCKED.
 */
export async function rechazarIncidencia(
  incidentId: string,
  adminId: string,
  nota: string,
): Promise<ResultadoResolucion> {
  const incidencia = await db.incident.findUnique({
    where: { id: incidentId },
    select: { status: true },
  });

  if (!incidencia) return { ok: false, mensaje: 'Esa incidencia no existe' };

  if (incidencia.status !== 'OPEN') {
    return { ok: false, mensaje: 'Esa incidencia ya esta resuelta' };
  }

  if (!nota.trim()) {
    return {
      ok: false,
      mensaje: 'Explica por que se desestima: el jugador tiene derecho a saberlo',
    };
  }

  await db.incident.update({
    where: { id: incidentId },
    data: {
      status: 'REJECTED',
      resolvedById: adminId,
      resolvedAt: new Date(),
      resolutionNote: nota.trim(),
    },
  });

  // Tambien se avisa al desestimar: quien reclama tiene derecho a enterarse de
  // la decision sin volver a entrar en la web a mirar.
  await avisarIncidenciaResuelta(incidentId);

  return { ok: true };
}
