import { describe, expect, it } from 'vitest';

import {
  desdeHoraPeninsular,
  fechaYHora,
  mismaHoraDentroDe,
  NOMBRE_DE_LA_ZONA,
  paraCampoDeFecha,
  soloFecha,
} from '@/lib/hora';

describe('desdeHoraPeninsular', () => {
  it('en invierno, las 18:00 de Madrid son las 17:00 UTC', () => {
    expect(desdeHoraPeninsular('2026-12-05T18:00')?.toISOString()).toBe(
      '2026-12-05T17:00:00.000Z',
    );
  });

  it('en verano, las 18:00 de Madrid son las 16:00 UTC', () => {
    expect(desdeHoraPeninsular('2026-07-04T18:00')?.toISOString()).toBe(
      '2026-07-04T16:00:00.000Z',
    );
  });

  it('acierta justo alrededor del cambio de hora', () => {
    // Ultimo domingo de marzo de 2026: a las 02:00 pasan a ser las 03:00.
    expect(desdeHoraPeninsular('2026-03-29T01:30')?.toISOString()).toBe(
      '2026-03-29T00:30:00.000Z',
    );
    expect(desdeHoraPeninsular('2026-03-29T03:30')?.toISOString()).toBe(
      '2026-03-29T01:30:00.000Z',
    );
    // Ultimo domingo de octubre: a las 03:00 vuelven a ser las 02:00.
    expect(desdeHoraPeninsular('2026-10-25T01:30')?.toISOString()).toBe(
      '2026-10-24T23:30:00.000Z',
    );
    expect(desdeHoraPeninsular('2026-10-25T04:00')?.toISOString()).toBe(
      '2026-10-25T03:00:00.000Z',
    );
  });

  it('no falla con una hora que no existe por el cambio de hora', () => {
    expect(desdeHoraPeninsular('2026-03-29T02:30')).toBeInstanceOf(Date);
  });

  it('respeta una fecha que ya trae zona', () => {
    expect(desdeHoraPeninsular('2026-12-05T18:00:00.000Z')?.toISOString()).toBe(
      '2026-12-05T18:00:00.000Z',
    );
    expect(desdeHoraPeninsular('2026-12-05T18:00+01:00')?.toISOString()).toBe(
      '2026-12-05T17:00:00.000Z',
    );
  });

  it('lo que no es una fecha da null', () => {
    expect(desdeHoraPeninsular('')).toBeNull();
    expect(desdeHoraPeninsular('mañana')).toBeNull();
    expect(desdeHoraPeninsular('2026-12-05')).toBeNull();
  });
});

describe('paraCampoDeFecha', () => {
  it('escribe el instante en hora de Madrid, sea cual sea la zona de la máquina', () => {
    expect(paraCampoDeFecha(new Date('2026-12-05T17:00:00Z'))).toBe('2026-12-05T18:00');
    expect(paraCampoDeFecha(new Date('2026-07-04T16:00:00Z'))).toBe('2026-07-04T18:00');
  });

  it('ida y vuelta: lo que se lee del campo vuelve igual', () => {
    for (const texto of ['2026-12-05T18:00', '2026-07-04T09:30', '2026-03-29T03:00']) {
      const instante = desdeHoraPeninsular(texto);
      expect(instante && paraCampoDeFecha(instante)).toBe(texto);
    }
  });
});

describe('como se ensena', () => {
  const instante = new Date('2026-12-05T17:00:00Z');

  it('la hora lleva siempre la zona escrita', () => {
    for (const formato of ['normal', 'corta', 'larga'] as const) {
      const texto = fechaYHora(instante, formato);
      expect(texto).toContain('18:00');
      expect(texto).toContain(`(${NOMBRE_DE_LA_ZONA})`);
    }
  });

  it('la fecha sola usa el calendario de Madrid, no el de UTC', () => {
    // 23:30 UTC del dia 31 ya es dia 1 en Madrid.
    expect(soloFecha(new Date('2026-12-31T23:30:00Z'))).toBe('1 de enero de 2027');
  });
});

describe('mismaHoraDentroDe', () => {
  it('propone la misma hora de reloj aunque cambie la hora entre medias', () => {
    // Sabado 24 de octubre de 2026, 18:00 de Madrid (verano). El domingo 25
    // se atrasa la hora; el sabado siguiente tiene que seguir siendo a las 18:00.
    const antes = desdeHoraPeninsular('2026-10-24T18:00');
    const despues = antes && mismaHoraDentroDe(antes, 7);

    expect(despues && paraCampoDeFecha(despues)).toBe('2026-10-31T18:00');
  });

  it('pasa bien de un mes a otro', () => {
    const antes = desdeHoraPeninsular('2026-12-28T20:30');
    expect(antes && paraCampoDeFecha(mismaHoraDentroDe(antes, 7))).toBe(
      '2027-01-04T20:30',
    );
  });
});
