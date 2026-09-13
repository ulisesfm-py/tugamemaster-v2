import { beforeEach, describe, expect, it, vi } from 'vitest';

const aggregate = vi.fn();
const create = vi.fn();

vi.mock('@/lib/db', () => ({
  db: { walletEntry: { aggregate, create, findMany: vi.fn() } },
}));

const { abonar, gastarHasta, saldoDe } = await import('@/modules/wallet/service');

/** Cliente de Prisma falso con el saldo indicado. */
function clienteConSaldo(saldoCents: number) {
  return {
    walletEntry: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { amountCents: saldoCents } }),
      create: vi.fn().mockResolvedValue({}),
    },
  } as never;
}

beforeEach(() => {
  aggregate.mockReset();
  create.mockReset();
});

describe('saldoDe', () => {
  it('suma los apuntes', async () => {
    aggregate.mockResolvedValue({ _sum: { amountCents: 1500 } });

    expect(await saldoDe('u1')).toBe(1500);
  });

  it('un usuario sin apuntes tiene saldo cero, no null', async () => {
    aggregate.mockResolvedValue({ _sum: { amountCents: null } });

    expect(await saldoDe('u1')).toBe(0);
  });
});

describe('abonar', () => {
  it('crea un apunte positivo', async () => {
    create.mockResolvedValue({});

    await abonar({ userId: 'u1', amountCents: 900, type: 'REFUND_CREDIT' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountCents: 900, type: 'REFUND_CREDIT' }),
      }),
    );
  });

  it('rechaza un abono de cero', async () => {
    await expect(
      abonar({ userId: 'u1', amountCents: 0, type: 'REFUND_CREDIT' }),
    ).rejects.toThrow();
  });

  it('rechaza un abono negativo, que seria un gasto encubierto', async () => {
    await expect(
      abonar({ userId: 'u1', amountCents: -500, type: 'REFUND_CREDIT' }),
    ).rejects.toThrow();
  });

  it('rechaza importes con decimales', async () => {
    await expect(
      abonar({ userId: 'u1', amountCents: 10.5, type: 'REFUND_CREDIT' }),
    ).rejects.toThrow();
  });
});

describe('gastarHasta', () => {
  it('gasta el maximo cuando hay saldo de sobra', async () => {
    const cliente = clienteConSaldo(5000);

    expect(await gastarHasta('u1', 1000, 'b1', cliente)).toBe(1000);
  });

  it('gasta solo lo que hay cuando el saldo no llega', async () => {
    // El resto se cobrara con tarjeta.
    const cliente = clienteConSaldo(300);

    expect(await gastarHasta('u1', 1000, 'b1', cliente)).toBe(300);
  });

  it('no gasta nada si no hay saldo', async () => {
    const cliente = clienteConSaldo(0);

    expect(await gastarHasta('u1', 1000, 'b1', cliente)).toBe(0);
  });

  it('no crea ningun apunte si no hay saldo', async () => {
    const cliente = clienteConSaldo(0);

    await gastarHasta('u1', 1000, 'b1', cliente);

    expect(
      (cliente as unknown as { walletEntry: { create: unknown } }).walletEntry.create,
    ).not.toHaveBeenCalled();
  });

  it('el apunte de gasto es negativo', async () => {
    const cliente = clienteConSaldo(5000);

    await gastarHasta('u1', 1000, 'b1', cliente);

    const { create: crear } = (
      cliente as unknown as { walletEntry: { create: ReturnType<typeof vi.fn> } }
    ).walletEntry;

    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountCents: -1000, bookingId: 'b1' }),
      }),
    );
  });

  it('no hace nada si no hay nada que cubrir', async () => {
    const cliente = clienteConSaldo(5000);

    expect(await gastarHasta('u1', 0, 'b1', cliente)).toBe(0);
  });

  it('nunca gasta mas que el saldo disponible', async () => {
    // La propiedad que impide que el saldo se quede en negativo.
    for (const [saldo, pedido] of [
      [0, 100],
      [50, 100],
      [100, 100],
      [150, 100],
    ] as const) {
      const gastado = await gastarHasta('u1', pedido, 'b1', clienteConSaldo(saldo));

      expect(gastado).toBeLessThanOrEqual(saldo);
      expect(gastado).toBeLessThanOrEqual(pedido);
    }
  });
});
