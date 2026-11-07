import { describe, expect, it } from 'vitest';

import { sitioIndexable } from '@/lib/indexacion';

describe('sitioIndexable', () => {
  it('por defecto la web no se indexa: lanzamiento discreto', () => {
    expect(sitioIndexable({ VERCEL_ENV: 'production' })).toBe(false);
  });

  it('se abre a proposito en produccion', () => {
    expect(sitioIndexable({ VERCEL_ENV: 'production', SITIO_INDEXABLE: 'true' })).toBe(
      true,
    );
  });

  it('un despliegue de prueba no se indexa nunca', () => {
    expect(sitioIndexable({ VERCEL_ENV: 'preview', SITIO_INDEXABLE: 'true' })).toBe(
      false,
    );
    expect(sitioIndexable({ SITIO_INDEXABLE: 'true' })).toBe(false);
  });
});
