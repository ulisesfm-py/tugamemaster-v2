import Stripe from 'stripe';
import { describe, expect, it } from 'vitest';

import { secretosDeWebhook, verificarEvento } from '@/modules/payments/webhook';

// Una clave inventada: firmar y verificar no llama a la API.
const { webhooks } = new Stripe('sk_test_inventada');

const PLATAFORMA = 'whsec_plataforma';
const CONNECT = 'whsec_cuentas_conectadas';

const cuerpo = JSON.stringify({ id: 'evt_1', object: 'event', type: 'account.updated' });

function firmado(secreto: string) {
  return webhooks.generateTestHeaderString({ payload: cuerpo, secret: secreto });
}

describe('secretosDeWebhook', () => {
  it('recoge los dos destinos', () => {
    expect(
      secretosDeWebhook({
        STRIPE_WEBHOOK_SECRET: PLATAFORMA,
        STRIPE_WEBHOOK_SECRET_CONNECT: CONNECT,
      }),
    ).toEqual([PLATAFORMA, CONNECT]);
  });

  it('el de las cuentas conectadas es opcional: en local hay uno solo', () => {
    expect(
      secretosDeWebhook({
        STRIPE_WEBHOOK_SECRET: PLATAFORMA,
        STRIPE_WEBHOOK_SECRET_CONNECT: '',
      }),
    ).toEqual([PLATAFORMA]);
  });

  it('sin ninguno, la lista queda vacia', () => {
    expect(secretosDeWebhook({ STRIPE_WEBHOOK_SECRET: '  ' })).toEqual([]);
  });
});

describe('verificarEvento', () => {
  it('acepta un evento firmado por la plataforma', async () => {
    const evento = await verificarEvento(webhooks, cuerpo, firmado(PLATAFORMA), [
      PLATAFORMA,
      CONNECT,
    ]);
    expect(evento?.id).toBe('evt_1');
  });

  it('acepta un evento firmado por el destino de las cuentas conectadas', async () => {
    const evento = await verificarEvento(webhooks, cuerpo, firmado(CONNECT), [
      PLATAFORMA,
      CONNECT,
    ]);
    expect(evento?.type).toBe('account.updated');
  });

  it('rechaza una firma que no es de ninguno', async () => {
    expect(
      await verificarEvento(webhooks, cuerpo, firmado('whsec_ajeno'), [
        PLATAFORMA,
        CONNECT,
      ]),
    ).toBeNull();
  });

  it('rechaza un cuerpo alterado aunque la firma fuera buena', async () => {
    const firma = firmado(PLATAFORMA);
    const alterado = cuerpo.replace('evt_1', 'evt_2');
    expect(await verificarEvento(webhooks, alterado, firma, [PLATAFORMA])).toBeNull();
  });
});
