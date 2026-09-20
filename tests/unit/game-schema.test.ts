import { describe, expect, it } from 'vitest';

import { ETIQUETAS, MAXIMO_ETIQUETAS } from '@/modules/games/ficha';
import { filtrosSchema, partidaSchema } from '@/modules/games/schema';

/** Una fecha suficientemente lejana para pasar la antelacion minima. */
function dentroDeDias(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

const base = {
  title: 'El faro de Finisterre',
  description:
    'Un one-shot de terror costero para una tarde, con investigacion y niebla.',
  system: 'Vaesen',
  startsAt: dentroDeDias(7),
  durationHours: '3',
  seatsTotal: '5',
  priceCents: '20',
  languages: ['es'],
  experience: 'ABIERTA',
  tags: ['terror', 'investigacion'],
  minAge: '',
};

describe('partidaSchema: precio', () => {
  it('convierte euros a centimos enteros', () => {
    expect(partidaSchema.parse(base).priceCents).toBe(2000);
  });

  it('acepta la coma decimal, que es lo natural en espanol', () => {
    expect(partidaSchema.parse({ ...base, priceCents: '12,50' }).priceCents).toBe(1250);
  });

  it('acepta tambien el punto decimal', () => {
    expect(partidaSchema.parse({ ...base, priceCents: '12.50' }).priceCents).toBe(1250);
  });

  it('redondea a centimos en vez de guardar fracciones', () => {
    // 12.345 € no existe: guardarlo entero evita descuadres al sumar.
    expect(partidaSchema.parse({ ...base, priceCents: '12.345' }).priceCents).toBe(1235);
  });

  it('admite una partida gratuita', () => {
    expect(partidaSchema.parse({ ...base, priceCents: '0' }).priceCents).toBe(0);
  });

  it('rechaza precios negativos', () => {
    expect(partidaSchema.safeParse({ ...base, priceCents: '-5' }).success).toBe(false);
  });

  it('rechaza un precio absurdo, que casi siempre es un cero de mas', () => {
    expect(partidaSchema.safeParse({ ...base, priceCents: '99999' }).success).toBe(false);
  });

  it('rechaza un precio que no es un numero', () => {
    expect(partidaSchema.safeParse({ ...base, priceCents: 'gratis' }).success).toBe(
      false,
    );
  });
});

describe('partidaSchema: fecha', () => {
  it('rechaza una fecha ya pasada', () => {
    expect(partidaSchema.safeParse({ ...base, startsAt: dentroDeDias(-1) }).success).toBe(
      false,
    );
  });

  it('rechaza una partida que empieza dentro de unos minutos', () => {
    const enUnaHora = new Date(Date.now() + 3_600_000).toISOString();

    expect(partidaSchema.safeParse({ ...base, startsAt: enUnaHora }).success).toBe(false);
  });

  it('acepta una fecha con antelacion suficiente', () => {
    expect(partidaSchema.safeParse({ ...base, startsAt: dentroDeDias(1) }).success).toBe(
      true,
    );
  });
});

describe('partidaSchema: plazas', () => {
  it('rechaza cero plazas', () => {
    expect(partidaSchema.safeParse({ ...base, seatsTotal: '0' }).success).toBe(false);
  });

  it('rechaza un numero de plazas decimal', () => {
    expect(partidaSchema.safeParse({ ...base, seatsTotal: '4.5' }).success).toBe(false);
  });

  it('rechaza una mesa desmesurada', () => {
    expect(partidaSchema.safeParse({ ...base, seatsTotal: '50' }).success).toBe(false);
  });
});

describe('partidaSchema: textos', () => {
  it('exige una descripcion con contenido', () => {
    expect(partidaSchema.safeParse({ ...base, description: 'Corta' }).success).toBe(
      false,
    );
  });

  it('recorta los espacios del titulo', () => {
    expect(partidaSchema.parse({ ...base, title: '  El faro  ' }).title).toBe('El faro');
  });
});

describe('filtrosSchema', () => {
  it('acepta que no haya ningun filtro', () => {
    expect(filtrosSchema.parse({}).q).toBeUndefined();
  });

  it('convierte el precio maximo a numero', () => {
    expect(filtrosSchema.parse({ maxPrecio: '25' }).maxPrecio).toBe(25);
  });

  it('rechaza un precio maximo negativo', () => {
    expect(filtrosSchema.safeParse({ maxPrecio: '-3' }).success).toBe(false);
  });
});

describe('partidaSchema: ficha tecnica', () => {
  it('exige al menos un idioma de mesa', () => {
    expect(partidaSchema.safeParse({ ...base, languages: [] }).success).toBe(false);
  });

  it('rechaza un idioma que no esta en el vocabulario', () => {
    // Llega de un formulario: cualquiera puede mandar lo que quiera.
    expect(partidaSchema.safeParse({ ...base, languages: ['klingon'] }).success).toBe(
      false,
    );
  });

  it('rechaza una etiqueta inventada', () => {
    expect(partidaSchema.safeParse({ ...base, tags: ['terror', 'zombis'] }).success).toBe(
      false,
    );
  });

  it('rechaza la misma etiqueta dos veces', () => {
    expect(partidaSchema.safeParse({ ...base, tags: ['terror', 'terror'] }).success).toBe(
      false,
    );
  });

  it('rechaza mas etiquetas de las que caben', () => {
    const muchas = ETIQUETAS.slice(0, MAXIMO_ETIQUETAS + 1).map((e) => e.id);

    expect(partidaSchema.safeParse({ ...base, tags: muchas }).success).toBe(false);
  });

  it('admite una partida sin etiquetas', () => {
    expect(partidaSchema.safeParse({ ...base, tags: [] }).success).toBe(true);
  });

  it('rechaza un nivel de experiencia que no existe', () => {
    expect(partidaSchema.safeParse({ ...base, experience: 'EXPERTO' }).success).toBe(
      false,
    );
  });
});

describe('partidaSchema: edad minima', () => {
  it('entiende el campo vacio como «sin minimo», no como cero', () => {
    expect(partidaSchema.parse({ ...base, minAge: '' }).minAge).toBeNull();
  });

  it('convierte la edad a numero', () => {
    expect(partidaSchema.parse({ ...base, minAge: '16' }).minAge).toBe(16);
  });

  it('rechaza una edad que no dice nada', () => {
    expect(partidaSchema.safeParse({ ...base, minAge: '3' }).success).toBe(false);
  });

  it('rechaza una edad absurda', () => {
    expect(partidaSchema.safeParse({ ...base, minAge: '120' }).success).toBe(false);
  });
});
