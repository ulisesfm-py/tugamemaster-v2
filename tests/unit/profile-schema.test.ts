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
    yearsExperience: '9',
    systems: ['Call of Cthulhu 7e'],
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

describe('perfilGmSchema: datos declarados', () => {
  const base = {
    headline: 'Terror investigativo en los anos 20',
    about: '',
    languages: ['es'],
    yearsExperience: '',
    systems: [],
  };

  it('entiende los anos vacios como «no lo dice», no como cero', () => {
    expect(perfilGmSchema.parse(base).yearsExperience).toBeNull();
  });

  it('convierte los anos a numero', () => {
    expect(perfilGmSchema.parse({ ...base, yearsExperience: '9' }).yearsExperience).toBe(
      9,
    );
  });

  it('rechaza unos anos negativos', () => {
    expect(perfilGmSchema.safeParse({ ...base, yearsExperience: '-2' }).success).toBe(
      false,
    );
  });

  it('rechaza una cifra de anos absurda', () => {
    expect(perfilGmSchema.safeParse({ ...base, yearsExperience: '99' }).success).toBe(
      false,
    );
  });

  it('quita sistemas duplicados sin mirar mayusculas', () => {
    const parsed = perfilGmSchema.parse({
      ...base,
      systems: ['Vaesen', 'vaesen', 'D&D 5e'],
    });

    expect(parsed.systems).toEqual(['Vaesen', 'D&D 5e']);
  });

  it('admite un GM que no declara nada', () => {
    expect(perfilGmSchema.safeParse(base).success).toBe(true);
  });
});
