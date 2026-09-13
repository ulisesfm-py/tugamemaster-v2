import 'server-only';

import { db } from '@/lib/db';

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
          payoutsEnabled: true,
        },
      },
    },
  });

  if (!user?.gmProfile) return null;

  const [reputacion, resenas, proximasPartidas] = await Promise.all([
    reputacionGm(user.gmProfile.id),
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
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        system: true,
        startsAt: true,
        seatsTotal: true,
        priceCents: true,
        currency: true,
        _count: {
          select: { bookings: { where: { status: { in: ['PAID', 'COMPLETED'] } } } },
        },
      },
    }),
  ]);

  return { user, gm: user.gmProfile, reputacion, resenas, proximasPartidas };
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
      gmProfile: { select: { id: true } },
    },
  });

  if (!user) return null;

  // Historial: solo partidas efectivamente pagadas y jugadas.
  const partidasJugadas = await db.booking.count({
    where: { userId: user.id, status: 'COMPLETED' },
  });

  return { user, partidasJugadas, esGm: user.gmProfile !== null };
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
          payoutsEnabled: true,
          onboardedAt: true,
        },
      },
    },
  });
}
