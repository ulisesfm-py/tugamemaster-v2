import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';

/**
 * Monedero de saldo.
 *
 * El saldo es la suma de los apuntes de `WalletEntry`, no un contador
 * guardado: un contador acaba desviandose del historial en cuanto falla una
 * escritura, y una suma no puede mentir.
 *
 * El saldo no caduca. Solo un administrador puede convertirlo en dinero real.
 */

type Cliente = Prisma.TransactionClient | typeof db;

/** Saldo disponible de un usuario, en centimos. */
export async function saldoDe(userId: string, cliente: Cliente = db): Promise<number> {
  const suma = await cliente.walletEntry.aggregate({
    where: { userId },
    _sum: { amountCents: true },
  });

  return suma._sum.amountCents ?? 0;
}

/**
 * Abona saldo a un usuario.
 *
 * `idempotencia` evita duplicar un abono si la operacion que lo origina se
 * reintenta: un reembolso aprobado dos veces no puede abonar dos veces.
 */
export async function abonar(
  params: {
    userId: string;
    amountCents: number;
    type: 'REFUND_CREDIT' | 'ADMIN_ADJUSTMENT';
    bookingId?: string;
    note?: string;
    createdById?: string;
  },
  cliente: Cliente = db,
): Promise<void> {
  if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
    throw new Error(`Importe de abono invalido: ${params.amountCents}`);
  }

  await cliente.walletEntry.create({
    data: {
      userId: params.userId,
      amountCents: params.amountCents,
      type: params.type,
      bookingId: params.bookingId ?? null,
      note: params.note ?? null,
      createdById: params.createdById ?? null,
    },
  });
}

export type ResultadoGasto =
  { ok: true; gastadoCents: number } | { ok: false; mensaje: string };

/**
 * Gasta saldo, como mucho hasta `maximoCents`.
 *
 * Devuelve cuanto se ha gastado realmente, que puede ser menos que el maximo
 * si el saldo no llega: el resto se cobrara con tarjeta.
 *
 * **Debe llamarse dentro de una transaccion que ya haya bloqueado la fila del
 * usuario** con `bloquearMonedero`. Sin ese bloqueo, dos reservas simultaneas
 * leerian el mismo saldo y lo gastarian dos veces.
 */
export async function gastarHasta(
  userId: string,
  maximoCents: number,
  bookingId: string,
  cliente: Cliente,
): Promise<number> {
  if (maximoCents <= 0) return 0;

  const disponible = await saldoDe(userId, cliente);
  if (disponible <= 0) return 0;

  const gasto = Math.min(disponible, maximoCents);

  await cliente.walletEntry.create({
    data: {
      userId,
      // Negativo: es un gasto.
      amountCents: -gasto,
      type: 'BOOKING_PAYMENT',
      bookingId,
      note: 'Saldo aplicado a una reserva',
    },
  });

  return gasto;
}

/**
 * Bloquea el monedero de un usuario hasta el final de la transaccion.
 *
 * Se bloquea la fila de `User` porque el saldo se deriva de sus apuntes: no
 * hay una unica fila de saldo que bloquear.
 */
export async function bloquearMonedero(
  userId: string,
  cliente: Prisma.TransactionClient,
): Promise<void> {
  await cliente.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
}

/** Apuntes de un usuario, del mas reciente al mas antiguo. */
export async function movimientos(userId: string, limite = 50) {
  return db.walletEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limite,
    select: {
      id: true,
      amountCents: true,
      currency: true,
      type: true,
      note: true,
      createdAt: true,
      booking: { select: { game: { select: { title: true, slug: true } } } },
    },
  });
}

/**
 * Saldo total pendiente de todos los usuarios.
 *
 * Es dinero nuestro que debemos: conviene poder compararlo con lo que
 * realmente retenemos en Stripe.
 */
export async function saldoPendienteTotal(): Promise<number> {
  const suma = await db.walletEntry.aggregate({ _sum: { amountCents: true } });
  return suma._sum.amountCents ?? 0;
}
