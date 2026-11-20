import Stripe from 'stripe';
import { describe, expect, it } from 'vitest';

import {
  clasificarFallo,
  claveDeTransferencia,
  decidirTransferencia,
} from '@/modules/payments/transferencias';

describe('decidirTransferencia', () => {
  const base = { existentes: [], totalCents: 630, disponibleCents: 1000 };

  it('sin nada en Stripe y con dinero disponible, se transfiere', () => {
    expect(decidirTransferencia(base)).toEqual({ tipo: 'TRANSFERIR' });
  });

  it('sin dinero disponible se espera, sin intentarlo', () => {
    expect(decidirTransferencia({ ...base, disponibleCents: 629 })).toEqual({
      tipo: 'ESPERAR_FONDOS',
    });
    expect(decidirTransferencia({ ...base, disponibleCents: -32 })).toEqual({
      tipo: 'ESPERAR_FONDOS',
    });
  });

  it('justo el dinero que hace falta basta', () => {
    expect(decidirTransferencia({ ...base, disponibleCents: 630 }).tipo).toBe(
      'TRANSFERIR',
    );
  });

  it('si Stripe ya tiene la transferencia, se apunta y no se crea otra, haya o no saldo', () => {
    const existentes = [{ id: 'tr_1', amount: 630, amountReversed: 0 }];

    expect(decidirTransferencia({ ...base, existentes })).toEqual({
      tipo: 'YA_PAGADA',
      transferId: 'tr_1',
    });
    expect(decidirTransferencia({ ...base, existentes, disponibleCents: 0 })).toEqual({
      tipo: 'YA_PAGADA',
      transferId: 'tr_1',
    });
  });

  it('una transferencia que no cuadra no se da por buena ni se pisa: se revisa a mano', () => {
    const otroImporte = [{ id: 'tr_1', amount: 500, amountReversed: 0 }];
    const revertida = [{ id: 'tr_1', amount: 630, amountReversed: 630 }];
    const dos = [
      { id: 'tr_1', amount: 630, amountReversed: 0 },
      { id: 'tr_2', amount: 630, amountReversed: 0 },
    ];

    for (const existentes of [otroImporte, revertida, dos]) {
      expect(decidirTransferencia({ ...base, existentes }).tipo).toBe('REVISAR');
    }
  });
});

describe('claveDeTransferencia', () => {
  it('el primer intento conserva la clave de siempre', () => {
    // Asi una transferencia lanzada antes de este cambio se sigue reconociendo.
    expect(claveDeTransferencia('g1', 63, 0)).toBe('payout:g1:63');
  });

  it('cada rechazo estrena clave', () => {
    const claves = [0, 1, 2].map((n) => claveDeTransferencia('g1', 63, n));
    expect(new Set(claves).size).toBe(3);
    expect(claves[1]).toBe('payout:g1:63:r1');
  });

  it('otro importe es otra clave', () => {
    expect(claveDeTransferencia('g1', 63, 0)).not.toBe(claveDeTransferencia('g1', 64, 0));
  });
});

describe('clasificarFallo', () => {
  it('saldo insuficiente es un rechazo, y sin fondos', () => {
    const error = new Stripe.errors.StripeInvalidRequestError({
      message: 'Insufficient funds in Stripe account.',
      code: 'balance_insufficient',
    });

    expect(clasificarFallo(error)).toMatchObject({
      tipo: 'RECHAZO',
      codigo: 'balance_insufficient',
      sinFondos: true,
    });
  });

  it('otra peticion invalida es un rechazo, pero no por fondos', () => {
    const error = new Stripe.errors.StripeInvalidRequestError({
      message: 'No such destination',
      code: 'resource_missing',
    });

    expect(clasificarFallo(error)).toMatchObject({ tipo: 'RECHAZO', sinFondos: false });
  });

  it('un problema de permisos tambien es un rechazo', () => {
    const error = new Stripe.errors.StripePermissionError({ message: 'No permission' });
    expect(clasificarFallo(error).tipo).toBe('RECHAZO');
  });

  it('lo que no deja saber si se creo la transferencia es incierto', () => {
    const inciertos = [
      new Stripe.errors.StripeConnectionError({ message: 'Socket hang up' }),
      new Stripe.errors.StripeAPIError({ message: 'Internal error' }),
      new Stripe.errors.StripeRateLimitError({ message: 'Too many requests' }),
      new Stripe.errors.StripeIdempotencyError({ message: 'Keys reused' }),
      new Error('Algo raro'),
      'una cadena',
      null,
    ];

    for (const error of inciertos) {
      expect(clasificarFallo(error).tipo).toBe('INCIERTO');
    }
  });
});
