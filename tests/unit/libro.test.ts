import { describe, expect, it } from 'vitest';

import {
  estadoDelDinero,
  HORAS_DE_RETENCION,
  resumirIngresos,
  sumarLineas,
  type LineaDeReserva,
} from '@/modules/payments/libro';

const AHORA = new Date('2026-09-20T12:00:00Z');
const HORA = 3_600_000;

function haceHoras(n: number): Date {
  return new Date(AHORA.getTime() - n * HORA);
}

function dentroDeHoras(n: number): Date {
  return new Date(AHORA.getTime() + n * HORA);
}

describe('estado del dinero', () => {
  it('una partida que aun no se ha jugado esta por jugarse', () => {
    expect(
      estadoDelDinero({ endsAt: dentroDeHoras(50), status: 'PUBLISHED' }, null, AHORA),
    ).toBe('FUTURA');
  });

  it('recien jugada, esta dentro del plazo de retencion', () => {
    expect(
      estadoDelDinero({ endsAt: haceHoras(3), status: 'COMPLETED' }, null, AHORA),
    ).toBe('EN_ESPERA');
  });

  it('pasado el plazo y sin pago todavia, esta en camino', () => {
    // El cron corre de madrugada: entre que vence el plazo y el cron pasa,
    // pueden faltar horas. El dinero no esta parado, esta esperando al job.
    expect(
      estadoDelDinero(
        { endsAt: haceHoras(HORAS_DE_RETENCION + 1), status: 'COMPLETED' },
        null,
        AHORA,
      ),
    ).toBe('EN_CAMINO');
  });

  it('justo al cumplirse el plazo ya esta en camino', () => {
    expect(
      estadoDelDinero(
        { endsAt: haceHoras(HORAS_DE_RETENCION), status: 'COMPLETED' },
        null,
        AHORA,
      ),
    ).toBe('EN_CAMINO');
  });

  it('un pago pendiente manda sobre el reloj', () => {
    // Si el cron ya creo el Payout, da igual que el plazo pareciera abierto.
    expect(
      estadoDelDinero(
        { endsAt: haceHoras(1), status: 'COMPLETED' },
        { status: 'PENDING' },
        AHORA,
      ),
    ).toBe('EN_CAMINO');
  });

  it('un pago hecho es un pago hecho', () => {
    expect(
      estadoDelDinero(
        { endsAt: haceHoras(100), status: 'COMPLETED' },
        { status: 'PAID' },
        AHORA,
      ),
    ).toBe('PAGADO');
  });

  it('un pago bloqueado se ensena como retenido', () => {
    expect(
      estadoDelDinero(
        { endsAt: haceHoras(100), status: 'COMPLETED' },
        { status: 'BLOCKED' },
        AHORA,
      ),
    ).toBe('RETENIDO');
  });

  it('una transferencia fallida no se disfraza de pagada', () => {
    expect(
      estadoDelDinero(
        { endsAt: haceHoras(100), status: 'COMPLETED' },
        { status: 'FAILED' },
        AHORA,
      ),
    ).toBe('FALLIDO');
  });

  it('una partida cancelada no tiene dinero en camino', () => {
    expect(
      estadoDelDinero({ endsAt: haceHoras(100), status: 'CANCELLED' }, null, AHORA),
    ).toBe('RETENIDO');
  });
});

function linea(neto: number, cuenta = true): LineaDeReserva {
  return {
    brutoCents: 1500,
    comisionCents: 75,
    pasarelaCents: 52,
    netoCents: neto,
    cuenta,
  };
}

describe('suma de lineas', () => {
  it('suma las que cuentan', () => {
    const total = sumarLineas([linea(1373), linea(1373)]);

    expect(total.netoCents).toBe(2746);
    expect(total.brutoCents).toBe(3000);
    expect(total.comisionCents).toBe(150);
  });

  it('una plaza devuelta no suma nada, ni siquiera su bruto', () => {
    // Se ensena en la lista, porque es dinero que estuvo y dejo de estar, pero
    // contarlo inflaria lo que el GM cree que va a cobrar.
    const total = sumarLineas([linea(1373), linea(1373, false)]);

    expect(total.netoCents).toBe(1373);
    expect(total.brutoCents).toBe(1500);
  });

  it('sin lineas, todo a cero', () => {
    expect(sumarLineas([])).toEqual({
      brutoCents: 0,
      comisionCents: 0,
      pasarelaCents: 0,
      netoCents: 0,
      cuenta: true,
    });
  });
});

describe('resumen de ingresos', () => {
  const partidas = [
    { estado: 'PAGADO' as const, total: linea(1000) },
    { estado: 'EN_CAMINO' as const, total: linea(2000) },
    { estado: 'EN_ESPERA' as const, total: linea(500) },
    { estado: 'RETENIDO' as const, total: linea(300) },
    { estado: 'FALLIDO' as const, total: linea(200) },
    { estado: 'FUTURA' as const, total: linea(4000) },
  ];

  const resumen = resumirIngresos(partidas);

  it('lo pagado va a lo pagado', () => {
    expect(resumen.cobradoCents).toBe(1000);
  });

  it('esperar el plazo y estar en camino son el mismo cajon', () => {
    // Para el GM son lo mismo: dinero suyo que todavia no ha llegado.
    expect(resumen.enCaminoCents).toBe(2500);
  });

  it('bloqueado y fallido tambien comparten cajon', () => {
    expect(resumen.retenidoCents).toBe(500);
  });

  it('lo de las mesas sin jugar va aparte', () => {
    expect(resumen.porJugarseCents).toBe(4000);
  });

  it('los cuatro cajones son excluyentes y suman el total', () => {
    const suma =
      resumen.cobradoCents +
      resumen.enCaminoCents +
      resumen.retenidoCents +
      resumen.porJugarseCents;

    expect(suma).toBe(1000 + 2000 + 500 + 300 + 200 + 4000);
  });

  it('el bruto y los descuentos son otra vista, no un quinto cajon', () => {
    expect(resumen.brutoCents).toBe(1500 * 6);
    expect(resumen.comisionCents).toBe(75 * 6);
    expect(resumen.pasarelaCents).toBe(52 * 6);
  });

  it('sin partidas, todo a cero', () => {
    expect(resumirIngresos([]).cobradoCents).toBe(0);
  });
});
