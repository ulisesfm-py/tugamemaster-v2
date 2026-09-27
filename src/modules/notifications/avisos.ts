import 'server-only';

import { db } from '@/lib/db';
import { DIAS_PARA_VALORAR } from '@/modules/reviews/politica';
import { hilosConNovedades } from '@/modules/threads/queries';

/**
 * Centro de avisos.
 *
 * **Casi nada de esto se guarda: se calcula.** «Tienes una partida sin
 * valorar» no es algo que ocurrio, es algo que es cierto ahora y deja de serlo
 * al valorar. Derivarlo evita una tabla de notificaciones que mantener y, sobre
 * todo, evita avisos fantasma que piden algo que ya esta hecho.
 *
 * Los pocos avisos que sí son sucesos —una incidencia resuelta— se acotan por
 * ventana de tiempo, que es lo que hace que caduquen solos sin marca ninguna.
 *
 * Esta misma lista alimentara los bloques «te toca hacer» y «necesita tu
 * atencion» de los paneles: una pieza, dos sitios donde se asoma.
 */

/** Cuanto tiempo sigue siendo noticia algo que ya paso. */
const DIAS_DE_NOVEDAD = 7;

export type Aviso = {
  id: string;
  texto: string;
  href: string;
  /** `accion` pide algo del usuario; `aviso` solo informa. */
  tono: 'accion' | 'aviso' | 'alerta';
};

const DIA = 86_400_000;

/** Avisos de alguien como jugador. */
async function avisosDeJugador(userId: string, ahora: Date): Promise<Aviso[]> {
  const desde = new Date(ahora.getTime() - DIAS_DE_NOVEDAD * DIA);
  const limiteResena = new Date(ahora.getTime() - DIAS_PARA_VALORAR * DIA);

  const [porValorar, incidencias] = await Promise.all([
    db.booking.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        review: null,
        game: { endsAt: { lte: ahora, gte: limiteResena } },
      },
      take: 5,
      orderBy: { game: { endsAt: 'desc' } },
      select: { id: true, game: { select: { title: true } } },
    }),

    db.incident.findMany({
      where: {
        reportedById: userId,
        status: { in: ['APPROVED', 'REJECTED'] },
        resolvedAt: { gte: desde },
      },
      take: 5,
      select: {
        id: true,
        status: true,
        booking: { select: { game: { select: { title: true } } } },
      },
    }),
  ]);

  return [
    ...porValorar.map((r) => ({
      id: `valorar:${r.id}`,
      texto: `Valora ${r.game.title}`,
      href: '/mis-reservas',
      tono: 'accion' as const,
    })),

    ...incidencias.map((i) => ({
      id: `incidencia:${i.id}`,
      texto:
        i.status === 'APPROVED'
          ? `Aprobamos tu incidencia en ${i.booking.game.title}`
          : `Revisamos tu incidencia en ${i.booking.game.title}`,
      href: '/mis-reservas',
      tono: 'aviso' as const,
    })),
  ];
}

/**
 * Avisos de alguien como game master.
 *
 * Aqui estan los dos huecos graves que encontro la auditoria: hasta ahora el
 * GM no se enteraba ni de que habia una incidencia en su partida ni de que su
 * pago estaba bloqueado. Se enteraba de que no le habian pagado.
 */
async function avisosDeGm(userId: string, ahora: Date): Promise<Aviso[]> {
  const gm = await db.gmProfile.findUnique({
    where: { userId },
    select: { id: true, payoutsEnabled: true },
  });

  if (!gm) return [];

  const desde = new Date(ahora.getTime() - DIAS_DE_NOVEDAD * DIA);

  const [incidencias, bloqueados, sinNota, apuntados] = await Promise.all([
    db.incident.findMany({
      where: { status: 'OPEN', booking: { game: { gmId: gm.id } } },
      take: 5,
      select: { id: true, booking: { select: { game: { select: { title: true } } } } },
    }),

    db.payout.findMany({
      where: { gmId: gm.id, status: { in: ['BLOCKED', 'FAILED'] } },
      take: 5,
      select: { id: true, game: { select: { title: true } } },
    }),

    db.game.findMany({
      where: {
        gmId: gm.id,
        status: 'COMPLETED',
        sessionNote: null,
        endsAt: { gte: new Date(ahora.getTime() - DIAS_DE_NOVEDAD * DIA) },
      },
      take: 5,
      select: { id: true, title: true },
    }),

    // Quien se ha sentado en sus mesas ultimamente. Es la unica noticia buena
    // de la lista, y la que mas se echaba en falta: un GM se enteraba de que
    // alguien habia reservado por el aforo de la ficha, si se fijaba.
    //
    // Se cuentan las plazas pagadas, no las reservas: una reserva sin cobrar
    // confirmar no es todavia una plaza ocupada, y anunciarla seria prometer
    // un jugador que puede no llegar.
    db.booking.groupBy({
      by: ['gameId'],
      where: {
        status: 'PAID',
        paidAt: { gte: desde },
        game: { gmId: gm.id, startsAt: { gte: ahora } },
      },
      _count: { _all: true },
    }),
  ]);

  const partidasConPlaza =
    apuntados.length > 0
      ? await db.game.findMany({
          where: { id: { in: apuntados.map((a) => a.gameId) } },
          select: { id: true, title: true },
        })
      : [];

  const tituloDe = new Map(partidasConPlaza.map((p) => [p.id, p.title]));

  const avisos: Aviso[] = [];

  if (!gm.payoutsEnabled) {
    avisos.push({
      id: 'cobros',
      texto: 'Configura tu cuenta de cobro para poder publicar',
      href: '/cuenta/cobros',
      tono: 'alerta',
    });
  }

  for (const i of incidencias) {
    avisos.push({
      id: `gm-incidencia:${i.id}`,
      texto: `Hay una incidencia abierta en ${i.booking.game.title}`,
      href: '/cuenta/partidas',
      tono: 'alerta',
    });
  }

  for (const p of bloqueados) {
    avisos.push({
      id: `gm-pago:${p.id}`,
      texto: `Tu pago de ${p.game.title} está retenido`,
      href: '/cuenta/cobros',
      tono: 'alerta',
    });
  }

  for (const a of apuntados) {
    const titulo = tituloDe.get(a.gameId);
    if (!titulo) continue;

    avisos.push({
      id: `gm-apuntado:${a.gameId}`,
      texto:
        a._count._all === 1
          ? `Alguien se ha apuntado a ${titulo}`
          : `${a._count._all} plazas nuevas en ${titulo}`,
      href: `/cuenta/partidas/${a.gameId}`,
      tono: 'aviso',
    });
  }

  for (const g of sinNota) {
    avisos.push({
      id: `gm-nota:${g.id}`,
      texto: `Anota cómo acabó ${g.title}`,
      href: `/cuenta/partidas/${g.id}`,
      tono: 'accion',
    });
  }

  return avisos;
}

/**
 * Mensajes sin leer en los hilos de mesa.
 *
 * No distingue entre jugar y dirigir porque el hilo tampoco: en una mesa se
 * habla, y da igual desde que lado. Es ademas el unico aviso del hilo, que
 * por decision de diseno no manda correos.
 */
async function avisosDeHilos(userId: string, ahora: Date): Promise<Aviso[]> {
  const hilos = await hilosConNovedades(userId, ahora);

  return hilos.map((h) => ({
    id: `hilo:${h.slug}`,
    texto:
      h.mensajes === 1
        ? `Un mensaje nuevo en ${h.title}`
        : `${h.mensajes} mensajes nuevos en ${h.title}`,
    href: `/partidas/${h.slug}/hilo`,
    tono: 'accion' as const,
  }));
}

/**
 * Todo lo que le espera a un usuario, en un solo sitio.
 *
 * Un mismo usuario puede ser jugador y game master: se juntan las dos listas,
 * que es mas util que obligarle a elegir con que sombrero mira.
 */
export async function avisosDe(userId: string, ahora = new Date()): Promise<Aviso[]> {
  const [jugador, gm, hilos] = await Promise.all([
    avisosDeJugador(userId, ahora),
    avisosDeGm(userId, ahora),
    avisosDeHilos(userId, ahora),
  ]);

  // Las alertas primero: son las que cuestan dinero si se ignoran.
  const peso = { alerta: 0, accion: 1, aviso: 2 };

  return [...gm, ...jugador, ...hilos].sort((a, b) => peso[a.tono] - peso[b.tono]);
}
