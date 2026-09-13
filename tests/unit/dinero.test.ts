import { describe, expect, it } from 'vitest';

import {
  calcularReparto,
  COMISION_PUNTOS_BASICOS,
  formatearImporte,
  repartoInsuficiente,
} from '@/modules/payments/dinero';

describe('calcularReparto', () => {
  it('reparte un asiento de 15 EUR', () => {
    // 15,00 EUR con un coste de Stripe de 0,47 EUR.
    const r = calcularReparto(1500, 47);

    expect(r.commissionCents).toBe(75); // 5%
    expect(r.stripeFeeCents).toBe(47);
    expect(r.payoutCents).toBe(1378); // 1500 - 75 - 47
  });

  it('todo suma exactamente el importe cobrado', () => {
    // La propiedad que de verdad importa: no puede perderse ni aparecer un
    // centimo por el camino.
    for (const importe of [100, 999, 1500, 2000, 3333, 12345]) {
      const r = calcularReparto(importe, 47);

      expect(r.commissionCents + r.stripeFeeCents + r.payoutCents).toBe(importe);
    }
  });

  it('redondea la comision al centimo, sin decimales', () => {
    // 5% de 999 = 49,95 -> 50
    expect(calcularReparto(999, 0).commissionCents).toBe(50);
  });

  it('la comision es del 5%', () => {
    expect(COMISION_PUNTOS_BASICOS).toBe(500);
    expect(calcularReparto(10_000, 0).commissionCents).toBe(500);
  });

  it('nunca devuelve un pago negativo al GM', () => {
    // Un asiento de 0,50 EUR no cubre el coste fijo de Stripe. Transferir un
    // negativo seria rechazado por Stripe; se deja en cero.
    const r = calcularReparto(50, 47);

    expect(r.payoutCents).toBeGreaterThanOrEqual(0);
  });

  it('una partida gratuita no genera comision ni pago', () => {
    const r = calcularReparto(0, 0);

    expect(r.commissionCents).toBe(0);
    expect(r.payoutCents).toBe(0);
  });

  it('rechaza importes no enteros, que serian centimos fraccionados', () => {
    expect(() => calcularReparto(15.5, 47)).toThrow();
  });

  it('rechaza importes negativos', () => {
    expect(() => calcularReparto(-100, 47)).toThrow();
  });

  it('rechaza un coste de Stripe negativo', () => {
    expect(() => calcularReparto(1500, -1)).toThrow();
  });
});

describe('repartoInsuficiente', () => {
  it('detecta un precio que no cubre sus propios costes', () => {
    expect(repartoInsuficiente(calcularReparto(50, 47))).toBe(true);
  });

  it('un precio normal no se marca', () => {
    expect(repartoInsuficiente(calcularReparto(1500, 47))).toBe(false);
  });

  it('una partida gratuita no se considera insuficiente', () => {
    // No hay nada que repartir, pero tampoco es un error de precio.
    expect(repartoInsuficiente(calcularReparto(0, 0))).toBe(false);
  });
});

describe('formatearImporte', () => {
  it('muestra los centimos como euros', () => {
    expect(formatearImporte(1500)).toContain('15');
  });

  it('no pierde los decimales', () => {
    expect(formatearImporte(1378)).toContain('13,78');
  });
});
