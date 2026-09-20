import { describe, expect, it } from 'vitest';

import {
  ETIQUETAS,
  IDIOMAS,
  duracionEnHoras,
  etiquetasDe,
  etiquetasPorGrupo,
  idiomasDeLaMesa,
  nombreDeIdioma,
  textoDeDuracion,
  textoDeEdad,
  tipoDeMesa,
} from '@/modules/games/ficha';

const CUANDO = new Date('2026-10-01T18:00:00Z');

function mas(horas: number): Date {
  return new Date(CUANDO.getTime() + horas * 3_600_000);
}

describe('vocabulario', () => {
  it('no tiene identificadores repetidos', () => {
    // Un duplicado romperia el mapa de busqueda sin que nadie se entere.
    const ids = ETIQUETAS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no tiene idiomas repetidos', () => {
    const codigos = IDIOMAS.map((i) => i.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });
});

describe('etiquetas', () => {
  it('las devuelve en el orden del vocabulario, no en el de guardado', () => {
    // Asi dos partidas con las mismas etiquetas se leen igual.
    const ids = etiquetasDe(['terror', 'combate']).map((e) => e.id);
    expect(ids).toEqual(['combate', 'terror']);
  });

  it('ignora una etiqueta que ya no existe en vez de romper', () => {
    expect(etiquetasDe(['combate', 'retirada']).map((e) => e.id)).toEqual(['combate']);
  });

  it('reparte por grupo y omite el grupo vacio', () => {
    const grupos = etiquetasPorGrupo(['terror', 'misterio']);

    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.grupo).toBe('tema');
  });

  it('separa estilo y tema cuando hay de los dos', () => {
    const grupos = etiquetasPorGrupo(['combate', 'terror']);

    expect(grupos.map((g) => g.grupo)).toEqual(['estilo', 'tema']);
  });

  it('sin etiquetas no devuelve ningun grupo', () => {
    expect(etiquetasPorGrupo([])).toEqual([]);
  });
});

describe('idiomas', () => {
  it('traduce el codigo a su nombre', () => {
    expect(nombreDeIdioma('es')).toBe('Español');
  });

  it('un codigo desconocido se ensena tal cual, no desaparece', () => {
    expect(nombreDeIdioma('zz')).toBe('ZZ');
  });

  it('usa los de la partida cuando los hay', () => {
    expect(idiomasDeLaMesa(['en'], ['es', 'en'])).toEqual(['Inglés']);
  });

  it('cae a los del game master en las partidas creadas antes del campo', () => {
    expect(idiomasDeLaMesa([], ['es'])).toEqual(['Español']);
  });
});

describe('duracion', () => {
  it('cuenta las horas entre inicio y fin', () => {
    expect(duracionEnHoras(CUANDO, mas(4))).toBe(4);
  });

  it('redondea a la media hora', () => {
    expect(duracionEnHoras(CUANDO, mas(3.4))).toBe(3.5);
  });

  it('escribe las horas enteras sin decimales', () => {
    expect(textoDeDuracion(CUANDO, mas(3))).toBe('3 h');
  });

  it('escribe la media hora', () => {
    expect(textoDeDuracion(CUANDO, mas(3.5))).toBe('3 h 30 min');
  });

  it('no ensena nada si el fin no es posterior al inicio', () => {
    expect(textoDeDuracion(CUANDO, CUANDO)).toBeNull();
  });
});

describe('edad minima', () => {
  it('la escribe cuando la hay', () => {
    expect(textoDeEdad(16)).toBe('A partir de 16 años');
  });

  it('sin minimo no dice nada', () => {
    expect(textoDeEdad(null)).toBeNull();
  });
});

describe('tipo de mesa', () => {
  it('una partida sin campana ni anterior es suelta', () => {
    expect(tipoDeMesa({}).texto).toBe('Partida suelta');
  });

  it('con campana y numero, lo dice', () => {
    expect(tipoDeMesa({ campaignId: 'c1', sessionNumber: 3 }).texto).toBe(
      'Campaña · sesión 3',
    );
  });

  it('continuar una partida ya la hace de campana, aunque no tenga numero', () => {
    expect(tipoDeMesa({ previousGameId: 'g1' }).texto).toBe('Sesión de campaña');
  });
});
