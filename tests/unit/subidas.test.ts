import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { LIMITE_DE_CUERPO_BYTES, TAMANO_MAXIMO_BYTES } from '@/lib/subidas';

describe('limites de subida', () => {
  it('Next deja pasar mas que lo que la web admite, con margen para el multipart', () => {
    // Next recomienda 10-20 KB de margen para los campos y separadores.
    expect(LIMITE_DE_CUERPO_BYTES).toBeGreaterThanOrEqual(
      TAMANO_MAXIMO_BYTES + 20 * 1024,
    );
  });

  it('cabe en lo que admite Vercel por peticion (4,5 MB)', () => {
    expect(LIMITE_DE_CUERPO_BYTES).toBeLessThan(4.5 * 1024 * 1024);
  });

  /**
   * Por defecto Next rechaza con un 500 sin explicacion cualquier Server Action
   * de mas de 1 MB, y las imagenes pueden pesar 2. Si alguien quita este
   * ajuste, subir una foto de 1,5 MB deja de funcionar y no avisa.
   */
  it('next.config.ts sube el limite de las Server Actions', () => {
    const config = readFileSync('next.config.ts', 'utf8');

    expect(config).toMatch(
      /serverActions:\s*\{\s*bodySizeLimit:\s*LIMITE_DE_CUERPO_BYTES/,
    );
  });
});

describe('carpetas de imágenes', () => {
  /**
   * Cada carpeta donde se sube una imagen tiene que estar permitida en
   * `images.remotePatterns`, o `next/image` contesta 400 y la imagen no sale.
   * Paso con `mesas/` el 20/11/2026: las laminas se subian bien y no se veian.
   */
  it('todas las carpetas donde se sube algo están permitidas en next.config.ts', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    const permitidas = [...config.matchAll(/pathname: '\/([a-z-]+)\/\*\*'/g)].map(
      (m) => m[1],
    );

    const fuentes = [
      'src/modules/blog/service.ts',
      'src/modules/convocatorias/service.ts',
      'src/modules/games/service.ts',
      'src/modules/profiles/avatar.ts',
    ].map((f) => readFileSync(f, 'utf8'));

    const usadas = fuentes.flatMap((codigo) =>
      [...codigo.matchAll(/subirImagen\(`([a-z-]+)\//g)].map((m) => m[1]),
    );

    expect(usadas.length).toBeGreaterThanOrEqual(4);
    for (const carpeta of usadas) expect(permitidas).toContain(carpeta);
  });
});
