import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/**
 * El ancho maximo de la web (`--container-sitio`) es lo que mide una fila de
 * cuatro tarjetas de partida mas los margenes laterales. Si alguien cambia el
 * ancho de la tarjeta o el hueco entre ellas y no toca el ancho de la web, la
 * cuarta tarjeta vuelve a verse cortada. Esta prueba lo avisa.
 */
const REM = 16;

function rem(texto: string | undefined): number {
  if (!texto) throw new Error('no se ha encontrado el valor');
  return Number.parseFloat(texto);
}

describe('ancho del contenido de la web', () => {
  const css = readFileSync('src/app/globals.css', 'utf8');
  const portada = readFileSync('src/app/(public)/page.tsx', 'utf8');

  const anchoDelSitio = rem(/--container-sitio:\s*([\d.]+)rem/.exec(css)?.[1]);
  const anchoDeTarjeta = rem(/sm:w-\[([\d.]+)rem\]/.exec(portada)?.[1]);
  const hueco = rem(String(Number(/\bgap-(\d+)\b/.exec(portada)?.[1] ?? 4) / 4));

  it('cabe una fila de cuatro tarjetas enteras', () => {
    const cuatroTarjetas = 4 * anchoDeTarjeta + 3 * hueco;
    const margenes = 2 * (16 / REM); // px-4 a cada lado

    expect(anchoDelSitio).toBeGreaterThanOrEqual(cuatroTarjetas + margenes);
  });

  it('no sobra espacio: sin una quinta tarjeta ni huecos raros', () => {
    const cuatroTarjetas = 4 * anchoDeTarjeta + 3 * hueco;
    const margenes = 2 * (16 / REM);

    expect(anchoDelSitio).toBeLessThan(cuatroTarjetas + margenes + anchoDeTarjeta);
  });

  it('toda la web usa el mismo ancho: ningun max-w-6xl suelto', () => {
    const sueltos = [
      'src/app/(public)/page.tsx',
      'src/app/(public)/partidas/page.tsx',
      'src/components/cascaron/cabecera.tsx',
      'src/components/cascaron/pie.tsx',
      'src/components/blog/guias-de-portada.tsx',
    ].filter((f) => readFileSync(f, 'utf8').includes('max-w-6xl'));

    expect(sueltos).toEqual([]);
  });
});
