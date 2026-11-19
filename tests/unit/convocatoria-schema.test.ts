import { describe, expect, it } from 'vitest';

import {
  continuableDesdeLaLista,
  DIAS_PARA_CONTINUAR_DESDE_LA_LISTA,
} from '@/modules/campaigns/politica';
import { convocatoriaSchema, datosDeConvocatoria } from '@/modules/convocatorias/schema';

const base = {
  title: 'Noches de Madrid',
  description: 'Una crónica de Vampiro para gente nueva, con intriga y poco combate.',
  system: 'Vampiro',
  languages: ['es'],
  experience: 'ABIERTA',
  tags: [],
  minAge: '',
  seatsTotal: '6',
  minPlayers: '4',
  priceCents: '12',
  weekdays: ['6'],
  startMinute: '10:00',
  durationMinutes: '3',
  frequency: 'QUINCENAL',
};

describe('convocatoriaSchema', () => {
  it('acepta una mesa normal y guarda la franja en minutos enteros', () => {
    const d = convocatoriaSchema.parse(base);

    expect(d.startMinute).toBe(600);
    expect(d.durationMinutes).toBe(180);
    expect(d.weekdays).toEqual([6]);
    expect(d.priceCents).toBe(1200);
  });

  it('admite medias horas de duración', () => {
    expect(
      convocatoriaSchema.parse({ ...base, durationMinutes: '2.5' }).durationMinutes,
    ).toBe(150);
  });

  it('el mínimo no puede pasar de las plazas ni ser cero', () => {
    expect(convocatoriaSchema.safeParse({ ...base, minPlayers: '7' }).success).toBe(
      false,
    );
    expect(convocatoriaSchema.safeParse({ ...base, minPlayers: '0' }).success).toBe(
      false,
    );
    expect(convocatoriaSchema.safeParse({ ...base, minPlayers: '6' }).success).toBe(true);
  });

  it('pide al menos un día y no admite días de fuera de la semana', () => {
    expect(convocatoriaSchema.safeParse({ ...base, weekdays: [] }).success).toBe(false);
    expect(convocatoriaSchema.safeParse({ ...base, weekdays: ['8'] }).success).toBe(
      false,
    );
    expect(convocatoriaSchema.safeParse({ ...base, weekdays: ['6', '6'] }).success).toBe(
      false,
    );
  });

  it('la hora tiene que ser una hora de verdad', () => {
    for (const mala of ['', '25:00', '10:60', '10']) {
      expect(convocatoriaSchema.safeParse({ ...base, startMinute: mala }).success).toBe(
        false,
      );
    }
  });

  it('la duración, entre 1 y 12 horas', () => {
    expect(
      convocatoriaSchema.safeParse({ ...base, durationMinutes: '0.5' }).success,
    ).toBe(false);
    expect(convocatoriaSchema.safeParse({ ...base, durationMinutes: '13' }).success).toBe(
      false,
    );
  });

  it('solo admite las frecuencias que existen', () => {
    expect(convocatoriaSchema.safeParse({ ...base, frequency: 'MENSUAL' }).success).toBe(
      false,
    );
  });

  it('valida la ficha igual que una partida', () => {
    expect(convocatoriaSchema.safeParse({ ...base, title: 'Uy' }).success).toBe(false);
    expect(convocatoriaSchema.safeParse({ ...base, languages: [] }).success).toBe(false);
  });
});

describe('datosDeConvocatoria', () => {
  it('lee lo que manda el formulario con los nombres que usa el formulario', () => {
    const f = new FormData();
    f.set('title', 'Noches de Madrid');
    f.set('price', '12');
    f.set('startTime', '10:00');
    f.set('durationHours', '3');
    f.append('weekdays', '5');
    f.append('weekdays', '6');

    const datos = datosDeConvocatoria(f);

    expect(datos.priceCents).toBe('12');
    expect(datos.startMinute).toBe('10:00');
    expect(datos.durationMinutes).toBe('3');
    expect(datos.weekdays).toEqual(['5', '6']);
  });
});

describe('continuableDesdeLaLista', () => {
  const ahora = new Date('2026-11-19T10:00:00Z');
  const haceDias = (n: number) => new Date(ahora.getTime() - n * 86_400_000);

  it('sale una sesión jugada hace poco y sin continuación', () => {
    expect(
      continuableDesdeLaLista(
        { status: 'COMPLETED', endsAt: haceDias(3), tieneContinuacion: false },
        ahora,
      ),
    ).toBe(true);
  });

  it(`no sale pasados ${DIAS_PARA_CONTINUAR_DESDE_LA_LISTA} días`, () => {
    expect(
      continuableDesdeLaLista(
        {
          status: 'COMPLETED',
          endsAt: haceDias(DIAS_PARA_CONTINUAR_DESDE_LA_LISTA),
          tieneContinuacion: false,
        },
        ahora,
      ),
    ).toBe(false);
  });

  it('no sale si ya tiene continuación', () => {
    expect(
      continuableDesdeLaLista(
        { status: 'COMPLETED', endsAt: haceDias(3), tieneContinuacion: true },
        ahora,
      ),
    ).toBe(false);
  });

  it('no sale una cancelada, ni un borrador, ni una que aún no ha terminado', () => {
    expect(
      continuableDesdeLaLista(
        { status: 'CANCELLED', endsAt: haceDias(3), tieneContinuacion: false },
        ahora,
      ),
    ).toBe(false);
    expect(
      continuableDesdeLaLista(
        { status: 'DRAFT', endsAt: haceDias(3), tieneContinuacion: false },
        ahora,
      ),
    ).toBe(false);
    expect(
      continuableDesdeLaLista(
        { status: 'PUBLISHED', endsAt: haceDias(-1), tieneContinuacion: false },
        ahora,
      ),
    ).toBe(false);
  });
});
