import 'server-only';

import { db } from '@/lib/db';

import { accesoAlHilo, MENSAJE_SIN_HILO, puedeDenunciar, puedeRetirar } from './politica';
import { denunciaSchema, mensajeSchema } from './schema';

/**
 * El hilo de mesa: la conversacion de una partida.
 *
 * Todo lo que se escribe pasa antes por `accesoDe`, que es el unico sitio
 * donde se resuelve quien es quien en una mesa. Repartir esa comprobacion por
 * cada operacion seria repartir tambien la posibilidad de olvidarla en una.
 */

export type Resultado = { ok: true } | { ok: false; mensaje: string };

export type Acceso =
  | { ok: true; esGm: boolean; gameId: string }
  | { ok: false; mensaje: string; existe: boolean };

/**
 * Quien es alguien en el hilo de una partida.
 *
 * `existe` distingue "esta partida no esta" de "no es tuya", y lo usa la
 * pagina para enseñar 404 en el segundo caso tambien: confirmar que un hilo
 * existe ya es decir algo de una mesa a la que no perteneces.
 */
export async function accesoDe(
  gameId: string,
  userId: string,
  ahora = new Date(),
): Promise<Acceso> {
  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      endsAt: true,
      gm: { select: { userId: true } },
      bookings: { where: { userId }, select: { status: true } },
    },
  });

  if (!partida) return { ok: false, mensaje: 'Esa partida no existe', existe: false };

  const acceso = accesoAlHilo(
    {
      esGm: partida.gm.userId === userId,
      reserva: partida.bookings[0]?.status ?? null,
    },
    { finPartida: partida.endsAt },
    ahora,
  );

  if (!acceso.ok) {
    return {
      ok: false,
      mensaje: MENSAJE_SIN_HILO[acceso.motivo],
      // Quien no es de la mesa no debe enterarse siquiera de que hay hilo.
      existe: acceso.motivo !== 'NO_ES_DE_LA_MESA',
    };
  }

  return { ok: true, esGm: acceso.esGm, gameId: partida.id };
}

/** Escribir en el hilo. Marca leido de paso: quien escribe estaba mirando. */
export async function escribirMensaje(
  gameId: string,
  userId: string,
  datos: { body: unknown },
): Promise<Resultado> {
  const acceso = await accesoDe(gameId, userId);
  if (!acceso.ok) return { ok: false, mensaje: acceso.mensaje };

  const validado = mensajeSchema.safeParse(datos);

  if (!validado.success) {
    return {
      ok: false,
      mensaje: validado.error.issues[0]?.message ?? 'Revisa el mensaje',
    };
  }

  await db.threadMessage.create({
    data: { gameId, authorId: userId, body: validado.data.body },
  });

  await marcarLeido(gameId, userId);

  return { ok: true };
}

/**
 * Retirar un mensaje.
 *
 * Se marca, no se borra: quitar la fila deja un hueco en una conversacion que
 * otros ya leyeron, y el hueco se nota mas que el aviso de retirada.
 */
export async function retirarMensaje(
  messageId: string,
  quien: { id: string; esAdmin: boolean },
): Promise<Resultado> {
  const mensaje = await db.threadMessage.findUnique({
    where: { id: messageId },
    select: { authorId: true, gameId: true, removedAt: true },
  });

  if (!mensaje) return { ok: false, mensaje: 'Ese mensaje ya no está' };
  if (mensaje.removedAt) return { ok: true };

  if (!puedeRetirar({ autorId: mensaje.authorId }, quien)) {
    return { ok: false, mensaje: 'Ese mensaje no es tuyo' };
  }

  // Un admin retira desde el panel de denuncias, sin pertenecer a la mesa.
  if (!quien.esAdmin) {
    const acceso = await accesoDe(mensaje.gameId, quien.id);
    if (!acceso.ok) return { ok: false, mensaje: acceso.mensaje };
  }

  await db.threadMessage.update({
    where: { id: messageId },
    data: { removedAt: new Date(), removedById: quien.id },
  });

  return { ok: true };
}

/**
 * Denunciar un mensaje.
 *
 * Va al panel de administracion, no a `Incident`: una incidencia esta atada a
 * una reserva y retiene el pago al GM, y un mensaje fuera de tono no puede
 * bloquear dinero.
 */
export async function denunciarMensaje(
  messageId: string,
  userId: string,
  datos: { reason: unknown },
): Promise<Resultado> {
  const mensaje = await db.threadMessage.findUnique({
    where: { id: messageId },
    select: { authorId: true, gameId: true, reportedAt: true, removedAt: true },
  });

  if (!mensaje || mensaje.removedAt)
    return { ok: false, mensaje: 'Ese mensaje ya no está' };

  const acceso = await accesoDe(mensaje.gameId, userId);
  if (!acceso.ok) return { ok: false, mensaje: acceso.mensaje };

  if (
    !puedeDenunciar(
      { autorId: mensaje.authorId, denunciado: !!mensaje.reportedAt },
      { id: userId },
    )
  ) {
    return { ok: false, mensaje: 'Ese mensaje ya está denunciado o es tuyo' };
  }

  const validado = denunciaSchema.safeParse(datos);

  if (!validado.success) {
    return {
      ok: false,
      mensaje: validado.error.issues[0]?.message ?? 'Revisa el motivo',
    };
  }

  await db.threadMessage.update({
    where: { id: messageId },
    data: {
      reportedById: userId,
      reportedAt: new Date(),
      reportReason: validado.data.reason,
    },
  });

  return { ok: true };
}

/**
 * El game master vacia el hilo.
 *
 * Vaciar no es cerrar: si alguien vuelve a escribir, el hilo vuelve a existir.
 * Por eso aqui si se borran las filas —no queda conversacion en la que dejar
 * huecos— y se conserva la marca de lectura, que no es de nadie en concreto.
 */
export async function vaciarHilo(gameId: string, userId: string): Promise<Resultado> {
  const acceso = await accesoDe(gameId, userId);

  if (!acceso.ok) return { ok: false, mensaje: acceso.mensaje };
  if (!acceso.esGm)
    return { ok: false, mensaje: 'Solo el game master puede vaciar el hilo' };

  await db.threadMessage.deleteMany({ where: { gameId } });

  return { ok: true };
}

/** Hasta donde ha leido alguien. Se llama al abrir el hilo. */
export async function marcarLeido(gameId: string, userId: string): Promise<void> {
  const readAt = new Date();

  await db.threadRead.upsert({
    where: { gameId_userId: { gameId, userId } },
    create: { gameId, userId, readAt },
    update: { readAt },
  });
}
