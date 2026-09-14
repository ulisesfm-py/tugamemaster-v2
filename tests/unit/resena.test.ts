import { describe, expect, it } from 'vitest';

import {
  DIAS_PARA_EDITAR,
  DIAS_PARA_VALORAR,
  puedeEditar,
  puedeValorar,
} from '@/modules/reviews/politica';
import { resenaSchema } from '@/modules/reviews/schema';

const AHORA = new Date('2026-06-15T12:00:00Z');

function enDias(d: number): Date {
  return new Date(AHORA.getTime() + d * 86_400_000);
}

describe('puedeValorar', () => {
  it('una partida jugada y pagada, si', () => {
    expect(puedeValorar({ estado: 'COMPLETED', finPartida: enDias(-1) }, AHORA)).toEqual({
      ok: true,
    });
  });

  it('pagada y ya terminada, aunque el cron no la haya cerrado todavia', () => {
    // El estado COMPLETED lo pone el job diario. Si valorar dependiera de el,
    // quien juega de madrugada tendria que esperar y quien juega de noche no.
    expect(puedeValorar({ estado: 'PAID', finPartida: enDias(-0.5) }, AHORA)).toEqual({
      ok: true,
    });
  });

  it('la partida aun no ha terminado, no', () => {
    expect(puedeValorar({ estado: 'PAID', finPartida: enDias(1) }, AHORA)).toEqual({
      ok: false,
      motivo: 'NO_TERMINADA',
    });
  });

  it('una reserva reembolsada no puntua al game master', () => {
    // Decision de producto: la incidencia ya tiene su cauce y no debe ademas
    // dejar rastro en las estrellas.
    expect(puedeValorar({ estado: 'REFUNDED', finPartida: enDias(-1) }, AHORA)).toEqual({
      ok: false,
      motivo: 'REEMBOLSADA',
    });
  });

  it('una reserva cancelada no valora', () => {
    expect(puedeValorar({ estado: 'CANCELLED', finPartida: enDias(-1) }, AHORA)).toEqual({
      ok: false,
      motivo: 'NO_PAGADA',
    });
  });

  it('una reserva sin cobrar no valora', () => {
    for (const estado of ['PENDING', 'FAILED'] as const) {
      expect(puedeValorar({ estado, finPartida: enDias(-1) }, AHORA)).toEqual({
        ok: false,
        motivo: 'NO_PAGADA',
      });
    }
  });

  it('dentro del plazo de 60 dias, si', () => {
    expect(
      puedeValorar(
        { estado: 'COMPLETED', finPartida: enDias(-DIAS_PARA_VALORAR) },
        AHORA,
      ),
    ).toEqual({ ok: true });
  });

  it('pasado el plazo, no', () => {
    expect(
      puedeValorar(
        { estado: 'COMPLETED', finPartida: enDias(-DIAS_PARA_VALORAR - 1) },
        AHORA,
      ),
    ).toEqual({ ok: false, motivo: 'PLAZO_AGOTADO' });
  });
});

describe('puedeEditar', () => {
  it('recien escrita, si', () => {
    expect(puedeEditar(enDias(-1), AHORA)).toBe(true);
  });

  it('justo en el limite, si', () => {
    expect(puedeEditar(enDias(-DIAS_PARA_EDITAR), AHORA)).toBe(true);
  });

  it('pasado el plazo, se congela', () => {
    expect(puedeEditar(enDias(-DIAS_PARA_EDITAR - 1), AHORA)).toBe(false);
  });
});

describe('resenaSchema', () => {
  it('acepta una puntuacion sin comentario', () => {
    const r = resenaSchema.parse({ rating: '4' });
    expect(r).toEqual({ rating: 4, comment: null });
  });

  it('un comentario en blanco se guarda como null, no como cadena vacia', () => {
    expect(resenaSchema.parse({ rating: '5', comment: '   ' }).comment).toBeNull();
  });

  it('acepta las tres formas de "sin comentario"', () => {
    // `FormData.get` devuelve null cuando el campo no viaja en el envio; desde
    // codigo llega undefined; y el textarea en blanco manda cadena vacia.
    for (const comment of [null, undefined, '']) {
      expect(resenaSchema.parse({ rating: '5', comment }).comment).toBeNull();
    }
  });

  it('recorta los espacios del comentario', () => {
    expect(resenaSchema.parse({ rating: '5', comment: '  genial  ' }).comment).toBe(
      'genial',
    );
  });

  it('rechaza puntuaciones fuera de 1 a 5', () => {
    for (const rating of ['0', '6', '-1']) {
      expect(resenaSchema.safeParse({ rating }).success).toBe(false);
    }
  });

  it('rechaza media estrella: la puntuacion es entera', () => {
    expect(resenaSchema.safeParse({ rating: '4.5' }).success).toBe(false);
  });

  it('rechaza un comentario kilometrico', () => {
    expect(
      resenaSchema.safeParse({ rating: '5', comment: 'a'.repeat(1001) }).success,
    ).toBe(false);
  });

  it('rechaza no puntuar', () => {
    expect(resenaSchema.safeParse({ comment: 'sin estrellas' }).success).toBe(false);
  });
});
