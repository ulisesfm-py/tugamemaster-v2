import { describe, expect, it } from 'vitest';

import {
  hayDerechoADevolucion,
  HORAS_CANCELACION_CON_DEVOLUCION,
  horasHastaFinDePlazo,
  importeDevolucionCents,
  PORCENTAJE_DEVOLUCION,
  PORCENTAJE_DEVOLUCION_INCIDENCIA,
} from '@/modules/bookings/politica';

const AHORA = new Date('2026-06-15T12:00:00Z');

function enHoras(h: number): Date {
  return new Date(AHORA.getTime() + h * 3_600_000);
}

describe('hayDerechoADevolucion', () => {
  it('con mucha antelacion, si', () => {
    expect(hayDerechoADevolucion(enHoras(72), AHORA)).toBe(true);
  });

  it('justo en el limite de 48h, si', () => {
    // El limite es inclusivo: quien cancela exactamente a 48h esta dentro.
    expect(hayDerechoADevolucion(enHoras(48), AHORA)).toBe(true);
  });

  it('un minuto despues del limite, no', () => {
    expect(hayDerechoADevolucion(enHoras(47.98), AHORA)).toBe(false);
  });

  it('con la partida ya empezada, no', () => {
    expect(hayDerechoADevolucion(enHoras(-1), AHORA)).toBe(false);
  });

  it('el limite es el que dice la constante', () => {
    expect(HORAS_CANCELACION_CON_DEVOLUCION).toBe(48);
  });
});

describe('importeDevolucionCents', () => {
  it('devuelve el 90% de una reserva de 15 EUR', () => {
    expect(importeDevolucionCents(1500, PORCENTAJE_DEVOLUCION)).toBe(1350);
  });

  it('una incidencia devuelve el importe completo', () => {
    expect(importeDevolucionCents(1500, PORCENTAJE_DEVOLUCION_INCIDENCIA)).toBe(1500);
  });

  it('redondea hacia abajo ante un centimo indivisible', () => {
    // 90% de 999 = 899,1 -> 899. El redondeo no puede favorecer
    // sistematicamente al usuario a costa de la plataforma.
    expect(importeDevolucionCents(999, 90)).toBe(899);
  });

  it('nunca devuelve mas de lo pagado', () => {
    for (const precio of [1, 99, 100, 1500, 4999]) {
      expect(importeDevolucionCents(precio, PORCENTAJE_DEVOLUCION)).toBeLessThanOrEqual(
        precio,
      );
    }
  });

  it('una partida gratuita no devuelve nada', () => {
    expect(importeDevolucionCents(0, PORCENTAJE_DEVOLUCION)).toBe(0);
  });

  it('rechaza un porcentaje fuera de rango', () => {
    expect(() => importeDevolucionCents(1500, 150)).toThrow();
    expect(() => importeDevolucionCents(1500, -10)).toThrow();
  });

  it('rechaza un precio con decimales', () => {
    expect(() => importeDevolucionCents(15.5, 90)).toThrow();
  });
});

describe('horasHastaFinDePlazo', () => {
  it('cuenta las horas que faltan para perder el derecho', () => {
    // Partida dentro de 72h: quedan 24h para que se cierre el plazo.
    expect(horasHastaFinDePlazo(enHoras(72), AHORA)).toBeCloseTo(24);
  });

  it('devuelve cero cuando el plazo ya paso', () => {
    expect(horasHastaFinDePlazo(enHoras(10), AHORA)).toBe(0);
  });

  it('nunca devuelve un numero negativo', () => {
    expect(horasHastaFinDePlazo(enHoras(-100), AHORA)).toBe(0);
  });
});
