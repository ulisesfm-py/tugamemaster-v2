import { describe, expect, it } from 'vitest';

import {
  conLaFechaActual,
  fechaBloqueada,
  MENSAJE_FECHA_BLOQUEADA,
} from '@/modules/games/politica';

describe('fechaBloqueada', () => {
  it('sin plazas ocupadas, la fecha se puede cambiar', () => {
    expect(fechaBloqueada(0)).toBe(false);
  });

  it('con una sola plaza ocupada, la fecha ya esta fija', () => {
    expect(fechaBloqueada(1)).toBe(true);
  });

  it('con la mesa llena tambien', () => {
    expect(fechaBloqueada(5)).toBe(true);
  });
});

describe('conLaFechaActual', () => {
  const ACTUAL = new Date('2026-11-16T18:00:00Z');

  it('si el formulario no manda la fecha, pone la que ya tiene la partida', () => {
    const entrada = conLaFechaActual({ title: 'El faro', startsAt: '' }, ACTUAL);

    expect(entrada).toEqual({ title: 'El faro', startsAt: ACTUAL });
  });

  it('tambien cuando el campo ni viene', () => {
    expect(conLaFechaActual({ title: 'El faro' }, ACTUAL)).toEqual({
      title: 'El faro',
      startsAt: ACTUAL,
    });
  });

  it('si mandan la misma fecha, no hay cambio y se acepta', () => {
    const entrada = conLaFechaActual({ startsAt: '2026-11-16T18:00:00Z' }, ACTUAL);

    expect(entrada).toEqual({ startsAt: ACTUAL });
  });

  it('si mandan otra fecha, se rechaza con null en vez de ignorarla', () => {
    expect(conLaFechaActual({ startsAt: '2026-11-17T18:00:00Z' }, ACTUAL)).toBeNull();
  });

  it('conserva el resto de los campos tal como llegan', () => {
    const entrada = conLaFechaActual({ title: 'Otro titulo', seatsTotal: '3' }, ACTUAL);

    expect(entrada).toMatchObject({ title: 'Otro titulo', seatsTotal: '3' });
  });

  it('una entrada que no es un objeto se devuelve tal cual', () => {
    expect(conLaFechaActual(null, ACTUAL)).toBeNull();
    expect(conLaFechaActual('hola', ACTUAL)).toBe('hola');
  });
});

describe('MENSAJE_FECHA_BLOQUEADA', () => {
  it('dice que es la fecha y a quien acudir, sin prometer una salida que cuesta dinero', () => {
    expect(MENSAJE_FECHA_BLOQUEADA).toContain('fecha');
    expect(MENSAJE_FECHA_BLOQUEADA).toContain('escríbenos');
    // Cancelar y crear otra devuelve el 100 % en saldo y la comision de Stripe la
    // absorbe la plataforma: la web no debe recomendarlo como salida normal.
    expect(MENSAJE_FECHA_BLOQUEADA.toLowerCase()).not.toContain('cancela');
  });
});
