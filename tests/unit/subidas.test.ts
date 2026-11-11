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
