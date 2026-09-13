import type Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/stripe', () => ({
  stripe: vi.fn(),
  urlBase: () => 'http://localhost:3000',
}));

const { leerEstado } = await import('@/modules/payments/connect');

/** Cuenta de Stripe minima, con lo que nos interesa. */
function cuenta(parcial: Partial<Stripe.Account>): Stripe.Account {
  return { id: 'acct_x', object: 'account', ...parcial } as Stripe.Account;
}

describe('leerEstado', () => {
  it('una cuenta recien creada no puede cobrar ni publicar', () => {
    const estado = leerEstado(cuenta({}));

    expect(estado.payoutsEnabled).toBe(false);
    expect(estado.chargesEnabled).toBe(false);
    expect(estado.detailsSubmitted).toBe(false);
  });

  it('una cuenta verificada puede recibir transferencias', () => {
    const estado = leerEstado(
      cuenta({ payouts_enabled: true, charges_enabled: true, details_submitted: true }),
    );

    expect(estado.payoutsEnabled).toBe(true);
  });

  it('haber enviado el formulario no basta para poder cobrar', () => {
    // Caso real y facil de confundir: el GM termina el formulario pero Stripe
    // sigue verificando. Si nos fiaramos de details_submitted, le dejariamos
    // publicar partidas que luego no podria cobrar.
    const estado = leerEstado(
      cuenta({ details_submitted: true, payouts_enabled: false }),
    );

    expect(estado.detailsSubmitted).toBe(true);
    expect(estado.payoutsEnabled).toBe(false);
  });

  it('recoge los datos que Stripe todavia espera', () => {
    const estado = leerEstado(
      cuenta({
        requirements: {
          currently_due: ['individual.id_number'],
          past_due: ['external_account'],
        } as Stripe.Account.Requirements,
      }),
    );

    expect(estado.pendiente).toEqual(['individual.id_number', 'external_account']);
  });

  it('no repite un requisito que aparece en dos listas', () => {
    const estado = leerEstado(
      cuenta({
        requirements: {
          currently_due: ['external_account'],
          past_due: ['external_account'],
        } as Stripe.Account.Requirements,
      }),
    );

    expect(estado.pendiente).toEqual(['external_account']);
  });

  it('sin requisitos devuelve una lista vacia, no undefined', () => {
    expect(leerEstado(cuenta({})).pendiente).toEqual([]);
  });

  it('trata los campos ausentes como false, nunca como undefined', () => {
    const estado = leerEstado(cuenta({ payouts_enabled: undefined }));

    expect(estado.payoutsEnabled).toBe(false);
  });
});
