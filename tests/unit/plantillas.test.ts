import { describe, expect, it } from 'vitest';

import {
  fundadorNombrado,
  incidenciaResuelta,
  nuevaReserva,
  pagoEnviado,
  partidaCancelada,
  pideResena,
  recordatorioPartida,
  reservaConfirmada,
} from '@/modules/notifications/plantillas';

const INICIO = new Date('2026-07-04T18:00:00Z');

const FUNDADOR = {
  gm: 'Laura Vega',
  codigo: 'K7M2-QX9A',
  enlace: 'https://tugamemaster.com/r/K7M2QX9A',
  caducaEl: new Date('2027-02-13T12:00:00Z'),
  cobrosListos: true,
  urlPanel: 'https://tugamemaster.com/dashboard',
  urlCondiciones: 'https://tugamemaster.com/fundadores',
};

const RESERVA = {
  jugador: 'Ana Soto',
  partida: 'El faro de Finisterre',
  gm: 'Laura Vega',
  inicio: INICIO,
  precioCents: 1500,
  saldoAplicadoCents: 0,
  currency: 'EUR',
  url: 'https://tugamemaster.com/partidas/el-faro',
  condiciones: 'Cancelación gratuita hasta 48 horas antes.',
};

describe('todas las plantillas', () => {
  const todas = [
    reservaConfirmada(RESERVA),
    nuevaReserva({
      gm: 'Laura Vega',
      jugador: 'Ana Soto',
      partida: 'El faro de Finisterre',
      inicio: INICIO,
      plazasOcupadas: 2,
      plazasTotales: 4,
      url: 'https://tugamemaster.com/cuenta/partidas/1',
    }),
    partidaCancelada({
      jugador: 'Ana Soto',
      partida: 'El faro de Finisterre',
      inicio: INICIO,
      devueltoCents: 1500,
      currency: 'EUR',
      url: 'https://tugamemaster.com/partidas',
    }),
    incidenciaResuelta({
      jugador: 'Ana Soto',
      partida: 'El faro de Finisterre',
      aprobada: true,
      devueltoCents: 1500,
      currency: 'EUR',
      nota: null,
      url: 'https://tugamemaster.com/cuenta/saldo',
    }),
    pagoEnviado({
      gm: 'Laura Vega',
      partida: 'El faro de Finisterre',
      importeCents: 1368,
      currency: 'EUR',
      url: 'https://tugamemaster.com/cuenta/cobros',
    }),
    recordatorioPartida({
      jugador: 'Ana Soto',
      partida: 'El faro de Finisterre',
      gm: 'Laura Vega',
      inicio: INICIO,
      conDevolucion: false,
      url: 'https://tugamemaster.com/partidas/el-faro',
    }),
    pideResena({
      jugador: 'Ana Soto',
      partida: 'El faro de Finisterre',
      gm: 'Laura Vega',
      diasDePlazo: 60,
      url: 'https://tugamemaster.com/mis-reservas',
    }),
    fundadorNombrado(FUNDADOR),
  ];

  it('traen asunto, texto y html', () => {
    for (const plantilla of todas) {
      expect(plantilla.asunto.length).toBeGreaterThan(0);
      expect(plantilla.texto.length).toBeGreaterThan(0);
      expect(plantilla.html).toContain('<html');
    }
  });

  it('el asunto cabe en la bandeja de entrada', () => {
    // Mas de 78 caracteres y los clientes lo cortan con puntos suspensivos.
    for (const plantilla of todas) {
      expect(plantilla.asunto.length).toBeLessThanOrEqual(78);
    }
  });

  it('la version en texto no lleva etiquetas HTML', () => {
    for (const plantilla of todas) {
      expect(plantilla.texto).not.toMatch(/<[a-z]/i);
    }
  });

  it('firman como TuGameMaster', () => {
    for (const plantilla of todas) {
      expect(plantilla.texto).toContain('TuGameMaster');
    }
  });
});

describe('reservaConfirmada', () => {
  it('lleva la partida, el game master y el precio', () => {
    const correo = reservaConfirmada(RESERVA);

    expect(correo.asunto).toContain('El faro de Finisterre');
    expect(correo.texto).toContain('Laura Vega');
    expect(correo.texto).toContain('15,00');
  });

  it('detalla el reparto cuando se ha usado saldo', () => {
    const correo = reservaConfirmada({ ...RESERVA, saldoAplicadoCents: 500 });

    expect(correo.texto).toContain('Pagado con saldo');
    expect(correo.texto).toContain('5,00');
    // Lo que fue a la tarjeta: 15,00 - 5,00.
    expect(correo.texto).toContain('10,00');
  });

  it('no habla de saldo cuando no se ha usado', () => {
    expect(reservaConfirmada(RESERVA).texto).not.toContain('Pagado con saldo');
  });

  it('si el saldo lo cubrio todo, no aparece una linea de tarjeta a cero', () => {
    const correo = reservaConfirmada({ ...RESERVA, saldoAplicadoCents: 1500 });

    expect(correo.texto).toContain('Pagado con saldo');
    expect(correo.texto).not.toContain('Pagado con tarjeta');
  });

  it('anuncia las condiciones de cancelacion', () => {
    expect(reservaConfirmada(RESERVA).texto).toContain('48 horas');
  });
});

describe('nuevaReserva', () => {
  it('avisa de las plazas que quedan', () => {
    const correo = nuevaReserva({
      gm: 'Laura Vega',
      jugador: 'Ana Soto',
      partida: 'El faro',
      inicio: INICIO,
      plazasOcupadas: 2,
      plazasTotales: 4,
      url: 'https://x/1',
    });

    expect(correo.texto).toContain('Quedan 2 plazas libres');
  });

  it('dice que la mesa se llena con la ultima plaza', () => {
    const correo = nuevaReserva({
      gm: 'Laura Vega',
      jugador: 'Ana Soto',
      partida: 'El faro',
      inicio: INICIO,
      plazasOcupadas: 4,
      plazasTotales: 4,
      url: 'https://x/1',
    });

    expect(correo.texto).toContain('se llena la mesa');
  });
});

describe('partidaCancelada', () => {
  const base = {
    jugador: 'Ana Soto',
    partida: 'El faro',
    inicio: INICIO,
    currency: 'EUR',
    url: 'https://x',
  };

  it('dice cuanto se ha devuelto', () => {
    const correo = partidaCancelada({ ...base, devueltoCents: 1500 });

    expect(correo.texto).toContain('100%');
    expect(correo.texto).toContain('15,00');
  });

  it('sin cobro previo no promete ninguna devolucion', () => {
    const correo = partidaCancelada({ ...base, devueltoCents: 0 });

    expect(correo.texto).toContain('No se te ha cobrado nada');
    expect(correo.texto).not.toContain('100%');
  });
});

describe('incidenciaResuelta', () => {
  const base = {
    jugador: 'Ana Soto',
    partida: 'El faro',
    currency: 'EUR',
    url: 'https://x',
  };

  it('aprobada: dice el importe abonado', () => {
    const correo = incidenciaResuelta({
      ...base,
      aprobada: true,
      devueltoCents: 1500,
      nota: null,
    });

    expect(correo.texto).toContain('15,00');
  });

  it('desestimada: lo dice sin hablar de importes', () => {
    const correo = incidenciaResuelta({
      ...base,
      aprobada: false,
      devueltoCents: 0,
      nota: 'El game master aporto capturas de la sesion.',
    });

    expect(correo.texto).toContain('no hemos considerado que proceda');
    expect(correo.texto).toContain('El game master aporto capturas');
  });
});

describe('escapado del HTML', () => {
  it('un titulo con caracteres de HTML no rompe el correo', () => {
    const correo = reservaConfirmada({
      ...RESERVA,
      partida: '<script>alert(1)</script> & "comillas"',
    });

    expect(correo.html).not.toContain('<script>');
    expect(correo.html).toContain('&lt;script&gt;');
    expect(correo.html).toContain('&amp;');
  });

  it('el texto plano se queda tal cual, que ahi no hay nada que escapar', () => {
    const correo = reservaConfirmada({ ...RESERVA, partida: 'Tormenta & fuego' });

    expect(correo.texto).toContain('Tormenta & fuego');
  });
});

describe('recordatorioPartida', () => {
  const base = {
    jugador: 'Ana Soto',
    partida: 'El faro de Finisterre',
    gm: 'Laura Vega',
    inicio: INICIO,
    url: 'https://tugamemaster.com/partidas/el-faro',
  };

  it('dice cuando es y quien dirige', () => {
    const correo = recordatorioPartida({ ...base, conDevolucion: false });

    expect(correo.asunto).toContain('El faro de Finisterre');
    expect(correo.texto).toContain('Laura Vega');
  });

  it('con el plazo abierto, ofrece cancelar con devolucion', () => {
    const correo = recordatorioPartida({ ...base, conDevolucion: true });

    expect(correo.texto).toContain('90%');
    expect(correo.texto).not.toContain('ya no hay devolución');
  });

  it('con el plazo cerrado, no promete una devolucion que no toca', () => {
    const correo = recordatorioPartida({ ...base, conDevolucion: false });

    expect(correo.texto).toContain('ya no hay devolución');
    expect(correo.texto).not.toContain('90%');
  });

  it('pide igualmente que libere la plaza aunque no cobre nada', () => {
    const correo = recordatorioPartida({ ...base, conDevolucion: false });

    expect(correo.texto).toContain('libera la plaza');
  });
});

describe('fundadorNombrado', () => {
  it('lleva el codigo, el enlace y hasta cuando admite registros', () => {
    const correo = fundadorNombrado(FUNDADOR);

    expect(correo.texto).toContain('K7M2-QX9A');
    expect(correo.texto).toContain('https://tugamemaster.com/r/K7M2QX9A');
    expect(correo.texto).toContain('13 de febrero de 2027');
  });

  it('dice las condiciones con los porcentajes que aplica la web', () => {
    const correo = fundadorNombrado(FUNDADOR);

    expect(correo.texto).toContain('5%');
    expect(correo.texto).toContain('0%');
    expect(correo.texto).toContain('permanentes');
  });

  it('avisa de que una cuenta que ya existe no se empareja', () => {
    expect(fundadorNombrado(FUNDADOR).texto).toContain('no se puede emparejar');
  });

  it('sin cobros verificados, recuerda que hace falta el alta para publicar', () => {
    const sin = fundadorNombrado({ ...FUNDADOR, cobrosListos: false });
    const con = fundadorNombrado(FUNDADOR);

    expect(sin.texto).toContain('dar de alta tus cobros');
    expect(con.texto).not.toContain('dar de alta tus cobros');
  });

  it('un nombre con caracteres de HTML no rompe el correo', () => {
    const correo = fundadorNombrado({ ...FUNDADOR, gm: '<b>Laura</b> & Co' });

    expect(correo.html).not.toContain('<b>Laura</b>');
    expect(correo.html).toContain('&lt;b&gt;Laura&lt;/b&gt;');
  });
});

describe('pideResena', () => {
  const correo = pideResena({
    jugador: 'Ana Soto',
    partida: 'El faro de Finisterre',
    gm: 'Laura Vega',
    diasDePlazo: 60,
    url: 'https://tugamemaster.com/mis-reservas',
  });

  it('pregunta por la partida concreta', () => {
    expect(correo.asunto).toContain('El faro de Finisterre');
    expect(correo.texto).toContain('Laura Vega');
  });

  it('dice el plazo que queda', () => {
    expect(correo.texto).toContain('60 días');
  });

  it('manda las quejas serias a la via de las incidencias, no a la resena', () => {
    expect(correo.texto).toContain('incidencia');
  });
});
