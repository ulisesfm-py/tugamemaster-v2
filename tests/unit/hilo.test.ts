import { describe, expect, it } from 'vitest';

import {
  accesoAlHilo,
  cierreDelHilo,
  DIAS_DE_VIDA,
  hayMensajesNuevos,
  limpiarMensaje,
  puedeDenunciar,
  puedeRetirar,
} from '@/modules/threads/politica';

const AHORA = new Date('2026-09-25T12:00:00Z');
const DIA = 86_400_000;

function haceDias(n: number): Date {
  return new Date(AHORA.getTime() - n * DIA);
}

function dentroDeDias(n: number): Date {
  return new Date(AHORA.getTime() + n * DIA);
}

describe('quien entra al hilo', () => {
  it('el game master entra aunque no tenga reserva', () => {
    expect(
      accesoAlHilo({ esGm: true, reserva: null }, { finPartida: dentroDeDias(3) }, AHORA),
    ).toEqual({ ok: true, esGm: true });
  });

  it('quien tiene la plaza pagada entra', () => {
    expect(
      accesoAlHilo(
        { esGm: false, reserva: 'PAID' },
        { finPartida: dentroDeDias(3) },
        AHORA,
      ),
    ).toEqual({ ok: true, esGm: false });
  });

  it('quien ya jugo sigue entrando: lo de despues tambien se habla', () => {
    expect(
      accesoAlHilo(
        { esGm: false, reserva: 'COMPLETED' },
        { finPartida: haceDias(2) },
        AHORA,
      ).ok,
    ).toBe(true);
  });

  it('un extrano no entra', () => {
    expect(
      accesoAlHilo(
        { esGm: false, reserva: null },
        { finPartida: dentroDeDias(3) },
        AHORA,
      ),
    ).toEqual({ ok: false, motivo: 'NO_ES_DE_LA_MESA' });
  });

  // Distinguir esto de "no eres de la mesa" importa: el mensaje que se lee es
  // distinto porque la situacion es distinta, y se arregla sola.
  it('con el cobro sin confirmar, todavia no', () => {
    expect(
      accesoAlHilo(
        { esGm: false, reserva: 'PENDING' },
        { finPartida: dentroDeDias(3) },
        AHORA,
      ),
    ).toEqual({ ok: false, motivo: 'PAGO_SIN_CONFIRMAR' });
  });

  it('quien libera su plaza deja de entrar en el acto', () => {
    for (const reserva of ['CANCELLED', 'REFUNDED'] as const) {
      expect(
        accesoAlHilo({ esGm: false, reserva }, { finPartida: dentroDeDias(3) }, AHORA),
      ).toEqual({ ok: false, motivo: 'PLAZA_LIBERADA' });
    }
  });

  it('un cobro fallido no da plaza ni hilo', () => {
    expect(
      accesoAlHilo(
        { esGm: false, reserva: 'FAILED' },
        { finPartida: dentroDeDias(3) },
        AHORA,
      ).ok,
    ).toBe(false);
  });
});

describe('cuando se cierra el hilo', () => {
  it('cierra a los dias acordados desde el fin de la partida', () => {
    expect(cierreDelHilo(new Date('2026-09-01T22:00:00Z')).toISOString()).toBe(
      new Date(
        new Date('2026-09-01T22:00:00Z').getTime() + DIAS_DE_VIDA * DIA,
      ).toISOString(),
    );
  });

  it('el ultimo dia todavia se entra', () => {
    expect(
      accesoAlHilo(
        { esGm: false, reserva: 'COMPLETED' },
        { finPartida: haceDias(DIAS_DE_VIDA) },
        AHORA,
      ).ok,
    ).toBe(true);
  });

  it('pasado el plazo no entra ni el game master', () => {
    expect(
      accesoAlHilo(
        { esGm: true, reserva: null },
        { finPartida: haceDias(DIAS_DE_VIDA + 1) },
        AHORA,
      ),
    ).toEqual({ ok: false, motivo: 'HILO_CERRADO' });
  });
});

describe('retirar y denunciar', () => {
  it('un mensaje lo retira su autor', () => {
    expect(puedeRetirar({ autorId: 'ana' }, { id: 'ana', esAdmin: false })).toBe(true);
  });

  it('y un administrador', () => {
    expect(puedeRetirar({ autorId: 'ana' }, { id: 'admin', esAdmin: true })).toBe(true);
  });

  // El GM no modera su propia mesa: denuncia, como todo el mundo.
  it('nadie mas, ni siquiera el game master de la partida', () => {
    expect(puedeRetirar({ autorId: 'ana' }, { id: 'laura', esAdmin: false })).toBe(false);
  });

  it('se denuncia lo ajeno, no lo propio', () => {
    expect(puedeDenunciar({ autorId: 'ana', denunciado: false }, { id: 'laura' })).toBe(
      true,
    );
    expect(puedeDenunciar({ autorId: 'ana', denunciado: false }, { id: 'ana' })).toBe(
      false,
    );
  });

  it('una denuncia ya puesta no se repite', () => {
    expect(puedeDenunciar({ autorId: 'ana', denunciado: true }, { id: 'laura' })).toBe(
      false,
    );
  });
});

describe('el texto que se guarda', () => {
  it('respeta los saltos de linea del autor', () => {
    expect(limpiarMensaje('Primera\nSegunda')).toBe('Primera\nSegunda');
  });

  it('no deja mas de una linea en blanco seguida', () => {
    expect(limpiarMensaje('Arriba\n\n\n\nAbajo')).toBe('Arriba\n\nAbajo');
  });

  it('quita los espacios de los bordes y del final de cada linea', () => {
    expect(limpiarMensaje('  Hola   \n  que tal  ')).toBe('Hola\n  que tal');
  });

  // Se guarda tal cual a proposito: el cuerpo es texto plano y no se
  // interpreta, asi que no hay nada que escapar aqui.
  it('no toca lo que parece HTML', () => {
    expect(limpiarMensaje('<b>hola</b>')).toBe('<b>hola</b>');
  });
});

describe('mensajes nuevos', () => {
  const ana = { id: 'ana', leidoHasta: null };

  it('un hilo vacio no avisa de nada', () => {
    expect(hayMensajesNuevos(ana, null)).toBe(false);
  });

  it('avisa de lo que aun no se ha leido', () => {
    expect(hayMensajesNuevos(ana, { autorId: 'laura', escritoEn: haceDias(1) })).toBe(
      true,
    );
  });

  it('no avisa de lo que uno mismo escribe', () => {
    expect(hayMensajesNuevos(ana, { autorId: 'ana', escritoEn: haceDias(1) })).toBe(
      false,
    );
  });

  it('deja de avisar en cuanto se lee', () => {
    expect(
      hayMensajesNuevos(
        { id: 'ana', leidoHasta: haceDias(1) },
        { autorId: 'laura', escritoEn: haceDias(2) },
      ),
    ).toBe(false);
  });

  it('y vuelve a avisar con lo que llega despues', () => {
    expect(
      hayMensajesNuevos(
        { id: 'ana', leidoHasta: haceDias(2) },
        { autorId: 'laura', escritoEn: haceDias(1) },
      ),
    ).toBe(true);
  });
});
