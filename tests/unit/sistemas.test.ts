import { describe, expect, it } from 'vitest';

import { agrupaSistemas, slugDeSistema } from '@/modules/games/sistemas';

describe('slug de un sistema', () => {
  it('convierte el nombre en una dirección', () => {
    expect(slugDeSistema('D&D 5e')).toBe('d-d-5e');
  });

  it('quita las tildes, que en una URL estorban', () => {
    expect(slugDeSistema('La Llamada de Cthulhu')).toBe('la-llamada-de-cthulhu');
    expect(slugDeSistema('Cañonazo')).toBe('canonazo');
  });

  it('dos grafías de lo mismo dan el mismo slug', () => {
    // Es justo de lo que se trata: agrupa sin tener que limpiar la base.
    expect(slugDeSistema('D&D 5E')).toBe(slugDeSistema('D&D  5e'));
  });
});

describe('agrupar sistemas', () => {
  it('junta las variantes bajo un solo slug', () => {
    const sistemas = agrupaSistemas([
      { system: 'D&D 5e', partidas: 3 },
      { system: 'D&D 5E', partidas: 1 },
    ]);

    expect(sistemas).toHaveLength(1);
    expect(sistemas[0]?.partidas).toBe(4);
    expect(sistemas[0]?.variantes).toEqual(['D&D 5e', 'D&D 5E']);
  });

  it('se queda con la grafía más usada, no con la primera', () => {
    const sistemas = agrupaSistemas([
      { system: 'vaesen', partidas: 1 },
      { system: 'Vaesen', partidas: 9 },
    ]);

    expect(sistemas[0]?.nombre).toBe('Vaesen');
  });

  it('a igualdad de uso gana la grafía con mayúsculas: es un nombre propio', () => {
    const sistemas = agrupaSistemas([
      { system: 'vaesen', partidas: 2 },
      { system: 'Vaesen', partidas: 2 },
    ]);

    expect(sistemas[0]?.nombre).toBe('Vaesen');
  });

  it('ordena por cuántas partidas tiene cada uno', () => {
    const sistemas = agrupaSistemas([
      { system: 'Vaesen', partidas: 2 },
      { system: 'D&D 5e', partidas: 7 },
      { system: 'Vampiro', partidas: 4 },
    ]);

    expect(sistemas.map((s) => s.nombre)).toEqual(['D&D 5e', 'Vampiro', 'Vaesen']);
  });

  it('descarta un nombre que no deja slug ninguno', () => {
    // Alguien escribe "???" como sistema: no puede tener pagina propia.
    expect(agrupaSistemas([{ system: '???', partidas: 1 }])).toEqual([]);
  });

  it('sin partidas no hay sistemas', () => {
    expect(agrupaSistemas([])).toEqual([]);
  });
});
