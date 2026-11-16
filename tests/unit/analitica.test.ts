import { describe, expect, it } from 'vitest';

import { esRutaPrivada, urlParaMedir } from '@/lib/analitica';

describe('esRutaPrivada', () => {
  it.each([
    '/admin',
    '/admin/game-masters',
    '/cuenta',
    '/cuenta/partidas/abc123',
    '/dashboard',
    '/mis-reservas',
    '/login',
    '/registro',
    '/r/ABCD2345',
    '/api/auth/callback/discord',
  ])('%s no se mide', (ruta) => {
    expect(esRutaPrivada(ruta)).toBe(true);
  });

  it.each([
    '/',
    '/fundadores',
    '/para-game-masters',
    '/partidas/el-faro-de-finisterre',
    '/gm/ulises',
    '/blog/dirige-tu-primera-mesa',
  ])('%s si se mide', (ruta) => {
    expect(esRutaPrivada(ruta)).toBe(false);
  });

  it('no confunde una ruta publica que solo empieza igual', () => {
    // `/cuentas-claras` no es `/cuenta`, ni `/registros` es `/registro`.
    expect(esRutaPrivada('/cuentas-claras')).toBe(false);
    expect(esRutaPrivada('/registros')).toBe(false);
    expect(esRutaPrivada('/radar')).toBe(false);
  });
});

describe('urlParaMedir', () => {
  it('una pagina publica pasa tal cual', () => {
    expect(urlParaMedir('https://tugamemaster.com/fundadores')).toBe(
      'https://tugamemaster.com/fundadores',
    );
  });

  it('una zona privada no se mide', () => {
    expect(urlParaMedir('https://tugamemaster.com/cuenta/partidas/abc')).toBeNull();
    expect(urlParaMedir('https://tugamemaster.com/r/ABCD2345')).toBeNull();
  });

  it('conserva los utm y quita todo lo demas', () => {
    const url = urlParaMedir(
      'https://tugamemaster.com/para-game-masters?utm_source=instagram&utm_medium=bio&callbackUrl=%2Fcuenta&token=secreto',
    );

    expect(url).toBe(
      'https://tugamemaster.com/para-game-masters?utm_source=instagram&utm_medium=bio',
    );
    expect(url).not.toContain('secreto');
    expect(url).not.toContain('callbackUrl');
  });

  it('quita el fragmento', () => {
    expect(urlParaMedir('https://tugamemaster.com/blog#comentarios')).toBe(
      'https://tugamemaster.com/blog',
    );
  });

  it('una direccion que no se entiende no se mide', () => {
    expect(urlParaMedir('no es una url')).toBeNull();
  });
});
