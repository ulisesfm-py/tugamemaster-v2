import { afterEach, describe, expect, it } from 'vitest';

import { dsnNavegador, dsnServidor, OPCIONES_COMUNES } from '@/lib/observabilidad';

/**
 * Estas comprobaciones existen sobre todo como cerrojo.
 *
 * El asistente de Sentry, si alguien lo ejecuta, reescribe la configuracion y
 * deja `sendDefaultPii: true`. Aqui se manejan correos, reservas y pagos: que
 * eso cambie sin querer tiene que romper la suite, no descubrirse mirando
 * eventos en un panel.
 */

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe('opciones de Sentry', () => {
  it('no envia datos personales', () => {
    expect(OPCIONES_COMUNES.sendDefaultPii).toBe(false);
  });

  it('no muestrea rendimiento: la cuota es para los errores', () => {
    expect(OPCIONES_COMUNES.tracesSampleRate).toBe(0);
  });

  it('marca el entorno del que viene el error', () => {
    expect(OPCIONES_COMUNES.environment.length).toBeGreaterThan(0);
  });
});

describe('DSN', () => {
  it('sin variable, no hay DSN y Sentry no se inicializa', () => {
    delete process.env['SENTRY_DSN'];
    delete process.env['NEXT_PUBLIC_SENTRY_DSN'];

    expect(dsnServidor()).toBeUndefined();
    expect(dsnNavegador()).toBeUndefined();
  });

  it('una variable vacia cuenta como ausente', () => {
    // Es el caso real: `.env.example` la trae definida y en blanco.
    process.env['SENTRY_DSN'] = '';
    process.env['NEXT_PUBLIC_SENTRY_DSN'] = '';

    expect(dsnServidor()).toBeUndefined();
    expect(dsnNavegador()).toBeUndefined();
  });

  it('el del servidor y el del navegador son variables distintas', () => {
    process.env['SENTRY_DSN'] = 'http://servidor@localhost/1';
    process.env['NEXT_PUBLIC_SENTRY_DSN'] = 'http://navegador@localhost/2';

    expect(dsnServidor()).toBe('http://servidor@localhost/1');
    expect(dsnNavegador()).toBe('http://navegador@localhost/2');
  });
});
