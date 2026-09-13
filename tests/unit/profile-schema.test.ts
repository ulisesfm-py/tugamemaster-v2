import { describe, expect, it } from 'vitest';

import {
  listaDesdeTexto,
  perfilGmSchema,
  perfilJugadorSchema,
} from '@/modules/profiles/schema';

describe('listaDesdeTexto', () => {
  it('parte por comas y recorta espacios', () => {
    expect(listaDesdeTexto('D&D 5e,  Vaesen ,Cthulhu')).toEqual([
      'D&D 5e',
      'Vaesen',
      'Cthulhu',
    ]);
  });

  it('descarta los huecos vacios', () => {
    expect(listaDesdeTexto('es,,  , en')).toEqual(['es', 'en']);
  });

  it('devuelve lista vacia si no hay campo', () => {
    expect(listaDesdeTexto(null)).toEqual([]);
  });
});

describe('perfilJugadorSchema', () => {
  const base = { name: 'Ana Soto', bio: '', preferredSystems: [], preferredStyles: [] };

  it('convierte una bio vacia en null', () => {
    // Guardar cadena vacia y null como cosas distintas obliga a comprobar las
    // dos en cada consulta.
    expect(perfilJugadorSchema.parse(base).bio).toBeNull();
  });

  it('elimina etiquetas duplicadas ignorando mayusculas', () => {
    const parsed = perfilJugadorSchema.parse({
      ...base,
      preferredSystems: ['D&D 5e', 'd&d 5e', 'Vaesen'],
    });

    expect(parsed.preferredSystems).toEqual(['D&D 5e', 'Vaesen']);
  });

  it('rechaza mas de 12 sistemas', () => {
    const muchos = Array.from({ length: 13 }, (_, i) => `sistema-${i}`);

    expect(
      perfilJugadorSchema.safeParse({ ...base, preferredSystems: muchos }).success,
    ).toBe(false);
  });

  it('rechaza una bio de mas de 500 caracteres', () => {
    expect(perfilJugadorSchema.safeParse({ ...base, bio: 'a'.repeat(501) }).success).toBe(
      false,
    );
  });
});

describe('perfilGmSchema', () => {
  const base = {
    headline: 'Terror investigativo en los anos 20',
    about: '',
    languages: ['es'],
  };

  it('acepta un perfil correcto', () => {
    expect(perfilGmSchema.safeParse(base).success).toBe(true);
  });

  it('normaliza los idiomas a minusculas y sin duplicados', () => {
    const parsed = perfilGmSchema.parse({ ...base, languages: ['ES', 'es', 'EN'] });

    expect(parsed.languages).toEqual(['es', 'en']);
  });

  it('exige al menos un idioma', () => {
    expect(perfilGmSchema.safeParse({ ...base, languages: [] }).success).toBe(false);
  });

  it('rechaza idiomas que no sean de dos letras', () => {
    expect(perfilGmSchema.safeParse({ ...base, languages: ['espanol'] }).success).toBe(
      false,
    );
  });

  it('exige un titular con sustancia', () => {
    expect(perfilGmSchema.safeParse({ ...base, headline: 'corto' }).success).toBe(false);
  });
});
