import { describe, expect, it } from 'vitest';

import {
  METODOS_DE_PAGO,
  parametrosDeSesion,
  type DatosDeSesion,
} from '@/modules/payments/sesion';

const datos: DatosDeSesion = {
  bookingId: 'res_123',
  email: 'ana@example.com',
  titulo: 'El faro de Finisterre',
  sistema: 'D&D 5e',
  empieza: new Date('2026-12-30T22:00:00Z'),
  currency: 'EUR',
  pendienteCents: 1500,
  creditoCents: 0,
  base: 'https://tugamemaster.com',
  slugPartida: 'el-faro-de-finisterre',
};

describe('parametrosDeSesion: metodos de pago', () => {
  const p = parametrosDeSesion(datos);

  it('solo admite tarjeta', () => {
    expect(p.payment_method_types).toEqual(['card']);
    expect(METODOS_DE_PAGO).toEqual(['card']);
  });

  it('no deja que Stripe elija metodos por su cuenta', () => {
    // Con `payment_method_types` fijo, Stripe no ensena los metodos que haya
    // activados en su panel (iDEAL, Bancontact, EPS...). Si alguien cambia a
    // metodos dinamicos, este ajuste se pierde sin que nada falle.
    expect(p).not.toHaveProperty('automatic_payment_methods');
    expect(p).not.toHaveProperty('payment_method_configuration');
  });
});

describe('parametrosDeSesion: lo que se cobra', () => {
  it('cobra lo pendiente, en la moneda de la reserva y en minusculas', () => {
    const p = parametrosDeSesion({ ...datos, pendienteCents: 1350, currency: 'EUR' });
    const linea = p.line_items?.[0];

    expect(p.mode).toBe('payment');
    expect(linea?.quantity).toBe(1);
    expect(linea?.price_data?.unit_amount).toBe(1350);
    expect(linea?.price_data?.currency).toBe('eur');
  });

  it('el importe es el entero en centimos que se le pasa, sin tocarlo', () => {
    const p = parametrosDeSesion({ ...datos, pendienteCents: 1 });
    expect(p.line_items?.[0]?.price_data?.unit_amount).toBe(1);
  });

  it('avisa de lo que cubre el saldo solo si cubre algo', () => {
    const sin = parametrosDeSesion(datos).line_items?.[0]?.price_data?.product_data;
    const con = parametrosDeSesion({ ...datos, creditoCents: 450 }).line_items?.[0]
      ?.price_data?.product_data;

    expect(sin?.description).not.toContain('saldo');
    expect(con?.description).toContain('4.50 EUR cubiertos con tu saldo');
  });

  it('el titulo de la partida es el nombre del producto', () => {
    expect(
      parametrosDeSesion(datos).line_items?.[0]?.price_data?.product_data?.name,
    ).toBe('El faro de Finisterre');
  });
});

describe('parametrosDeSesion: identificar la reserva', () => {
  const p = parametrosDeSesion(datos);

  it('lleva el bookingId en los metadatos de la sesion y del PaymentIntent', () => {
    // El webhook recibe el PaymentIntent: sin esto no sabria de que reserva es.
    expect(p.metadata).toEqual({ bookingId: 'res_123' });
    expect(p.payment_intent_data?.metadata).toEqual({ bookingId: 'res_123' });
  });

  it('vuelve a la ficha de la partida, pagada o cancelada', () => {
    expect(p.success_url).toBe(
      'https://tugamemaster.com/partidas/el-faro-de-finisterre?pago=ok',
    );
    expect(p.cancel_url).toBe(
      'https://tugamemaster.com/partidas/el-faro-de-finisterre?pago=cancelado',
    );
  });

  it('manda el correo del jugador y la pagina en espanol', () => {
    expect(p.customer_email).toBe('ana@example.com');
    expect(p.locale).toBe('es');
  });
});
