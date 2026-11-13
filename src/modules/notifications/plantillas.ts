import {
  COMISION_FUNDADOR,
  COMISION_FUNDADOR_ENLACE,
  formatearImporte,
  porcentaje,
} from '@/modules/payments/dinero';

/**
 * Plantillas de los correos.
 *
 * Logica pura: reciben datos sueltos, no filas de Prisma, y devuelven el
 * correo montado. Asi se puede comprobar lo que dice cada aviso sin base de
 * datos y sin enviar nada.
 *
 * Cada correo lleva version en texto plano ademas de HTML. No es un adorno:
 * hay clientes que solo muestran el texto, y un correo que llega en blanco es
 * peor que no mandarlo.
 */

export type Plantilla = { asunto: string; texto: string; html: string };

/**
 * Escapa el texto que se mete en el HTML.
 *
 * Los titulos de partida, los nombres y las notas los escribe gente, y un
 * `<` suelto en un titulo descuadraria el correo entero.
 */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Fecha larga en espanol, en la zona horaria de la plataforma. */
export function fechaLarga(fecha: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Madrid',
  }).format(fecha);
}

type Maqueta = {
  titulo: string;
  parrafos: string[];
  /** Lista de datos en formato "etiqueta: valor". */
  datos?: [string, string][];
  boton?: { texto: string; url: string };
  pie?: string;
};

/**
 * Monta el correo.
 *
 * Estilos en linea y una sola columna: los clientes de correo no entienden
 * hojas de estilo, y la mitad reescribe el HTML a su gusto.
 */
function maquetar({ titulo, parrafos, datos, boton, pie }: Maqueta): {
  texto: string;
  html: string;
} {
  const lineasTexto = [
    titulo,
    '',
    ...parrafos,
    ...(datos && datos.length > 0
      ? ['', ...datos.map(([etiqueta, valor]) => `${etiqueta}: ${valor}`)]
      : []),
    ...(boton ? ['', `${boton.texto}: ${boton.url}`] : []),
    ...(pie ? ['', pie] : []),
    '',
    'TuGameMaster',
  ];

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0f172a;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">${escapar(titulo)}</h1>
      ${parrafos
        .map(
          (p) =>
            `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">${escapar(p)}</p>`,
        )
        .join('\n      ')}
      ${
        datos && datos.length > 0
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;font-size:14px;">
        ${datos
          .map(
            ([etiqueta, valor]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#64748b;">${escapar(etiqueta)}</td><td style="padding:4px 0;color:#0f172a;font-weight:600;">${escapar(valor)}</td></tr>`,
          )
          .join('\n        ')}
      </table>`
          : ''
      }
      ${
        boton
          ? `<p style="margin:24px 0 0;">
        <a href="${escapar(boton.url)}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;font-weight:600;">${escapar(boton.texto)}</a>
      </p>`
          : ''
      }
      ${
        pie
          ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">${escapar(pie)}</p>`
          : ''
      }
      <p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">TuGameMaster</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { texto: lineasTexto.join('\n'), html };
}

/** Al jugador, cuando su plaza queda pagada. */
export function reservaConfirmada(datos: {
  jugador: string;
  partida: string;
  gm: string;
  inicio: Date;
  precioCents: number;
  saldoAplicadoCents: number;
  currency: string;
  url: string;
  condiciones: string;
}): Plantilla {
  const conTarjeta = datos.precioCents - datos.saldoAplicadoCents;

  const detalle: [string, string][] = [
    ['Partida', datos.partida],
    ['Game master', datos.gm],
    ['Cuándo', fechaLarga(datos.inicio)],
    ['Precio', formatearImporte(datos.precioCents, datos.currency)],
  ];

  if (datos.saldoAplicadoCents > 0) {
    detalle.push([
      'Pagado con saldo',
      formatearImporte(datos.saldoAplicadoCents, datos.currency),
    ]);

    // Solo si algo llego a pasar por la tarjeta: un "0,00 €" en el recibo de
    // quien lo pago todo con saldo no informa de nada.
    if (conTarjeta > 0) {
      detalle.push(['Pagado con tarjeta', formatearImporte(conTarjeta, datos.currency)]);
    }
  }

  return {
    asunto: `Tu plaza en ${datos.partida} está confirmada`,
    ...maquetar({
      titulo: 'Tu plaza está confirmada',
      parrafos: [
        `Hola ${datos.jugador}, ya tienes sitio en la mesa.`,
        'Guarda este correo: es tu comprobante.',
      ],
      datos: detalle,
      boton: { texto: 'Ver la partida', url: datos.url },
      pie: datos.condiciones,
    }),
  };
}

/** Al game master, cuando alguien reserva en su partida. */
export function nuevaReserva(datos: {
  gm: string;
  jugador: string;
  partida: string;
  inicio: Date;
  plazasOcupadas: number;
  plazasTotales: number;
  url: string;
}): Plantilla {
  const libres = datos.plazasTotales - datos.plazasOcupadas;

  return {
    asunto: `${datos.jugador} se ha apuntado a ${datos.partida}`,
    ...maquetar({
      titulo: 'Tienes un jugador nuevo',
      parrafos: [
        `Hola ${datos.gm}, ${datos.jugador} ha reservado plaza en tu partida.`,
        libres === 0
          ? 'Con esta se llena la mesa.'
          : `Quedan ${libres} ${libres === 1 ? 'plaza libre' : 'plazas libres'}.`,
      ],
      datos: [
        ['Partida', datos.partida],
        ['Cuándo', fechaLarga(datos.inicio)],
        ['Plazas', `${datos.plazasOcupadas} de ${datos.plazasTotales}`],
      ],
      boton: { texto: 'Ver quién viene', url: datos.url },
    }),
  };
}

/** A los jugadores, cuando el game master cancela la partida. */
export function partidaCancelada(datos: {
  jugador: string;
  partida: string;
  inicio: Date;
  devueltoCents: number;
  currency: string;
  url: string;
}): Plantilla {
  const hubo = datos.devueltoCents > 0;

  return {
    asunto: `Se ha cancelado ${datos.partida}`,
    ...maquetar({
      titulo: 'El game master ha cancelado la partida',
      parrafos: [
        `Hola ${datos.jugador}, sentimos darte esta noticia: la partida no se va a jugar.`,
        hubo
          ? `Te hemos devuelto el 100% del precio (${formatearImporte(datos.devueltoCents, datos.currency)}) como saldo en tu cuenta. No caduca y se aplica solo en tu siguiente reserva.`
          : 'No se te ha cobrado nada, así que no hay nada que devolverte.',
      ],
      datos: [
        ['Partida', datos.partida],
        ['Iba a jugarse', fechaLarga(datos.inicio)],
      ],
      boton: { texto: 'Buscar otra mesa', url: datos.url },
      pie: hubo
        ? 'Si prefieres que te lo devolvamos a la tarjeta en vez de como saldo, escríbenos y lo hacemos.'
        : undefined,
    }),
  };
}

/** Al jugador, cuando un administrador resuelve su incidencia. */
export function incidenciaResuelta(datos: {
  jugador: string;
  partida: string;
  aprobada: boolean;
  devueltoCents: number;
  currency: string;
  nota: string | null;
  url: string;
}): Plantilla {
  return {
    asunto: datos.aprobada
      ? `Hemos aprobado tu incidencia en ${datos.partida}`
      : `Sobre tu incidencia en ${datos.partida}`,
    ...maquetar({
      titulo: datos.aprobada
        ? 'Te devolvemos lo que pagaste'
        : 'Hemos revisado tu incidencia',
      parrafos: [
        `Hola ${datos.jugador}, una persona de nuestro equipo ha revisado lo que nos contaste sobre ${datos.partida}.`,
        datos.aprobada
          ? `Te hemos abonado ${formatearImporte(datos.devueltoCents, datos.currency)} como saldo en tu cuenta. No caduca y se aplica solo en tu siguiente reserva.`
          : 'Esta vez no hemos considerado que proceda una devolución.',
        ...(datos.nota ? [`Lo que nos dice quien lo ha revisado: ${datos.nota}`] : []),
      ],
      boton: {
        texto: datos.aprobada ? 'Ver tu saldo' : 'Ver tus reservas',
        url: datos.url,
      },
      pie: datos.aprobada
        ? 'Si prefieres recuperarlo en la tarjeta en vez de como saldo, escríbenos.'
        : 'Si crees que nos hemos equivocado, respóndenos y lo miramos otra vez.',
    }),
  };
}

/** Al game master, cuando se le transfiere lo que ha ganado. */
export function pagoEnviado(datos: {
  gm: string;
  partida: string;
  importeCents: number;
  currency: string;
  url: string;
}): Plantilla {
  return {
    asunto: `Te hemos enviado ${formatearImporte(datos.importeCents, datos.currency)} por ${datos.partida}`,
    ...maquetar({
      titulo: 'Tu dinero va de camino',
      parrafos: [
        `Hola ${datos.gm}, ya hemos transferido lo que te corresponde por ${datos.partida}.`,
        'Stripe lo abonará en tu cuenta bancaria según los plazos de tu país, normalmente en un par de días hábiles.',
      ],
      datos: [
        ['Partida', datos.partida],
        ['Transferido', formatearImporte(datos.importeCents, datos.currency)],
      ],
      boton: { texto: 'Ver tus cobros', url: datos.url },
      pie: 'El importe es el precio de las plazas menos la comisión de TuGameMaster y el coste real de la pasarela de pago. El desglose de cada plaza está en tus cobros.',
    }),
  };
}

/**
 * Al jugador, la vispera de la partida.
 *
 * `conDevolucion` no se deduce aqui: lo decide la politica de cancelacion en
 * el momento del envio. El recordatorio sale entre 24 y 48 horas antes segun
 * cuando corra el cron, asi que unas veces el plazo sigue abierto y otras no,
 * y prometer lo que no es seria peor que no decir nada.
 */
export function recordatorioPartida(datos: {
  jugador: string;
  partida: string;
  gm: string;
  inicio: Date;
  conDevolucion: boolean;
  url: string;
}): Plantilla {
  return {
    asunto: `Recordatorio: ${datos.partida}`,
    ...maquetar({
      titulo: 'Tu partida está al caer',
      parrafos: [
        `Hola ${datos.jugador}, te escribimos para recordarte que tienes mesa con ${datos.gm}.`,
        datos.conDevolucion
          ? 'Si al final no puedes venir, avisa cuanto antes: mientras falten más de 48 horas, liberar la plaza te devuelve el 90% en saldo.'
          : 'Si no puedes venir, libera la plaza para que pueda ocuparla otra persona. A estas alturas ya no hay devolución, pero el game master y el resto de la mesa lo agradecerán.',
      ],
      datos: [
        ['Partida', datos.partida],
        ['Cuándo', fechaLarga(datos.inicio)],
        ['Game master', datos.gm],
      ],
      boton: { texto: 'Ver la partida', url: datos.url },
    }),
  };
}

/**
 * Al game master, cuando un administrador le nombra fundador.
 *
 * Es el unico aviso de este nombramiento: ni el boton del administrador ni la
 * web le dicen nada a quien lo recibe. Lleva lo que necesita para empezar —sus
 * condiciones, su codigo y su enlace— y avisa de que sin el alta de cobros no
 * puede publicar, porque lo mas probable es que todavia no la tenga.
 *
 * Los porcentajes salen de `payments/dinero.ts`, donde se aplican.
 */
export function fundadorNombrado(datos: {
  gm: string;
  codigo: string;
  enlace: string;
  caducaEl: Date;
  cobrosListos: boolean;
  urlPanel: string;
  urlCondiciones: string;
}): Plantilla {
  const caduca = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'long',
    timeZone: 'Europe/Madrid',
  }).format(datos.caducaEl);

  return {
    asunto: 'Ya eres game master fundador de TuGameMaster',
    ...maquetar({
      titulo: 'Ya eres game master fundador',
      parrafos: [
        `Hola ${datos.gm}, te hemos nombrado game master fundador. Tus condiciones son permanentes: pagas un ${porcentaje(COMISION_FUNDADOR)}% de comisión por los jugadores que llegan por la web y un ${porcentaje(COMISION_FUNDADOR_ENLACE)}% por los que se registran con tu código. El coste de la pasarela de pago se descuenta siempre del cobro.`,
        `Para que tus jugadores de siempre cuenten con el ${porcentaje(COMISION_FUNDADOR_ENLACE)}%, tienen que crear su cuenta con tu enlace o con tu código. Una cuenta que ya existe no se puede emparejar después.`,
        ...(datos.cobrosListos
          ? []
          : [
              'Para publicar partidas, antes tienes que dar de alta tus cobros en Stripe desde tu panel.',
            ]),
      ],
      datos: [
        ['Tu código', datos.codigo],
        ['Tu enlace', datos.enlace],
        ['Admite registros hasta', caduca],
      ],
      boton: { texto: 'Ver mi código', url: datos.urlPanel },
      pie: `Las condiciones completas están en ${datos.urlCondiciones}.`,
    }),
  };
}

/** Al jugador, cuando ya ha jugado y aun no ha valorado. */
export function pideResena(datos: {
  jugador: string;
  partida: string;
  gm: string;
  diasDePlazo: number;
  url: string;
}): Plantilla {
  return {
    asunto: `¿Qué tal estuvo ${datos.partida}?`,
    ...maquetar({
      titulo: '¿Cómo fue la partida?',
      parrafos: [
        `Hola ${datos.jugador}, esperamos que disfrutaras de la mesa de ${datos.gm}.`,
        'Tu valoración es lo único que distingue a un buen game master de uno que dice serlo: solo puede valorar quien reservó, pagó y jugó aquí.',
        `Te llevará menos de un minuto, y tienes ${datos.diasDePlazo} días para hacerlo.`,
      ],
      boton: { texto: 'Valorar la partida', url: datos.url },
      pie: 'Si algo fue mal de verdad, no lo cuentes aquí: abre una incidencia desde Mis reservas y lo revisa una persona.',
    }),
  };
}
