import { describe, expect, it } from 'vitest';

import {
  numeroSiguiente,
  partidaTerminada,
  tituloBase,
  tituloDeContinuacion,
} from '@/modules/campaigns/politica';

const AHORA = new Date('2026-06-15T12:00:00Z');

function enHoras(h: number): Date {
  return new Date(AHORA.getTime() + h * 3_600_000);
}

describe('partidaTerminada', () => {
  it('una partida cerrada por el cron, si', () => {
    expect(partidaTerminada('COMPLETED', enHoras(-5), AHORA)).toBe(true);
  });

  it('publicada y con la hora de fin pasada, si', () => {
    // El GM anota como acabo al levantarse de la mesa, sin esperar al cron.
    expect(partidaTerminada('PUBLISHED', enHoras(-1), AHORA)).toBe(true);
  });

  it('publicada pero aun sin jugar, no', () => {
    expect(partidaTerminada('PUBLISHED', enHoras(3), AHORA)).toBe(false);
  });

  it('un borrador con fecha pasada no cuenta: nunca se jugo', () => {
    expect(partidaTerminada('DRAFT', enHoras(-100), AHORA)).toBe(false);
  });

  it('una cancelada no cuenta', () => {
    expect(partidaTerminada('CANCELLED', enHoras(-100), AHORA)).toBe(false);
  });
});

describe('tituloBase', () => {
  it('quita el sufijo de sesion', () => {
    expect(tituloBase('La sombra sobre Cadiz - Sesion 1')).toBe('La sombra sobre Cadiz');
  });

  it('acepta la palabra con tilde', () => {
    expect(tituloBase('La sombra sobre Cadiz · Sesión 12')).toBe('La sombra sobre Cadiz');
  });

  it('acepta distintos separadores y mayusculas', () => {
    for (const titulo of [
      'El faro: SESION 3',
      'El faro — sesion 3',
      'El faro | Sesión 3',
      'El faro sesion 3',
    ]) {
      expect(tituloBase(titulo)).toBe('El faro');
    }
  });

  it('deja intacto un titulo sin sufijo', () => {
    expect(tituloBase('El faro de Finisterre')).toBe('El faro de Finisterre');
  });

  it('no se come un numero que forma parte del titulo', () => {
    // "1920" no va precedido de "sesion": es parte del nombre.
    expect(tituloBase('Cthulhu 1920')).toBe('Cthulhu 1920');
  });

  it('nunca devuelve una cadena vacia', () => {
    expect(tituloBase('Sesion 1')).toBe('Sesion 1');
  });
});

describe('tituloDeContinuacion', () => {
  it('numera la siguiente sobre el titulo base', () => {
    expect(tituloDeContinuacion('La sombra sobre Cadiz - Sesion 1', 2)).toBe(
      'La sombra sobre Cadiz - Sesión 2',
    );
  });

  it('no encadena sufijos al continuar una continuacion', () => {
    const segunda = tituloDeContinuacion('El faro de Finisterre', 2);
    expect(tituloDeContinuacion(segunda, 3)).toBe('El faro de Finisterre - Sesión 3');
  });
});

describe('numeroSiguiente', () => {
  it('una partida suelta se convierte en la sesion 1 y su continuacion es la 2', () => {
    expect(numeroSiguiente(null)).toBe(2);
  });

  it('sigue la cuenta de una campana existente', () => {
    expect(numeroSiguiente(4)).toBe(5);
  });
});
