import 'server-only';

import { db } from '@/lib/db';

import { MENSAJE_NO_VALORABLE, puedeEditar, puedeValorar } from './politica';
import { resenaSchema } from './schema';

/**
 * Resenas: el jugador valora al game master despues de jugar.
 *
 * Escribir una resena no mueve dinero ni bloquea nada. Una valoracion de una
 * estrella no detiene el pago al GM: eso lo hace una incidencia, y solo ella.
 * Mezclar las dos cosas convertiria la valoracion en un arma sobre el cobro.
 */

export type ResultadoResena =
  { ok: true; reviewId: string } | { ok: false; mensaje: string };

/** Datos crudos del formulario, validados aqui y no antes. */
type DatosResena = { rating: unknown; comment: unknown };

function validar(datos: DatosResena) {
  const resultado = resenaSchema.safeParse(datos);

  if (!resultado.success) {
    return {
      ok: false as const,
      mensaje: resultado.error.issues[0]?.message ?? 'Revisa los datos de la resena',
    };
  }

  return { ok: true as const, datos: resultado.data };
}

/**
 * El jugador valora la partida que jugo.
 *
 * La validacion vive en el servicio y no en la accion: una accion de servidor
 * es un endpoint por si misma, y el dia que se valore desde otro sitio las
 * reglas tienen que seguir aplicandose.
 */
export async function dejarResena(
  bookingId: string,
  userId: string,
  datos: DatosResena,
): Promise<ResultadoResena> {
  const validado = validar(datos);
  if (!validado.ok) return validado;

  const reserva = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      userId: true,
      status: true,
      gameId: true,
      game: { select: { endsAt: true, gmId: true } },
      review: { select: { id: true } },
    },
  });

  if (!reserva || reserva.userId !== userId) {
    return { ok: false, mensaje: 'Esa reserva no es tuya' };
  }

  if (reserva.review) {
    return { ok: false, mensaje: 'Ya has valorado esta partida' };
  }

  const valorable = puedeValorar({
    estado: reserva.status,
    finPartida: reserva.game.endsAt,
  });

  if (!valorable.ok) {
    return { ok: false, mensaje: MENSAJE_NO_VALORABLE[valorable.motivo] };
  }

  try {
    const resena = await db.review.create({
      data: {
        bookingId,
        gameId: reserva.gameId,
        authorId: userId,
        gmId: reserva.game.gmId,
        rating: validado.datos.rating,
        comment: validado.datos.comment,
      },
      select: { id: true },
    });

    return { ok: true, reviewId: resena.id };
  } catch (error) {
    // `bookingId` es unico en Review: dos envios simultaneos (un doble clic)
    // llegan los dos a la comprobacion de arriba y solo uno puede insertar.
    if (esDuplicado(error)) {
      return { ok: false, mensaje: 'Ya has valorado esta partida' };
    }

    throw error;
  }
}

/** Corregir una resena propia, mientras siga dentro de plazo. */
export async function editarResena(
  reviewId: string,
  userId: string,
  datos: DatosResena,
): Promise<ResultadoResena> {
  const validado = validar(datos);
  if (!validado.ok) return validado;

  const resena = await db.review.findUnique({
    where: { id: reviewId },
    select: { authorId: true, createdAt: true },
  });

  if (!resena || resena.authorId !== userId) {
    return { ok: false, mensaje: 'Esa resena no es tuya' };
  }

  if (!puedeEditar(resena.createdAt)) {
    return { ok: false, mensaje: 'El plazo para corregir esta resena ya paso' };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { rating: validado.datos.rating, comment: validado.datos.comment },
  });

  return { ok: true, reviewId };
}

/** True si el error es una violacion de restriccion unica de Prisma. */
function esDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}
