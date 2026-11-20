import Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * El pago a los game masters, de punta a punta, con Stripe y la base falsos.
 *
 * Simula los casos delicados: una transferencia que ya existe, dinero que
 * aun no esta disponible, un rechazo de Stripe, un corte de conexion y un
 * fallo al apuntar despues de transferir. Lo que se vigila en todos: que
 * `transfers.create` se llama como mucho una vez, y nunca si ya habia una.
 */

const db = {
  game: { findMany: vi.fn() },
  incident: { count: vi.fn() },
  payout: { upsert: vi.fn(), update: vi.fn() },
  paymentEvent: { createMany: vi.fn() },
  $transaction: vi.fn(),
};

const stripeFalso = {
  transfers: { list: vi.fn(), create: vi.fn() },
  balance: { retrieve: vi.fn() },
};

const avisarPagoEnviado = vi.fn();

vi.mock('@/lib/db', () => ({ db }));
vi.mock('@/lib/stripe', () => ({ stripe: () => stripeFalso }));
vi.mock('@/modules/notifications/service', () => ({ avisarPagoEnviado }));

const { pagarGms } = await import('@/modules/payments/payouts');
const { MOTIVO_ESPERANDO_FONDOS } = await import('@/modules/payments/transferencias');

function partida(id: string, payoutCents = 63) {
  return {
    id,
    title: `Partida ${id}`,
    currency: 'EUR',
    gm: { id: 'gm1', stripeAccountId: 'acct_gm', payoutsEnabled: true },
    payout: null,
    bookings: [{ id: `b-${id}`, payoutCents }],
  };
}

/** Lo que se escribio en el Payout en la ultima actualizacion. */
function ultimaActualizacion() {
  return db.payout.update.mock.calls.at(-1)?.[0]?.data;
}

beforeEach(() => {
  vi.clearAllMocks();
  db.incident.count.mockResolvedValue(0);
  db.payout.upsert.mockResolvedValue({ id: 'p1', rejectedAttempts: 0 });
  db.payout.update.mockResolvedValue({});
  db.paymentEvent.createMany.mockResolvedValue({ count: 1 });
  db.$transaction.mockImplementation((operaciones: Promise<unknown>[]) =>
    Promise.all(operaciones),
  );
  stripeFalso.transfers.list.mockResolvedValue({ data: [] });
  stripeFalso.transfers.create.mockResolvedValue({ id: 'tr_nueva' });
  stripeFalso.balance.retrieve.mockResolvedValue({
    available: [{ currency: 'eur', amount: 10_000 }],
  });
});

describe('pagarGms', () => {
  it('con dinero disponible, transfiere una vez con la clave de siempre y la apunta', async () => {
    db.game.findMany.mockResolvedValue([partida('g1')]);

    await pagarGms();

    expect(stripeFalso.transfers.create).toHaveBeenCalledTimes(1);
    expect(stripeFalso.transfers.create.mock.calls[0]?.[1]).toEqual({
      idempotencyKey: 'payout:g1:63',
    });
    expect(ultimaActualizacion()).toMatchObject({
      status: 'PAID',
      stripeTransferId: 'tr_nueva',
    });
    expect(avisarPagoEnviado).toHaveBeenCalledTimes(1);
  });

  it('si Stripe ya tiene la transferencia, no crea otra: la apunta', async () => {
    db.game.findMany.mockResolvedValue([partida('g1')]);
    stripeFalso.transfers.list.mockResolvedValue({
      data: [{ id: 'tr_vieja', amount: 63, amount_reversed: 0 }],
    });

    await pagarGms();

    expect(stripeFalso.transfers.list).toHaveBeenCalledWith({
      transfer_group: 'g1',
      limit: 10,
    });
    expect(stripeFalso.transfers.create).not.toHaveBeenCalled();
    expect(ultimaActualizacion()).toMatchObject({
      status: 'PAID',
      stripeTransferId: 'tr_vieja',
    });
  });

  it('si en Stripe hay algo que no cuadra, no transfiere y lo deja para revisar', async () => {
    db.game.findMany.mockResolvedValue([partida('g1')]);
    stripeFalso.transfers.list.mockResolvedValue({
      data: [{ id: 'tr_vieja', amount: 63, amount_reversed: 63 }],
    });

    await pagarGms();

    expect(stripeFalso.transfers.create).not.toHaveBeenCalled();
    expect(db.payout.upsert.mock.calls.at(-1)?.[0]?.update).toMatchObject({
      status: 'BLOCKED',
    });
  });

  it('sin dinero disponible no llama a Stripe para transferir: espera', async () => {
    db.game.findMany.mockResolvedValue([partida('g1')]);
    stripeFalso.balance.retrieve.mockResolvedValue({
      available: [{ currency: 'eur', amount: -32 }],
    });

    await pagarGms();

    expect(stripeFalso.transfers.create).not.toHaveBeenCalled();
    expect(db.payout.upsert.mock.calls.at(-1)?.[0]?.update).toMatchObject({
      status: 'PENDING',
      blockedReason: MOTIVO_ESPERANDO_FONDOS,
    });
  });

  it('el saldo se descuenta durante la ejecucion: no paga dos partidas con el mismo dinero', async () => {
    db.game.findMany.mockResolvedValue([partida('g1', 63), partida('g2', 63)]);
    stripeFalso.balance.retrieve.mockResolvedValue({
      available: [{ currency: 'eur', amount: 100 }],
    });

    await pagarGms();

    expect(stripeFalso.transfers.create).toHaveBeenCalledTimes(1);
    expect(stripeFalso.balance.retrieve).toHaveBeenCalledTimes(1);
  });

  it('un rechazo por fondos deja el pago esperando y cuenta el rechazo', async () => {
    db.game.findMany.mockResolvedValue([partida('g1')]);
    stripeFalso.transfers.create.mockRejectedValue(
      new Stripe.errors.StripeInvalidRequestError({
        message: 'Insufficient funds in Stripe account.',
        code: 'balance_insufficient',
      }),
    );

    await pagarGms();

    expect(ultimaActualizacion()).toEqual({
      status: 'PENDING',
      blockedReason: MOTIVO_ESPERANDO_FONDOS,
      rejectedAttempts: { increment: 1 },
    });
  });

  it('tras un rechazo, el siguiente intento estrena clave', async () => {
    db.game.findMany.mockResolvedValue([partida('g1')]);
    db.payout.upsert.mockResolvedValue({ id: 'p1', rejectedAttempts: 1 });

    await pagarGms();

    expect(stripeFalso.transfers.create.mock.calls[0]?.[1]).toEqual({
      idempotencyKey: 'payout:g1:63:r1',
    });
  });

  it('un corte de conexion no cuenta como rechazo: la clave se mantiene', async () => {
    db.game.findMany.mockResolvedValue([partida('g1')]);
    stripeFalso.transfers.create.mockRejectedValue(
      new Stripe.errors.StripeConnectionError({ message: 'Socket hang up' }),
    );

    await pagarGms();

    const datos = ultimaActualizacion();
    expect(datos).toMatchObject({ status: 'FAILED' });
    expect(datos).not.toHaveProperty('rejectedAttempts');
  });

  it('si no se puede preguntar a Stripe, no transfiere ni toca el pago', async () => {
    db.game.findMany.mockResolvedValue([partida('g1')]);
    stripeFalso.transfers.list.mockRejectedValue(
      new Stripe.errors.StripeConnectionError({ message: 'Socket hang up' }),
    );

    const resultado = await pagarGms();

    expect(stripeFalso.transfers.create).not.toHaveBeenCalled();
    expect(db.payout.upsert).not.toHaveBeenCalled();
    expect(db.payout.update).not.toHaveBeenCalled();
    expect(resultado.detalles[0]).toContain('queda para la proxima');
  });

  it('si falla el apunte despues de transferir, no la marca como fallida ni repite', async () => {
    db.game.findMany.mockResolvedValue([partida('g1')]);
    db.$transaction.mockRejectedValue(new Error('La base no contesta'));

    const resultado = await pagarGms();

    expect(stripeFalso.transfers.create).toHaveBeenCalledTimes(1);
    expect(db.payout.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
    expect(avisarPagoEnviado).not.toHaveBeenCalled();
    expect(resultado.detalles[0]).toContain('se apunta en la proxima');
  });

  it('una incidencia abierta bloquea antes de preguntar nada a Stripe', async () => {
    db.game.findMany.mockResolvedValue([partida('g1')]);
    db.incident.count.mockResolvedValue(1);

    await pagarGms();

    expect(stripeFalso.transfers.list).not.toHaveBeenCalled();
    expect(stripeFalso.transfers.create).not.toHaveBeenCalled();
  });
});
