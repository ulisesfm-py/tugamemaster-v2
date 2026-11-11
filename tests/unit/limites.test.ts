import { describe, expect, it } from 'vitest';

import { contrasenasIguales } from '@/modules/bookings/contrasena';
import { REGLAS, mensajeDeEspera, veredicto } from '@/modules/limites/politica';

describe('veredicto', () => {
  it('deja pasar hasta el maximo, ambos incluidos', () => {
    expect(veredicto(1, 5, 100).permitido).toBe(true);
    expect(veredicto(5, 5, 100).permitido).toBe(true);
  });

  it('rechaza el intento siguiente al maximo', () => {
    expect(veredicto(6, 5, 100).permitido).toBe(false);
    expect(veredicto(500, 5, 100).permitido).toBe(false);
  });

  it('redondea la espera hacia arriba y nunca la da negativa', () => {
    expect(veredicto(9, 5, 12.2).reintentarEnSeg).toBe(13);
    expect(veredicto(9, 5, -3).reintentarEnSeg).toBe(0);
  });
});

describe('mensajeDeEspera', () => {
  it('habla en minutos, redondeando hacia arriba', () => {
    expect(mensajeDeEspera(30)).toContain('un minuto');
    expect(mensajeDeEspera(61)).toContain('2 minutos');
    expect(mensajeDeEspera(780)).toContain('13 minutos');
  });

  it('no promete mas de una hora', () => {
    expect(mensajeDeEspera(3600)).toContain('una hora');
  });
});

describe('REGLAS', () => {
  it('cada regla tiene un nombre distinto: si no, compartirian contador', () => {
    const nombres = Object.values(REGLAS).map((r) => r.nombre);
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it('las contrasenas de una partida se adivinan menos de lo que cuesta un fallo', () => {
    // Un jugador no puede probar mas de 5 claves cada 15 minutos.
    expect(REGLAS.privadaUsuario.max).toBeLessThanOrEqual(5);
    // Y entre todos, mas de 60 por hora a una misma partida tampoco.
    expect(REGLAS.privadaPartida.max).toBeLessThanOrEqual(60);
  });
});

describe('contrasenasIguales', () => {
  it('acepta la misma y rechaza cualquier otra', () => {
    expect(contrasenasIguales('jueves2026', 'jueves2026')).toBe(true);
    expect(contrasenasIguales('jueves2027', 'jueves2026')).toBe(false);
    expect(contrasenasIguales('', 'jueves2026')).toBe(false);
  });

  it('distingue mayusculas y no falla con longitudes distintas', () => {
    expect(contrasenasIguales('Jueves2026', 'jueves2026')).toBe(false);
    expect(contrasenasIguales('a', 'una-contrasena-mucho-mas-larga')).toBe(false);
  });
});
