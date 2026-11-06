import { describe, expect, it } from 'vitest';

import {
  calcularReparto,
  COMISION_ESTANDAR,
  COMISION_FUNDADOR,
  COMISION_FUNDADOR_ENLACE,
  comisionAplicable,
  formatearImporte,
  porcentaje,
  repartoInsuficiente,
} from '@/modules/payments/dinero';

/** La comision de las reservas vendidas antes del cambio, que se conserva. */
const CINCO = 500;

describe('calcularReparto', () => {
  it('reparte un asiento de 15 EUR', () => {
    // 15,00 EUR con un coste de Stripe de 0,47 EUR.
    const r = calcularReparto(1500, 47, CINCO);

    expect(r.commissionCents).toBe(75); // 5%
    expect(r.stripeFeeCents).toBe(47);
    expect(r.payoutCents).toBe(1378); // 1500 - 75 - 47
  });

  it('todo suma exactamente el importe cobrado', () => {
    // La propiedad que de verdad importa: no puede perderse ni aparecer un
    // centimo por el camino.
    for (const importe of [100, 999, 1500, 2000, 3333, 12345]) {
      const r = calcularReparto(importe, 47, CINCO);

      expect(r.commissionCents + r.stripeFeeCents + r.payoutCents).toBe(importe);
    }
  });

  it('redondea la comision al centimo, sin decimales', () => {
    // 5% de 999 = 49,95 -> 50
    expect(calcularReparto(999, 0, CINCO).commissionCents).toBe(50);
  });

  it('aplica la comision que se le pasa, no una fija', () => {
    expect(calcularReparto(10_000, 0, 1000).commissionCents).toBe(1000);
    expect(calcularReparto(10_000, 0, 500).commissionCents).toBe(500);
    expect(calcularReparto(10_000, 0, 0).commissionCents).toBe(0);
  });

  it('una comision del 0% deja al GM todo salvo la pasarela', () => {
    const r = calcularReparto(1500, 47, 0);

    expect(r.commissionCents).toBe(0);
    expect(r.payoutCents).toBe(1453);
  });

  it('redondea al centimo con cualquier porcentaje', () => {
    // 10% de 1505 = 150,5 -> 151; 12,5% de 1500 = 187,5 -> 188
    expect(calcularReparto(1505, 0, 1000).commissionCents).toBe(151);
    expect(calcularReparto(1500, 0, 1250).commissionCents).toBe(188);
  });

  it('todo suma el importe con cualquier comision', () => {
    for (const bps of [0, 500, 1000, 1250]) {
      for (const importe of [100, 999, 1505, 3333]) {
        const r = calcularReparto(importe, 47, bps);

        expect(r.commissionCents + r.stripeFeeCents + r.payoutCents).toBe(importe);
      }
    }
  });

  it('rechaza comisiones imposibles', () => {
    expect(() => calcularReparto(1500, 47, -1)).toThrow();
    expect(() => calcularReparto(1500, 47, 10_001)).toThrow();
    expect(() => calcularReparto(1500, 47, 12.5)).toThrow();
  });

  it('nunca devuelve un pago negativo al GM', () => {
    // Un asiento de 0,50 EUR no cubre el coste fijo de Stripe. Transferir un
    // negativo seria rechazado por Stripe; se deja en cero.
    const r = calcularReparto(50, 47, CINCO);

    expect(r.payoutCents).toBeGreaterThanOrEqual(0);
  });

  it('una partida gratuita no genera comision ni pago', () => {
    const r = calcularReparto(0, 0, CINCO);

    expect(r.commissionCents).toBe(0);
    expect(r.payoutCents).toBe(0);
  });

  it('rechaza importes no enteros, que serian centimos fraccionados', () => {
    expect(() => calcularReparto(15.5, 47, CINCO)).toThrow();
  });

  it('rechaza importes negativos', () => {
    expect(() => calcularReparto(-100, 47, CINCO)).toThrow();
  });

  it('rechaza un coste de Stripe negativo', () => {
    expect(() => calcularReparto(1500, -1, CINCO)).toThrow();
  });
});

describe('comisionAplicable', () => {
  it('la comision general es del 10%', () => {
    expect(COMISION_ESTANDAR).toBe(1000);
    expect(comisionAplicable('ESTANDAR', 'PLATAFORMA')).toBe(1000);
  });

  it('un fundador paga el 5% por los jugadores que le trae la web', () => {
    expect(COMISION_FUNDADOR).toBe(500);
    expect(comisionAplicable('FUNDADOR', 'PLATAFORMA')).toBe(500);
  });

  it('un fundador no paga comision por los jugadores de su enlace', () => {
    expect(COMISION_FUNDADOR_ENLACE).toBe(0);
    expect(comisionAplicable('FUNDADOR', 'ENLACE_GM')).toBe(0);
  });

  it('quien deja de ser fundador paga lo general, tambien por los suyos', () => {
    // Un GM estandar no tiene enlace; si una reserva llegara marcada asi, no
    // por eso le toca una ventaja que ya no tiene.
    expect(comisionAplicable('ESTANDAR', 'ENLACE_GM')).toBe(COMISION_ESTANDAR);
  });
});

describe('porcentaje', () => {
  it('escribe los puntos basicos como se leen', () => {
    expect(porcentaje(1000)).toBe('10');
    expect(porcentaje(500)).toBe('5');
    expect(porcentaje(1250)).toBe('12,5');
    expect(porcentaje(0)).toBe('0');
  });
});

describe('repartoInsuficiente', () => {
  it('detecta un precio que no cubre sus propios costes', () => {
    expect(repartoInsuficiente(calcularReparto(50, 47, CINCO))).toBe(true);
  });

  it('un precio normal no se marca', () => {
    expect(repartoInsuficiente(calcularReparto(1500, 47, CINCO))).toBe(false);
  });

  it('una partida gratuita no se considera insuficiente', () => {
    // No hay nada que repartir, pero tampoco es un error de precio.
    expect(repartoInsuficiente(calcularReparto(0, 0, CINCO))).toBe(false);
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
