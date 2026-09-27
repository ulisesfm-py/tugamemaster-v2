import 'server-only';

import { db } from '@/lib/db';
import { puedeValorar } from '@/modules/reviews/politica';
import { accesoAlHilo } from '@/modules/threads/politica';

import { MINUTOS_DE_GRACIA } from './service';
import {
  hayDerechoADevolucion,
  importeDevolucionCents,
  limiteDeDevolucion,
  PORCENTAJE_DEVOLUCION,
} from './politica';

/** Reservas de un jugador, separadas en proximas e historial. */
export async function misReservas(userId: string) {
  const reservas = await db.booking.findMany({
    where: { userId },
    orderBy: { game: { startsAt: 'desc' } },
    select: {
      id: true,
      status: true,
      amountCents: true,
      currency: true,
      createdAt: true,
      game: {
        select: {
          id: true,
          title: true,
          slug: true,
          system: true,
          startsAt: true,
          endsAt: true,
          status: true,
          gm: { select: { user: { select: { name: true, slug: true } } } },
        },
      },
    },
  });

  const ahora = Date.now();
  const fecha = new Date(ahora);
  const activa = (estado: string) => estado === 'PENDING' || estado === 'PAID';

  // `reclamable`, `valorable` y el plazo de cancelacion se deciden aqui y no en
  // la pagina: dependen de la hora actual, y leer el reloj durante el render de
  // un componente es impuro.
  const conReclamable = reservas.map((r) => {
    const conDevolucion = hayDerechoADevolucion(r.game.startsAt, fecha);

    return {
      ...r,
      reclamable:
        r.game.startsAt.getTime() <= ahora &&
        (r.status === 'PAID' || r.status === 'COMPLETED'),
      valorable: puedeValorar({ estado: r.status, finPartida: r.game.endsAt }, fecha).ok,

      // Si el hilo de esa mesa sigue abierto para el. Se decide aqui por lo
      // mismo que lo demas: depende de la hora, y la pagina no lee el reloj.
      /**
       * Se quedo a medias de pagar y ya no ocupa plaza.
       *
       * No es un estado guardado: una reserva PENDING deja de contar en el
       * aforo sola, pasados los minutos de gracia. Pero en la pantalla seguia
       * apareciendo igual que una reserva viva, asi que quien abandonaba el
       * pago creia tener sitio en una mesa donde ya no lo tenia.
       */
      caducada:
        r.status === 'PENDING' &&
        r.createdAt.getTime() < ahora - MINUTOS_DE_GRACIA * 60_000,

      hilo: accesoAlHilo(
        { esGm: false, reserva: r.status },
        { finPartida: r.game.endsAt },
        fecha,
      ).ok,

      // Lo que pasa si libera la plaza ahora mismo. Hasta ahora el jugador
      // tenia que irse a las condiciones a averiguarlo, justo en el momento en
      // que menos ganas tiene de leer nada.
      conDevolucion,
      // El instante exacto, no una cuenta atras: «te quedan 2 dias» cuando
      // faltan 71 horas se queda corto por casi un dia entero, y un plazo que
      // miente es peor que no ensenarlo.
      limiteDevolucion: limiteDeDevolucion(r.game.startsAt),
      devolucionCents: conDevolucion
        ? importeDevolucionCents(r.amountCents, PORCENTAJE_DEVOLUCION)
        : 0,
    };
  });

  return {
    proximas: conReclamable.filter(
      (r) => r.game.startsAt.getTime() > ahora && activa(r.status),
    ),
    pasadas: conReclamable.filter(
      (r) => r.game.startsAt.getTime() <= ahora || !activa(r.status),
    ),
  };
}

/** Jugadores apuntados a una partida, para el GM que la dirige. */
export async function jugadoresDe(gameId: string, userId: string) {
  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: { gm: { select: { userId: true } } },
  });

  if (!partida || partida.gm.userId !== userId) return null;

  return db.booking.findMany({
    where: { gameId, status: { in: ['PENDING', 'PAID', 'COMPLETED'] } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, slug: true, image: true } },
    },
  });
}
