import 'server-only';

import { db } from '@/lib/db';
import {
  ESTADOS_PAGADOS,
  filtroPlazaOcupada,
  MINUTOS_DE_GRACIA,
} from '@/modules/bookings/service';
import { estadoDelCodigo } from '@/modules/invitaciones/politica';

import { contarPorDia, haceDias } from './politica';

/**
 * Los numeros del panel `/admin/metricas`, todos leidos de la base de datos.
 *
 * No hay tabla de metricas ni contadores aparte: cada cifra se calcula en el
 * momento a partir de lo que ya se guarda, asi que no puede desviarse de la
 * realidad. A este volumen (cientos de filas) es barato; si algun dia deja de
 * serlo, se mide antes de cachear nada.
 *
 * **Incluye las cuentas y reservas de prueba**: la base no las distingue y no
 * se va a inventar un campo para ello. Mientras la web sea nueva, hay que leer
 * las cifras sabiendo cuantas son tuyas.
 */

const DIAS_DEL_PERIODO = 7;
const DIAS_DE_LA_GRAFICA = 14;

/** Cuantos game masters han llegado a cada paso del camino hasta cobrar. */
async function embudoDeGms() {
  const [perfiles, cobrosActivados, conPartida, conReservaPagada] = await Promise.all([
    db.gmProfile.count(),
    db.gmProfile.count({ where: { payoutsEnabled: true } }),
    db.gmProfile.count({
      where: { games: { some: { status: { in: ['PUBLISHED', 'COMPLETED'] } } } },
    }),
    db.gmProfile.count({
      where: {
        games: { some: { bookings: { some: { status: { in: ESTADOS_PAGADOS } } } } },
      },
    }),
  ]);

  return { perfiles, cobrosActivados, conPartida, conReservaPagada };
}

async function fundadores(ahora: Date) {
  const filas = await db.gmProfile.findMany({
    where: { plan: 'FUNDADOR' },
    orderBy: { createdAt: 'asc' },
    select: {
      inviteCode: true,
      inviteCodeExpiresAt: true,
      payoutsEnabled: true,
      user: { select: { name: true, slug: true } },
      _count: { select: { invitados: true, games: true } },
    },
  });

  return filas.map((fila) => ({
    nombre: fila.user.name,
    slug: fila.user.slug,
    cobrosActivados: fila.payoutsEnabled,
    partidas: fila._count.games,
    invitados: fila._count.invitados,
    codigo: estadoDelCodigo(
      { plan: 'FUNDADOR', inviteCodeExpiresAt: fila.inviteCodeExpiresAt },
      ahora,
    ),
  }));
}

async function usuarios(ahora: Date) {
  const desde = haceDias(ahora, DIAS_DEL_PERIODO);
  const desdeAnterior = haceDias(ahora, DIAS_DEL_PERIODO * 2);

  const [total, nuevos, nuevosAnteriores, conCodigo, conDiscord, recientes, pagadores] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: desde } } }),
      db.user.count({ where: { createdAt: { gte: desdeAnterior, lt: desde } } }),
      db.user.count({ where: { referredByGmId: { not: null } } }),
      db.account.count({ where: { provider: 'discord' } }),
      db.user.findMany({
        where: { createdAt: { gte: haceDias(ahora, DIAS_DE_LA_GRAFICA + 1) } },
        select: { createdAt: true },
      }),
      db.booking.groupBy({ by: ['userId'], where: { status: { in: ESTADOS_PAGADOS } } }),
    ]);

  return {
    total,
    nuevos,
    nuevosAnteriores,
    conCodigo,
    conDiscord,
    jugadoresConReservaPagada: pagadores.length,
    porDia: contarPorDia(
      recientes.map((u) => u.createdAt),
      ahora,
      DIAS_DE_LA_GRAFICA,
    ),
  };
}

async function partidas(ahora: Date) {
  const futuras = { status: 'PUBLISHED' as const, startsAt: { gte: ahora } };

  const [publicadas, privadas, jugadas, plazas, plazasOcupadas] = await Promise.all([
    db.game.count({ where: futuras }),
    db.game.count({ where: { ...futuras, visibility: 'PRIVADA' } }),
    db.game.count({ where: { status: 'COMPLETED' } }),
    db.game.aggregate({ where: futuras, _sum: { seatsTotal: true } }),
    db.booking.count({ where: { game: futuras, ...filtroPlazaOcupada() } }),
  ]);

  return {
    publicadas,
    privadas,
    jugadas,
    plazasTotales: plazas._sum.seatsTotal ?? 0,
    plazasOcupadas,
  };
}

/**
 * Las reservas de pago. Las gratuitas se cuentan aparte: recorren el mismo
 * codigo pero no dicen nada de si alguien paga.
 */
async function reservas(ahora: Date) {
  const limiteDeGracia = new Date(ahora.getTime() - MINUTOS_DE_GRACIA * 60_000);
  const deDePago = { amountCents: { gt: 0 } };

  const [iniciadas, pagadasAlgunaVez, abandonadas, fallidas, devueltas, gratuitas] =
    await Promise.all([
      // Las que alguien ha empezado a pagar, sin las que estan pagandose ahora.
      db.booking.count({
        where: {
          ...deDePago,
          NOT: { status: 'PENDING', createdAt: { gte: limiteDeGracia } },
        },
      }),
      db.booking.count({ where: { ...deDePago, paidAt: { not: null } } }),
      db.booking.count({
        where: { ...deDePago, status: 'PENDING', createdAt: { lt: limiteDeGracia } },
      }),
      db.booking.count({ where: { ...deDePago, status: 'FAILED' } }),
      db.booking.count({
        where: { ...deDePago, status: { in: ['CANCELLED', 'REFUNDED'] } },
      }),
      db.booking.count({
        where: { amountCents: 0, status: { in: ESTADOS_PAGADOS } },
      }),
    ]);

  return { iniciadas, pagadasAlgunaVez, abandonadas, fallidas, devueltas, gratuitas };
}

/** Lo que han movido las reservas de pago que siguen en pie. */
async function dinero() {
  const [ventas, pagos] = await Promise.all([
    db.booking.aggregate({
      where: { status: { in: ESTADOS_PAGADOS }, amountCents: { gt: 0 } },
      _count: true,
      _sum: { amountCents: true, commissionCents: true, stripeFeeCents: true },
    }),
    db.payout.groupBy({ by: ['status'], _sum: { amountCents: true } }),
  ]);

  const importeDePagos = (estados: string[]) =>
    pagos
      .filter((p) => estados.includes(p.status))
      .reduce((suma, p) => suma + (p._sum.amountCents ?? 0), 0);

  return {
    plazasVendidas: ventas._count,
    vendido: ventas._sum.amountCents ?? 0,
    comision: ventas._sum.commissionCents ?? 0,
    costeDeStripe: ventas._sum.stripeFeeCents ?? 0,
    pagadoAGms: importeDePagos(['PAID']),
    pendienteDePagarAGms: importeDePagos(['PENDING', 'BLOCKED', 'FAILED']),
  };
}

async function actividad() {
  const [resenas, incidenciasAbiertas, entradasPublicadas] = await Promise.all([
    db.review.count(),
    db.incident.count({ where: { status: 'OPEN' } }),
    db.post.count({ where: { status: 'PUBLISHED' } }),
  ]);

  return { resenas, incidenciasAbiertas, entradasPublicadas };
}

export async function metricasDeLaWeb(ahora = new Date()) {
  const [
    gms,
    losFundadores,
    losUsuarios,
    lasPartidas,
    lasReservas,
    elDinero,
    laActividad,
  ] = await Promise.all([
    embudoDeGms(),
    fundadores(ahora),
    usuarios(ahora),
    partidas(ahora),
    reservas(ahora),
    dinero(),
    actividad(),
  ]);

  return {
    generadoEl: ahora,
    diasDelPeriodo: DIAS_DEL_PERIODO,
    gms,
    fundadores: losFundadores,
    usuarios: losUsuarios,
    partidas: lasPartidas,
    reservas: lasReservas,
    dinero: elDinero,
    actividad: laActividad,
  };
}

export type MetricasDeLaWeb = Awaited<ReturnType<typeof metricasDeLaWeb>>;
