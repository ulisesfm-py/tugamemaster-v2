import { describe, expect, it } from 'vitest';

import {
  DIAS_EN_EL_LISTADO,
  DIAS_MINIMOS_DE_ANTELACION,
  HORAS_PARA_RESERVAR,
  PRERESERVAS_MAXIMAS,
  alcanzaElMinimo,
  describirDias,
  describirFranja,
  enPlazoDePreReservados,
  finDelPlazoParaReservar,
  hayQueAvisarDelMinimo,
  hora,
  minimoValido,
  primeraFechaPosible,
  problemasAlEditar,
  problemasDeLaFranja,
  puedeConvocar,
  puedePreReservar,
  puedeReservarConvocada,
  sigueEnElListado,
} from '@/modules/convocatorias/politica';

const HORA = 3_600_000;
const DIA = 24 * HORA;
const ahora = new Date('2026-11-19T10:00:00Z');

describe('puedePreReservar', () => {
  const base = {
    estado: 'ABIERTA' as const,
    plazas: 6,
    apuntados: 3,
    yaApuntado: false,
    esSuGm: false,
    activasDelJugador: 0,
  };

  it('deja apuntarse a una mesa abierta con sitio', () => {
    expect(puedePreReservar(base)).toEqual({ ok: true });
  });

  it('se puede seguir apuntando gente pasado el minimo, hasta llenar', () => {
    expect(puedePreReservar({ ...base, apuntados: 5 }).ok).toBe(true);
    expect(puedePreReservar({ ...base, apuntados: 6 })).toMatchObject({
      motivo: 'LLENA',
    });
  });

  it('no admite pre-reservas en un borrador, ni ya convocada, ni cerrada', () => {
    for (const estado of ['BORRADOR', 'CONVOCADA', 'CERRADA'] as const) {
      expect(puedePreReservar({ ...base, estado })).toMatchObject({
        motivo: 'NO_ABIERTA',
      });
    }
  });

  it('el GM no se apunta a su propia mesa', () => {
    expect(puedePreReservar({ ...base, esSuGm: true })).toMatchObject({
      motivo: 'ES_TU_MESA',
    });
  });

  it('nadie se apunta dos veces', () => {
    expect(puedePreReservar({ ...base, yaApuntado: true })).toMatchObject({
      motivo: 'YA_APUNTADO',
    });
  });

  it(`como mucho ${PRERESERVAS_MAXIMAS} mesas a la vez`, () => {
    expect(
      puedePreReservar({ ...base, activasDelJugador: PRERESERVAS_MAXIMAS - 1 }).ok,
    ).toBe(true);
    expect(
      puedePreReservar({ ...base, activasDelJugador: PRERESERVAS_MAXIMAS }),
    ).toMatchObject({ motivo: 'DEMASIADAS' });
  });

  it('los mensajes nunca dicen «gratis»: se confundiria con el precio de la partida', () => {
    const casos = [
      { ...base, estado: 'CERRADA' as const },
      { ...base, esSuGm: true },
      { ...base, yaApuntado: true },
      { ...base, apuntados: 6 },
      { ...base, activasDelJugador: PRERESERVAS_MAXIMAS },
    ];

    for (const caso of casos) {
      const resultado = puedePreReservar(caso);
      expect(resultado.ok).toBe(false);
      if (!resultado.ok) expect(resultado.mensaje.toLowerCase()).not.toContain('gratis');
    }
  });
});

describe('el minimo', () => {
  it('tiene que estar entre 1 y las plazas', () => {
    expect(minimoValido(4, 6)).toBe(true);
    expect(minimoValido(6, 6)).toBe(true);
    expect(minimoValido(0, 6)).toBe(false);
    expect(minimoValido(7, 6)).toBe(false);
    expect(minimoValido(2.5, 6)).toBe(false);
  });

  it('se alcanza al llegar, no al pasarlo', () => {
    expect(alcanzaElMinimo(3, 4)).toBe(false);
    expect(alcanzaElMinimo(4, 4)).toBe(true);
  });

  it('se avisa al GM una sola vez', () => {
    const datos = {
      estado: 'ABIERTA' as const,
      apuntados: 4,
      minimo: 4,
      avisadoEn: null,
    };

    expect(hayQueAvisarDelMinimo(datos)).toBe(true);
    expect(hayQueAvisarDelMinimo({ ...datos, avisadoEn: ahora })).toBe(false);
    expect(hayQueAvisarDelMinimo({ ...datos, apuntados: 3 })).toBe(false);
    expect(hayQueAvisarDelMinimo({ ...datos, estado: 'CONVOCADA' })).toBe(false);
  });
});

describe('puedeConvocar', () => {
  const lejos = new Date(ahora.getTime() + (DIAS_MINIMOS_DE_ANTELACION + 1) * DIA);
  const base = {
    estado: 'ABIERTA' as const,
    apuntados: 4,
    minimo: 4,
    fecha: lejos,
    ahora,
  };

  it('se convoca al llegar al minimo, con antelacion suficiente', () => {
    expect(puedeConvocar(base)).toEqual({ ok: true });
  });

  it('no se convoca sin llegar al minimo, y dice cuanto falta', () => {
    const resultado = puedeConvocar({ ...base, apuntados: 2 });
    expect(resultado).toMatchObject({ motivo: 'FALTA_GENTE' });
    if (!resultado.ok) expect(resultado.mensaje).toContain('2 pre-reservas');

    const una = puedeConvocar({ ...base, apuntados: 3 });
    if (!una.ok) expect(una.mensaje).toContain('1 pre-reserva ');
  });

  it(`la fecha tiene que estar al menos a ${DIAS_MINIMOS_DE_ANTELACION} dias`, () => {
    const justo = primeraFechaPosible(ahora);
    const antes = new Date(justo.getTime() - 60_000);

    expect(puedeConvocar({ ...base, fecha: justo }).ok).toBe(true);
    expect(puedeConvocar({ ...base, fecha: antes })).toMatchObject({
      motivo: 'FECHA_PRONTO',
    });
  });

  it('la antelacion deja sitio al plazo para reservar y a 48 h de cancelacion', () => {
    expect(DIAS_MINIMOS_DE_ANTELACION * 24).toBeGreaterThanOrEqual(
      HORAS_PARA_RESERVAR + 48,
    );
  });

  it('una mesa ya convocada o cerrada no se vuelve a convocar', () => {
    expect(puedeConvocar({ ...base, estado: 'CONVOCADA' })).toMatchObject({
      motivo: 'NO_ABIERTA',
    });
    expect(puedeConvocar({ ...base, estado: 'CERRADA' })).toMatchObject({
      motivo: 'NO_ABIERTA',
    });
  });
});

describe('el plazo de los pre-reservados', () => {
  const fin = finDelPlazoParaReservar(ahora);

  it(`dura ${HORAS_PARA_RESERVAR} horas desde que se convoca`, () => {
    expect(fin.getTime() - ahora.getTime()).toBe(HORAS_PARA_RESERVAR * HORA);
  });

  it('dentro del plazo solo reserva quien se pre-reservo', () => {
    const durante = new Date(fin.getTime() - 1);

    expect(enPlazoDePreReservados(fin, durante)).toBe(true);
    expect(
      puedeReservarConvocada({
        priorityUntil: fin,
        tienePreReserva: true,
        ahora: durante,
      }),
    ).toBe(true);
    expect(
      puedeReservarConvocada({
        priorityUntil: fin,
        tienePreReserva: false,
        ahora: durante,
      }),
    ).toBe(false);
  });

  it('acabado el plazo, reserva cualquiera', () => {
    expect(enPlazoDePreReservados(fin, fin)).toBe(false);
    expect(
      puedeReservarConvocada({ priorityUntil: fin, tienePreReserva: false, ahora: fin }),
    ).toBe(true);
  });

  it('una partida normal, sin plazo, la reserva cualquiera', () => {
    expect(
      puedeReservarConvocada({ priorityUntil: null, tienePreReserva: false, ahora }),
    ).toBe(true);
  });
});

describe('problemasAlEditar', () => {
  const base = {
    apuntados: 3,
    precioActual: 1200,
    precioNuevo: 1200,
    plazasActuales: 6,
    plazasNuevas: 6,
    minimoNuevo: 4,
  };

  it('sin cambios, no hay problema', () => {
    expect(problemasAlEditar(base)).toEqual([]);
  });

  it('con gente apuntada, el precio no sube pero puede bajar', () => {
    expect(problemasAlEditar({ ...base, precioNuevo: 1500 })).toHaveLength(1);
    expect(problemasAlEditar({ ...base, precioNuevo: 1000 })).toEqual([]);
  });

  it('con gente apuntada, las plazas no bajan pero pueden subir', () => {
    expect(problemasAlEditar({ ...base, plazasNuevas: 5, minimoNuevo: 4 })).toHaveLength(
      1,
    );
    expect(problemasAlEditar({ ...base, plazasNuevas: 8 })).toEqual([]);
  });

  it('sin nadie apuntado, todo se puede cambiar', () => {
    expect(
      problemasAlEditar({
        ...base,
        apuntados: 0,
        precioNuevo: 3000,
        plazasNuevas: 3,
        minimoNuevo: 2,
      }),
    ).toEqual([]);
  });

  it('el minimo nunca puede superar las plazas', () => {
    expect(problemasAlEditar({ ...base, minimoNuevo: 7 })).toHaveLength(1);
  });
});

describe('sigueEnElListado', () => {
  it(`una mesa abierta sale ${DIAS_EN_EL_LISTADO} dias`, () => {
    const publicada = new Date(ahora.getTime() - (DIAS_EN_EL_LISTADO - 1) * DIA);
    const vieja = new Date(ahora.getTime() - DIAS_EN_EL_LISTADO * DIA);

    expect(sigueEnElListado(publicada, ahora)).toBe(true);
    expect(sigueEnElListado(vieja, ahora)).toBe(false);
  });
});

describe('la franja', () => {
  const valida = { weekdays: [6], startMinute: 600, durationMinutes: 180 };

  it('una franja normal vale', () => {
    expect(problemasDeLaFranja(valida)).toEqual([]);
  });

  it('pide al menos un dia, sin repetir ni salirse de la semana', () => {
    expect(problemasDeLaFranja({ ...valida, weekdays: [] })).toHaveLength(1);
    expect(problemasDeLaFranja({ ...valida, weekdays: [6, 6] })).toHaveLength(1);
    expect(problemasDeLaFranja({ ...valida, weekdays: [0] })).toHaveLength(1);
    expect(problemasDeLaFranja({ ...valida, weekdays: [8] })).toHaveLength(1);
  });

  it('la hora tiene que caer dentro del dia', () => {
    expect(problemasDeLaFranja({ ...valida, startMinute: -1 })).toHaveLength(1);
    expect(problemasDeLaFranja({ ...valida, startMinute: 1440 })).toHaveLength(1);
  });

  it('la duracion, entre 1 y 12 horas', () => {
    expect(problemasDeLaFranja({ ...valida, durationMinutes: 59 })).toHaveLength(1);
    expect(problemasDeLaFranja({ ...valida, durationMinutes: 721 })).toHaveLength(1);
    expect(problemasDeLaFranja({ ...valida, durationMinutes: 60 })).toEqual([]);
  });

  it('escribe la hora con dos cifras y vuelve a empezar pasada la medianoche', () => {
    expect(hora(600)).toBe('10:00');
    expect(hora(75)).toBe('01:15');
    expect(hora(1500)).toBe('01:00');
  });

  it('nombra los dias en orden de la semana, sin importar como lleguen', () => {
    expect(describirDias([6])).toBe('Sábados');
    expect(describirDias([7, 6])).toBe('Sábados y domingos');
    expect(describirDias([5, 1, 3])).toBe('Lunes, miércoles y viernes');
  });

  it('describe la franja entera', () => {
    expect(describirFranja({ ...valida, frequency: 'QUINCENAL' })).toBe(
      'Sábados, de 10:00 a 13:00 · cada dos semanas',
    );
    expect(
      describirFranja({
        weekdays: [5],
        startMinute: 22 * 60,
        durationMinutes: 240,
        frequency: 'UNICA',
      }),
    ).toBe('Viernes, de 22:00 a 02:00 · una sola sesión');
  });
});
