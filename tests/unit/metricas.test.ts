import { describe, expect, it } from 'vitest';

import {
  compararConAnterior,
  contarPorDia,
  diaCorto,
  formatearPorcentaje,
  haceDias,
  porcentajeDe,
} from '@/modules/metricas/politica';

describe('porcentajeDe', () => {
  it('redondea al entero', () => {
    expect(porcentajeDe(1, 3)).toBe(33);
    expect(porcentajeDe(2, 3)).toBe(67);
    expect(porcentajeDe(5, 5)).toBe(100);
  });

  it('sin total no hay porcentaje, no un cero', () => {
    expect(porcentajeDe(0, 0)).toBeNull();
    expect(formatearPorcentaje(0, 0)).toBe('—');
  });

  it('un cero de verdad si hay total', () => {
    expect(porcentajeDe(0, 4)).toBe(0);
    expect(formatearPorcentaje(0, 4)).toBe('0 %');
  });

  it('se escribe con espacio, a la española', () => {
    expect(formatearPorcentaje(1, 2)).toBe('50 %');
  });
});

describe('compararConAnterior', () => {
  it('dice si sube, baja o se queda igual, con la diferencia y no un porcentaje', () => {
    expect(compararConAnterior(5, 2)).toBe('+3 respecto al periodo anterior');
    expect(compararConAnterior(1, 4)).toBe('−3 respecto al periodo anterior');
    expect(compararConAnterior(2, 2)).toBe('igual que el periodo anterior');
  });

  it('de nada a algo tambien es una diferencia, no un infinito', () => {
    expect(compararConAnterior(3, 0)).toBe('+3 respecto al periodo anterior');
  });
});

describe('haceDias', () => {
  it('resta dias enteros, sin depender de la zona', () => {
    const ahora = new Date('2026-11-16T10:00:00Z');

    expect(haceDias(ahora, 7).toISOString()).toBe('2026-11-09T10:00:00.000Z');
  });
});

describe('contarPorDia', () => {
  const AHORA = new Date('2026-11-16T12:00:00Z');

  it('devuelve un hueco por dia, del mas antiguo al de hoy, con los vacios a 0', () => {
    const cuentas = contarPorDia([], AHORA, 3);

    expect(cuentas).toEqual([
      { dia: '2026-11-14', cantidad: 0 },
      { dia: '2026-11-15', cantidad: 0 },
      { dia: '2026-11-16', cantidad: 0 },
    ]);
  });

  it('cuenta cada fecha en su dia', () => {
    const cuentas = contarPorDia(
      [
        new Date('2026-11-16T09:00:00Z'),
        new Date('2026-11-16T11:00:00Z'),
        new Date('2026-11-14T20:00:00Z'),
      ],
      AHORA,
      3,
    );

    expect(cuentas.map((c) => c.cantidad)).toEqual([1, 0, 2]);
  });

  it('el dia es el de Madrid, no el de UTC', () => {
    // 23:30 UTC del 15 son las 00:30 del 16 en Madrid (invierno, UTC+1).
    const cuentas = contarPorDia([new Date('2026-11-15T23:30:00Z')], AHORA, 2);

    expect(cuentas).toEqual([
      { dia: '2026-11-15', cantidad: 0 },
      { dia: '2026-11-16', cantidad: 1 },
    ]);
  });

  it('ignora lo que cae fuera de la ventana', () => {
    const cuentas = contarPorDia([new Date('2026-10-01T10:00:00Z')], AHORA, 3);

    expect(cuentas.every((c) => c.cantidad === 0)).toBe(true);
  });

  it('no se salta un dia en el cambio de hora', () => {
    // El 25 de octubre de 2026 Madrid pasa a horario de invierno (dia de 25 h).
    const cuentas = contarPorDia([], new Date('2026-10-26T00:30:00+01:00'), 4);

    expect(cuentas.map((c) => c.dia)).toEqual([
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ]);
  });
});

describe('diaCorto', () => {
  it('da dia/mes', () => {
    expect(diaCorto('2026-11-16')).toBe('16/11');
  });
});
