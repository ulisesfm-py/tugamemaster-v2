import 'server-only';

import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { avisarPagoEnviado } from '@/modules/notifications/service';

import { HORAS_DE_RETENCION } from './libro';
import {
  clasificarFallo,
  claveDeTransferencia,
  decidirTransferencia,
  MOTIVO_ESPERANDO_FONDOS,
  type TransferenciaExistente,
} from './transferencias';

export { HORAS_DE_RETENCION };

/**
 * Cierre de partidas y pago a los game masters.
 *
 * Ambas tareas las ejecuta el job diario. Son idempotentes: correrlas dos
 * veces no cierra nada dos veces ni paga dos veces.
 */

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
 *   - no esta ya pagada, ni aqui ni en Stripe (se pregunta antes)
 *   - el GM tiene cuenta verificada
 *   - hay dinero disponible en Stripe para pagarla
 *
 * Las reglas de que hacer en cada caso estan en `transferencias.ts`.
 */
export async function pagarGms(ahora = new Date()): Promise<ResultadoTarea> {
  const limite = new Date(ahora.getTime() - HORAS_DE_RETENCION * 3_600_000);

  const partidas = await db.game.findMany({
    where: {
      status: 'COMPLETED',
      endsAt: { lt: limite },
      bookings: { some: { status: 'COMPLETED' } },
      // Sin pagar todavia, o con un intento anterior sin terminar. Un bloqueo
      // tiene que poder reintentarse (una incidencia se resuelve, una cuenta
      // acaba verificandose), y un pendiente tambien: es el que espera a que
      // Stripe libere el dinero, o uno que se quedo a medias. Reintentar no
      // puede pagar dos veces: antes de transferir se pregunta a Stripe.
      OR: [
        { payout: { is: null } },
        { payout: { status: { in: ['PENDING', 'BLOCKED', 'FAILED'] } } },
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

  // Una consulta de saldo por ejecucion, descontando lo que se va pagando.
  const saldo = saldoDeLaEjecucion();

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

    // 1. El seguro antiduplicados: que tiene ya Stripe para esta partida. Y
    //    cuanto dinero hay disponible. Si no se puede preguntar, no se
    //    transfiere: mejor un dia tarde que dos veces.
    let existentes: TransferenciaExistente[];
    let disponibleCents: number;

    try {
      existentes = await transferenciasDeLaPartida(partida.id);
      disponibleCents = await saldo.disponible(partida.currency);
    } catch (error) {
      detalles.push(
        `sin poder consultar Stripe, queda para la proxima: ${partida.title}: ${(error as Error).message}`,
      );
      continue;
    }

    const decision = decidirTransferencia({
      existentes,
      totalCents: total,
      disponibleCents,
    });

    if (decision.tipo === 'REVISAR') {
      await registrarBloqueo(partida.id, partida.gm.id, decision.motivo);
      detalles.push(`para revisar a mano: ${partida.title}`);
      continue;
    }

    // 2. El Payout se registra antes de llamar a Stripe: si la transferencia
    //    falla, queda la fila con el motivo anotado en vez de perderse el
    //    rastro. Upsert porque puede existir ya de un intento anterior.
    const payout = await prepararPayout(
      partida,
      items,
      total,
      limite,
      decision.tipo === 'ESPERAR_FONDOS' ? MOTIVO_ESPERANDO_FONDOS : null,
    );

    if (decision.tipo === 'ESPERAR_FONDOS') {
      detalles.push(`esperando a que Stripe libere el dinero: ${partida.title}`);
      continue;
    }

    if (decision.tipo === 'YA_PAGADA') {
      // La transferencia existe en Stripe pero no constaba aqui (se corto la
      // conexion tras crearla, por ejemplo). Se apunta, no se repite.
      await apuntarPagada(payout.id, partida.currency, items, decision.transferId);
      await avisarPagoEnviado(payout.id);
      procesadas++;
      detalles.push(`ya estaba pagada en Stripe, se apunta: ${partida.title}`);
      continue;
    }

    // 3. Transferir. El try envuelve solo la llamada a Stripe: lo que falle
    //    despues ya no es un fallo de la transferencia.
    let transferId: string;

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
          // La clave incluye el importe: si cambia lo que hay que transferir,
          // es otra operacion. Y el numero de rechazos: tras un «no» de
          // Stripe se estrena clave, porque la anterior devolveria el mismo
          // «no» guardado. Ver `transferencias.ts`.
          idempotencyKey: claveDeTransferencia(
            partida.id,
            total,
            payout.rejectedAttempts,
          ),
        },
      );

      transferId = transferencia.id;
    } catch (error) {
      const fallo = clasificarFallo(error);

      if (fallo.tipo === 'RECHAZO') {
        // Stripe dijo que no: no se movio dinero. Se cuenta el rechazo para
        // estrenar clave en el siguiente intento. Sin fondos no es un fallo
        // del GM ni de su cuenta: se espera, igual que arriba.
        await db.payout.update({
          where: { id: payout.id },
          data: {
            status: fallo.sinFondos ? 'PENDING' : 'FAILED',
            blockedReason: fallo.sinFondos
              ? MOTIVO_ESPERANDO_FONDOS
              : fallo.mensaje.slice(0, 500),
            rejectedAttempts: { increment: 1 },
          },
        });
      } else {
        // No se sabe si llego a crearse: la clave no cambia. Si se creo, el
        // siguiente intento la encuentra al preguntar a Stripe.
        await db.payout.update({
          where: { id: payout.id },
          data: { status: 'FAILED', blockedReason: fallo.mensaje.slice(0, 500) },
        });
      }

      detalles.push(`fallo al pagar ${partida.title}: ${fallo.mensaje}`);
      continue;
    }

    // 4. Apuntarla. Si esto falla, el dinero ya salio: la partida se queda
    //    pendiente y el siguiente intento la encuentra en Stripe y la apunta,
    //    sin volver a transferir.
    saldo.gastar(partida.currency, total);

    try {
      await apuntarPagada(payout.id, partida.currency, items, transferId);
    } catch (error) {
      detalles.push(
        `transferida pero sin apuntar, se apunta en la proxima: ${partida.title}: ${(error as Error).message}`,
      );
      continue;
    }

    await avisarPagoEnviado(payout.id);
    procesadas++;
    detalles.push(`pagada: ${partida.title} (${total} centimos)`);
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

/* ── Stripe y la base, para pagarGms ────────────────────────────────────── */

/** Las transferencias que Stripe tiene ya para una partida. */
async function transferenciasDeLaPartida(
  gameId: string,
): Promise<TransferenciaExistente[]> {
  const lista = await stripe().transfers.list({ transfer_group: gameId, limit: 10 });
  return lista.data.map((t) => ({
    id: t.id,
    amount: t.amount,
    amountReversed: t.amount_reversed,
  }));
}

/**
 * El saldo disponible de la plataforma durante una ejecucion.
 *
 * Se pregunta a Stripe una vez por moneda y se va descontando lo que se paga,
 * para no intentar dos transferencias con el mismo dinero.
 */
function saldoDeLaEjecucion() {
  const porMoneda = new Map<string, number>();

  return {
    async disponible(currency: string): Promise<number> {
      const moneda = currency.toLowerCase();
      const conocido = porMoneda.get(moneda);
      if (conocido !== undefined) return conocido;

      const balance = await stripe().balance.retrieve();
      const importe = balance.available.find((b) => b.currency === moneda)?.amount ?? 0;
      porMoneda.set(moneda, importe);
      return importe;
    },
    gastar(currency: string, cents: number): void {
      const moneda = currency.toLowerCase();
      porMoneda.set(moneda, (porMoneda.get(moneda) ?? 0) - cents);
    },
  };
}

/** Crea o pone al dia el Payout de una partida antes de transferir. */
async function prepararPayout(
  partida: { id: string; currency: string; gm: { id: string } },
  items: { id: string; payoutCents: number | null }[],
  total: number,
  limite: Date,
  motivo: string | null,
) {
  const lineas = items.map((b) => ({ bookingId: b.id, amountCents: b.payoutCents ?? 0 }));

  return db.payout.upsert({
    where: { gameId: partida.id },
    update: {
      amountCents: total,
      status: 'PENDING',
      blockedReason: motivo,
      items: { deleteMany: {}, create: lineas },
    },
    create: {
      gmId: partida.gm.id,
      gameId: partida.id,
      amountCents: total,
      currency: partida.currency,
      status: 'PENDING',
      blockedReason: motivo,
      scheduledFor: limite,
      items: { create: lineas },
    },
    select: { id: true, rejectedAttempts: true },
  });
}

/**
 * Apunta como pagada una partida cuya transferencia existe en Stripe.
 *
 * Los apuntes de cada reserva llevan claves unicas (`transfer:<reserva>`):
 * si alguno ya estaba, no se duplica.
 */
async function apuntarPagada(
  payoutId: string,
  currency: string,
  items: { id: string; payoutCents: number | null }[],
  transferId: string,
): Promise<void> {
  await db.$transaction([
    db.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        stripeTransferId: transferId,
        blockedReason: null,
        paidAt: new Date(),
      },
    }),
    db.paymentEvent.createMany({
      data: items.map((b) => ({
        bookingId: b.id,
        type: 'TRANSFER' as const,
        status: 'SUCCEEDED' as const,
        amountCents: b.payoutCents ?? 0,
        currency,
        stripeId: `${transferId}:${b.id}`,
        idempotencyKey: `transfer:${b.id}`,
      })),
      skipDuplicates: true,
    }),
  ]);
}
