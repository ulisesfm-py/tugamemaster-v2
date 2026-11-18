import { describe, expect, it } from 'vitest';

import {
  ALFABETO,
  caducidadDesde,
  estadoDelCodigo,
  formatearCodigo,
  generarCodigo,
  LONGITUD_CODIGO,
  normalizarCodigo,
} from '@/modules/invitaciones/politica';

describe('generarCodigo', () => {
  it('tiene ocho caracteres, todos del alfabeto', () => {
    let n = 0;
    const codigo = generarCodigo((max) => n++ % max);

    expect(codigo).toHaveLength(LONGITUD_CODIGO);
    expect([...codigo].every((c) => ALFABETO.includes(c))).toBe(true);
  });

  it('no usa los caracteres que se confunden al copiarlo', () => {
    for (const confuso of ['0', 'O', '1', 'I', 'L']) {
      expect(ALFABETO).not.toContain(confuso);
    }
  });

  it('sale del azar que se le pasa', () => {
    expect(generarCodigo(() => 0)).toBe('22222222');
    expect(generarCodigo((max) => max - 1)).toBe('ZZZZZZZZ');
  });
});

describe('normalizarCodigo', () => {
  it('acepta lo que se copia de un mensaje: minusculas, guion y espacios', () => {
    expect(normalizarCodigo('k7m2-qx9a')).toBe('K7M2QX9A');
    expect(normalizarCodigo(' K7M2 QX9A ')).toBe('K7M2QX9A');
    expect(normalizarCodigo('K7M2QX9A')).toBe('K7M2QX9A');
  });

  it('rechaza lo que no puede ser un codigo', () => {
    expect(normalizarCodigo('')).toBeNull();
    expect(normalizarCodigo('K7M2QX9')).toBeNull(); // corto
    expect(normalizarCodigo('K7M2QX9AB')).toBeNull(); // largo
  });

  it('no adivina letras confusas: una O no se convierte en 0', () => {
    // Si se corrigiera, dos codigos distintos podrian acabar siendo el mismo.
    expect(normalizarCodigo('K7M2QXOA')).toBeNull();
  });
});

describe('formatearCodigo', () => {
  it('lo ensena en dos bloques de cuatro', () => {
    expect(formatearCodigo('K7M2QX9A')).toBe('K7M2-QX9A');
  });

  it('lo formateado vuelve a normalizarse igual', () => {
    expect(normalizarCodigo(formatearCodigo('K7M2QX9A'))).toBe('K7M2QX9A');
  });
});

describe('caducidadDesde', () => {
  it('da tres meses de validez', () => {
    const desde = new Date('2026-11-06T10:00:00Z');

    expect(caducidadDesde(desde).toISOString()).toBe('2027-02-06T10:00:00.000Z');
  });

  it('no modifica la fecha de partida', () => {
    const desde = new Date('2026-11-06T10:00:00Z');
    caducidadDesde(desde);

    expect(desde.toISOString()).toBe('2026-11-06T10:00:00.000Z');
  });
});

describe('estadoDelCodigo', () => {
  const ahora = new Date('2026-11-06T10:00:00Z');
  const manana = new Date('2026-11-07T10:00:00Z');
  const ayer = new Date('2026-11-05T10:00:00Z');

  it('un codigo con plazo por delante admite registros', () => {
    expect(estadoDelCodigo({ inviteCodeExpiresAt: manana }, ahora)).toBe('VIGENTE');
  });

  it('al caducar deja de admitirlos', () => {
    expect(estadoDelCodigo({ inviteCodeExpiresAt: ayer }, ahora)).toBe('CADUCADO');
    // El instante exacto de la caducidad ya no vale.
    expect(estadoDelCodigo({ inviteCodeExpiresAt: ahora }, ahora)).toBe('CADUCADO');
  });

  it('vale igual sea cual sea el plan del game master', () => {
    // Antes solo los fundadores tenian codigo. Ahora el enlace es de todos.
    const estandar = { plan: 'ESTANDAR' as const, inviteCodeExpiresAt: manana };
    const fundador = { plan: 'FUNDADOR' as const, inviteCodeExpiresAt: manana };

    expect(estadoDelCodigo(estandar, ahora)).toBe('VIGENTE');
    expect(estadoDelCodigo(fundador, ahora)).toBe('VIGENTE');
  });

  it('un codigo sin fecha de caducidad no admite registros', () => {
    expect(estadoDelCodigo({ inviteCodeExpiresAt: null }, ahora)).toBe('CADUCADO');
  });
});
