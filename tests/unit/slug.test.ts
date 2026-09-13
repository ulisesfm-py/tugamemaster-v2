import { describe, expect, it } from 'vitest';

import { slugDisponible, slugify } from '@/modules/users/slug';

describe('slugify', () => {
  it('pasa a minusculas y separa con guiones', () => {
    expect(slugify('Laura Vega')).toBe('laura-vega');
  });

  it('quita las tildes y la enye, que rompen las URLs', () => {
    expect(slugify('Begoña Núñez')).toBe('begona-nunez');
  });

  it('descarta los simbolos', () => {
    expect(slugify('D&D 5e: ¡La cripta!')).toBe('d-d-5e-la-cripta');
  });

  it('no deja guiones sueltos en los extremos', () => {
    expect(slugify('  ¿Hola?  ')).toBe('hola');
  });

  it('devuelve cadena vacia si no queda nada utilizable', () => {
    expect(slugify('???')).toBe('');
  });

  it('recorta los nombres muy largos', () => {
    expect(slugify('a'.repeat(100))).toHaveLength(48);
  });
});

describe('slugDisponible', () => {
  it('usa el slug base cuando esta libre', async () => {
    const slug = await slugDisponible('Ana Soto', async () => false);
    expect(slug).toBe('ana-soto');
  });

  it('anade un sufijo numerico cuando ya esta ocupado', async () => {
    const ocupados = new Set(['ana-soto', 'ana-soto-2']);

    const slug = await slugDisponible('Ana Soto', async (s) => ocupados.has(s));

    expect(slug).toBe('ana-soto-3');
  });

  it('cae en "usuario" si el nombre no produce ningun slug', async () => {
    const slug = await slugDisponible('???', async () => false);
    expect(slug).toBe('usuario');
  });

  it('no se cuelga cuando todos los candidatos estan ocupados', async () => {
    // Con todo ocupado debe rendirse y devolver algo unico, no iterar sin fin.
    const slug = await slugDisponible('Ana', async () => true);

    expect(slug.startsWith('ana-')).toBe(true);
    expect(slug).not.toBe('ana-999');
  });
});
