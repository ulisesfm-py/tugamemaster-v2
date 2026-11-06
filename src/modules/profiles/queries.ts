import 'server-only';

import { db } from '@/lib/db';
import { ESTADOS_PAGADOS } from '@/modules/bookings/service';
import { seleccionTarjeta } from '@/modules/games/queries';

/**
 * Consultas de lectura de los perfiles publicos.
 */

export type ReputacionGm = {
  /** Media de estrellas, o null si aun no tiene resenas. */
  valoracionMedia: number | null;
  totalResenas: number;
  /** Partidas dirigidas y cobradas a traves de la plataforma. */
  partidasDirigidas: number;
};

/**
 * Reputacion de un GM.
 *
 * Se calcula **solo** a partir de reservas pagadas en la plataforma, como
 * exige CLAUDE.md: las resenas cuelgan de una reserva, y las partidas contadas
 * son las completadas que tuvieron al menos un asiento pagado. Un GM no puede
 * inflar estos numeros con partidas dirigidas por fuera.
 */
export async function reputacionGm(gmProfileId: string): Promise<ReputacionGm> {
  const [agregado, partidasDirigidas] = await Promise.all([
    db.review.aggregate({
      where: { gmId: gmProfileId },
      _avg: { rating: true },
      _count: true,
    }),
    db.game.count({
      where: {
        gmId: gmProfileId,
        status: 'COMPLETED',
        bookings: { some: { status: { in: ['PAID', 'COMPLETED'] } } },
      },
    }),
  ]);

  return {
    valoracionMedia:
      agregado._count > 0 && agregado._avg.rating !== null
        ? Math.round(agregado._avg.rating * 10) / 10
        : null,
    totalResenas: agregado._count,
    partidasDirigidas,
  };
}

export type EstadisticasGm = {
  /** Personas distintas que se han sentado a una de sus mesas ya jugada. */
  jugadoresDistintos: number;
  /** Cuantas de ellas han vuelto a otra de sus mesas. */
  repetidores: number;
  /** Partidas que cancelo teniendo gente dentro. */
  partidasCanceladas: number;
};

/**
 * Lo que se puede afirmar de un GM sin creerle nada.
 *
 * Son tres numeros que salen de reservas pagadas, asi que no se pueden inflar:
 *
 * - **Repetidores.** Que alguien vuelva a sentarse con el mismo GM es la senal
 *   mas honesta que hay, y mas dificil de fingir que cualquier distintivo.
 * - **Partidas canceladas.** Es el riesgo real de quien reserva y hasta ahora
 *   no se veia en ninguna parte. Solo cuentan las que tenian a alguien dentro:
 *   retirar un borrador que nadie habia reservado no le hace dano a nadie.
 */
export async function estadisticasGm(gmProfileId: string): Promise<EstadisticasGm> {
  const [porJugador, partidasCanceladas] = await Promise.all([
    db.booking.groupBy({
      by: ['userId'],
      where: {
        // Solo partidas ya jugadas, la misma vara que `partidasDirigidas`.
        // Contar tambien las reservas de mesas futuras diria «tres jugadores»
        // de un GM con uno solo sentado a la mesa, y ademas esas reservas
        // todavia se pueden devolver.
        game: { gmId: gmProfileId, status: 'COMPLETED' },
        status: { in: ESTADOS_PAGADOS },
      },
      _count: { _all: true },
    }),
    db.game.count({
      where: {
        gmId: gmProfileId,
        status: 'CANCELLED',
        // Al cancelar, las reservas pasan a REFUNDED: por eso se cuenta ese
        // estado y no solo los pagados.
        bookings: { some: { status: { in: [...ESTADOS_PAGADOS, 'REFUNDED'] } } },
      },
    }),
  ]);

  return {
    jugadoresDistintos: porJugador.length,
    repetidores: porJugador.filter((j) => j._count._all > 1).length,
    partidasCanceladas,
  };
}

/**
 * Historial de partidas dirigidas por un GM.
 *
 * Solo las jugadas y con alguien que pago: es la misma vara con la que se mide
 * su reputacion. Una partida que se publico y nadie reservo no es experiencia
 * dirigiendo.
 */
export async function partidasDirigidas(gmProfileId: string, limite = 20) {
  return db.game.findMany({
    where: {
      gmId: gmProfileId,
      status: 'COMPLETED',
      bookings: { some: { status: { in: ['PAID', 'COMPLETED'] } } },
    },
    orderBy: { startsAt: 'desc' },
    take: limite,
    select: {
      id: true,
      title: true,
      slug: true,
      system: true,
      startsAt: true,
      sessionNumber: true,
      campaign: { select: { title: true, slug: true } },
      _count: {
        select: { bookings: { where: { status: { in: ['PAID', 'COMPLETED'] } } } },
      },
    },
  });
}

/**
 * Historial de partidas jugadas por un usuario.
 *
 * Es publico, pero solo cuenta que jugo y con quien: ni precios, ni estados de
 * pago, ni reservas canceladas. Lo que aparece aqui es la mesa, no la cuenta.
 */
export async function partidasJugadas(userId: string, limite = 20) {
  const reservas = await db.booking.findMany({
    where: { userId, status: 'COMPLETED' },
    orderBy: { game: { startsAt: 'desc' } },
    take: limite,
    select: {
      id: true,
      game: {
        select: {
          title: true,
          slug: true,
          system: true,
          startsAt: true,
          sessionNumber: true,
          campaign: { select: { title: true, slug: true } },
          gm: { select: { user: { select: { name: true, slug: true } } } },
        },
      },
    },
  });

  return reservas.map((r) => ({ id: r.id, ...r.game }));
}

/**
 * Directorio de game masters.
 *
 * Solo los que pueden cobrar: un perfil de GM sin cuenta de cobro verificada
 * no puede publicar partidas, asi que listarlo seria mandar a la gente a una
 * puerta cerrada.
 *
 * Se ordena por partidas dirigidas, que es lo unico que no se puede fingir.
 */
export async function directorioDeGms(limite = 40) {
  const gms = await db.gmProfile.findMany({
    where: { payoutsEnabled: true },
    take: limite,
    select: {
      id: true,
      headline: true,
      languages: true,
      plan: true,
      user: { select: { name: true, slug: true, image: true } },
      _count: {
        select: {
          games: { where: { status: 'PUBLISHED', startsAt: { gte: new Date() } } },
        },
      },
    },
  });

  const conReputacion = await Promise.all(
    gms.map(async (gm) => ({ ...gm, reputacion: await reputacionGm(gm.id) })),
  );

  return conReputacion.sort(
    (a, b) => b.reputacion.partidasDirigidas - a.reputacion.partidasDirigidas,
  );
}

/** Perfil publico de un game master, o null si ese slug no es de un GM. */
export async function perfilPublicoGm(slug: string) {
  const user = await db.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      bio: true,
      gmProfile: {
        select: {
          id: true,
          headline: true,
          about: true,
          languages: true,
          yearsExperience: true,
          systems: true,
          payoutsEnabled: true,
          plan: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user?.gmProfile) return null;

  const [reputacion, estadisticas, resenas, proximasPartidas, campanas, historial] =
    await Promise.all([
      reputacionGm(user.gmProfile.id),
      estadisticasGm(user.gmProfile.id),
      db.review.findMany({
        where: { gmId: user.gmProfile.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          author: { select: { name: true, slug: true, image: true } },
          game: { select: { title: true } },
        },
      }),
      db.game.findMany({
        where: {
          gmId: user.gmProfile.id,
          status: 'PUBLISHED',
          startsAt: { gte: new Date() },
        },
        orderBy: { startsAt: 'asc' },
        take: 6,
        select: seleccionTarjeta(),
      }),
      db.campaign.findMany({
        where: { gmId: user.gmProfile.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          isOpen: true,
          _count: { select: { games: true } },
        },
      }),
      partidasDirigidas(user.gmProfile.id),
    ]);

  return {
    user,
    gm: user.gmProfile,
    reputacion,
    estadisticas,
    resenas,
    proximasPartidas,
    campanas,
    historial,
  };
}

/** Perfil publico de cualquier usuario. */
export async function perfilPublicoUsuario(slug: string) {
  const user = await db.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      bio: true,
      preferredSystems: true,
      preferredStyles: true,
      createdAt: true,
      gmProfile: { select: { id: true, plan: true } },
    },
  });

  if (!user) return null;

  // Historial: solo partidas efectivamente pagadas y jugadas.
  const [totalJugadas, historial] = await Promise.all([
    db.booking.count({ where: { userId: user.id, status: 'COMPLETED' } }),
    partidasJugadas(user.id),
  ]);

  return {
    user,
    partidasJugadas: totalJugadas,
    historial,
    esGm: user.gmProfile !== null,
    esFundador: user.gmProfile?.plan === 'FUNDADOR',
  };
}

/** Datos del propio perfil para el formulario de edicion. */
export async function miPerfil(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      bio: true,
      image: true,
      preferredSystems: true,
      preferredStyles: true,
      gmProfile: {
        select: {
          headline: true,
          about: true,
          languages: true,
          yearsExperience: true,
          systems: true,
          payoutsEnabled: true,
          onboardedAt: true,
        },
      },
    },
  });
}

/**
 * Todos los game masters, para que un admin decida quien es fundador.
 *
 * Incluye a quien no ha terminado el alta de cobros: a un fundador se le
 * suele nombrar antes, mientras se le ayuda a publicar su primera partida.
 */
export async function gmsParaAdmin() {
  const gms = await db.gmProfile.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      plan: true,
      inviteCode: true,
      inviteCodeExpiresAt: true,
      payoutsEnabled: true,
      createdAt: true,
      user: { select: { name: true, slug: true, image: true, email: true } },
      _count: {
        select: {
          games: { where: { status: { not: 'DRAFT' } } },
          invitados: true,
        },
      },
    },
  });

  // Fundadores primero, y dentro de cada grupo por antiguedad.
  return gms.sort(
    (a, b) => Number(b.plan === 'FUNDADOR') - Number(a.plan === 'FUNDADOR'),
  );
}
