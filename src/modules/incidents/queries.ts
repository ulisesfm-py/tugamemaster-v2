import 'server-only';

import { db } from '@/lib/db';

/** Incidencias para el panel de administracion, las abiertas primero. */
export async function incidenciasParaAdmin() {
  return db.incident.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    select: {
      id: true,
      reason: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      resolutionNote: true,
      reportedBy: { select: { name: true, slug: true } },
      resolvedBy: { select: { name: true } },
      booking: {
        select: {
          id: true,
          amountCents: true,
          creditCents: true,
          currency: true,
          status: true,
          game: {
            select: {
              title: true,
              slug: true,
              endsAt: true,
              gm: { select: { user: { select: { name: true, slug: true } } } },
            },
          },
        },
      },
    },
  });
}

/** Incidencias que ha abierto un jugador, para su pagina de reservas. */
export async function misIncidencias(userId: string) {
  return db.incident.findMany({
    where: { reportedById: userId },
    select: { id: true, bookingId: true, status: true, resolutionNote: true },
  });
}
