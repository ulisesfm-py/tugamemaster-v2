import 'server-only';

import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

/**
 * Cierre de partidas y pago a los game masters.
 *
 * Ambas tareas las ejecuta el job diario. Son idempotentes: correrlas dos
 * veces no cierra nada dos veces ni paga dos veces.
 */

/** Horas que el dinero se retiene tras terminar la partida. */
export const HORAS_DE_RETENCION = 48;

/** Tope de partidas por ejecucion, para no agotar el tiempo de la funcion. */
const LOTE = 50;

export type ResultadoTarea = { procesadas: number; detalles: string[] };

/**
 * Marca como terminadas las partidas cuya hora de fin ya paso.
 *
 * Es lo que habilita dejar resena y lo que arranca el reloj de las 48 horas.
 */
export async function cerrarPartidas(ahora = new Date()): Promise<ResultadoTarea> {
  const partidas = await db.game.findMany({
    where: { status: 'PUBLISHED', endsAt: { lt: ahora } },
    select: { id: true, title: true },
    take: LOTE,
  });

  const detalles: string[] = [];

  for (const partida of partidas) {
    await db.$transaction([
      db.game.update({ where: { id: partida.id }, data: { status: 'COMPLETED' } }),
      // Solo las pagadas pasan a jugadas. Una PENDING que nunca se cobro no se
      // convierte en asistencia.
      db.booking.updateMany({
        where: { gameId: partida.id, status: 'PAID' },
        data: { status: 'COMPLETED' },
      }),
    ]);

    detalles.push(`cerrada: ${partida.title}`);
  }

  return { procesadas: partidas.length, detalles };
}

/**
 * Transfiere a cada GM lo que le corresponde de las partidas ya cerradas.
 *
 * Condiciones para pagar, todas obligatorias:
 *   - la partida termino hace mas de 48 horas
 *   - no tiene ninguna incidencia abierta
 *   - no tiene ya un Payout
 *   - el GM tiene cuenta verificada
 */
export async function pagarGms(ahora = new Date()): Promise<ResultadoTarea> {
  const limite = new Date(ahora.getTime() - HORAS_DE_RETENCION * 3_600_000);

  const partidas = await db.game.findMany({
    where: {
      status: 'COMPLETED',
      endsAt: { lt: limite },
      bookings: { some: { status: 'COMPLETED' } },
      // Sin pagar todavia, o con un intento anterior bloqueado o fallido. Un
      // bloqueo tiene que poder reintentarse: una incidencia se resuelve y una
      // cuenta sin verificar acaba verificandose.
      OR: [
        { payout: { is: null } },
        { payout: { status: { in: ['BLOCKED', 'FAILED'] } } },
      ],
    },
    select: {
      id: true,
      title: true,
      currency: true,
      gm: { select: { id: true, stripeAccountId: true, payoutsEnabled: true } },
      payout: { select: { id: true } },
      bookings: {
        where: { status: 'COMPLETED' },
        select: { id: true, payoutCents: true },
      },
    },
    take: LOTE,
  });

  const detalles: string[] = [];
  let procesadas = 0;

  for (const partida of partidas) {
    const incidenciasAbiertas = await db.incident.count({
      where: { booking: { gameId: partida.id }, status: 'OPEN' },
    });

    if (incidenciasAbiertas > 0) {
      await registrarBloqueo(partida.id, partida.gm.id, 'Incidencia abierta');
      detalles.push(`bloqueada por incidencia: ${partida.title}`);
      continue;
    }

    if (!partida.gm.payoutsEnabled || !partida.gm.stripeAccountId) {
      await registrarBloqueo(partida.id, partida.gm.id, 'Cuenta del GM sin verificar');
      detalles.push(`bloqueada, GM sin verificar: ${partida.title}`);
      continue;
    }

    const items = partida.bookings.filter((b) => (b.payoutCents ?? 0) > 0);
    const total = items.reduce((suma, b) => suma + (b.payoutCents ?? 0), 0);

    if (total <= 0) {
      detalles.push(`sin importe que transferir: ${partida.title}`);
      continue;
    }

    // El Payout se registra antes de llamar a Stripe: si la transferencia
    // falla, queda la fila con el motivo anotado en vez de perderse el rastro.
    // Se usa upsert porque puede existir ya de un intento bloqueado.
    const payout = await db.payout.upsert({
      where: { gameId: partida.id },
      update: {
        amountCents: total,
        status: 'PENDING',
        blockedReason: null,
        items: {
          deleteMany: {},
          create: items.map((b) => ({
            bookingId: b.id,
            amountCents: b.payoutCents ?? 0,
          })),
        },
      },
      create: {
        gmId: partida.gm.id,
        gameId: partida.id,
        amountCents: total,
        currency: partida.currency,
        status: 'PENDING',
        scheduledFor: limite,
        items: {
          create: items.map((b) => ({
            bookingId: b.id,
            amountCents: b.payoutCents ?? 0,
          })),
        },
      },
      select: { id: true },
    });

    try {
      const transferencia = await stripe().transfers.create(
        {
          amount: total,
          currency: partida.currency.toLowerCase(),
          destination: partida.gm.stripeAccountId,
          transfer_group: partida.id,
          metadata: { gameId: partida.id, payoutId: payout.id },
        },
        {
          // La clave incluye el importe. Si un intento fallo y despues cambia
          // lo que hay que transferir, es una operacion distinta y necesita
          // clave nueva; Stripe rechaza reutilizar una con otros parametros.
          //
          // Que la partida se pague una sola vez lo garantiza el Payout con
          // gameId unico: la consulta excluye las que ya estan PAID. Esta
          // clave es la segunda red, para que un reintento con el mismo
          // importe devuelva la transferencia original en vez de crear otra.
          idempotencyKey: `payout:${partida.id}:${total}`,
        },
      );

      await db.$transaction([
        db.payout.update({
          where: { id: payout.id },
          data: {
            status: 'PAID',
            stripeTransferId: transferencia.id,
            paidAt: new Date(),
          },
        }),
        ...items.map((b) =>
          db.paymentEvent.create({
            data: {
              bookingId: b.id,
              type: 'TRANSFER',
              status: 'SUCCEEDED',
              amountCents: b.payoutCents ?? 0,
              currency: partida.currency,
              stripeId: `${transferencia.id}:${b.id}`,
              idempotencyKey: `transfer:${b.id}`,
            },
          }),
        ),
      ]);

      procesadas++;
      detalles.push(`pagada: ${partida.title} (${total} centimos)`);
    } catch (error) {
      await db.payout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          blockedReason: (error as Error).message.slice(0, 500),
        },
      });

      detalles.push(`fallo al pagar ${partida.title}: ${(error as Error).message}`);
    }
  }

  return { procesadas, detalles };
}

/** Deja constancia de por que una partida no se ha pagado todavia. */
async function registrarBloqueo(
  gameId: string,
  gmId: string,
  motivo: string,
): Promise<void> {
  await db.payout.upsert({
    where: { gameId },
    update: { status: 'BLOCKED', blockedReason: motivo },
    create: {
      gmId,
      gameId,
      amountCents: 0,
      status: 'BLOCKED',
      blockedReason: motivo,
      scheduledFor: new Date(),
    },
  });
}
