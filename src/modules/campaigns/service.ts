import 'server-only';

import { db } from '@/lib/db';
import { camposDeLaPartida } from '@/modules/games/service';
import { partidaSchema } from '@/modules/games/schema';
import { slugDisponible } from '@/modules/users/slug';

import { numeroSiguiente, partidaTerminada, tituloBase } from './politica';
import { notaSchema, resumenSchema } from './schema';

/**
 * Campanas: partidas encadenadas que se juegan en varias sesiones.
 *
 * Una campana no se crea por adelantado. Nace cuando el GM decide continuar una
 * partida que ya se jugo: hasta entonces era una partida suelta y no habia nada
 * que agrupar. Asi el GM no tiene que declarar de antemano si algo sera campana.
 *
 * Quien puede apuntarse a una continuacion lo decide `reservarAsiento`, que
 * mira quien pago la sesion anterior. La lista de admitidos se deriva de los
 * pagos, no se guarda aparte.
 */

export type ResultadoSimple = { ok: true } | { ok: false; mensaje: string };
export type ResultadoContinuacion =
  { ok: true; gameId: string; slug: string } | { ok: false; mensaje: string };

/**
 * El GM anota donde quedo la sesion.
 *
 * Sirve de recordatorio para la mesa y de plantilla para montar la siguiente.
 * Se sobrescribe: es una nota viva, no un historial de versiones.
 */
export async function guardarNota(
  userId: string,
  gameId: string,
  input: unknown,
): Promise<ResultadoSimple> {
  const parsed = notaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Revisa la nota' };
  }

  const partida = await db.game.findUnique({
    where: { id: gameId },
    select: { status: true, endsAt: true, gm: { select: { userId: true } } },
  });

  if (!partida || partida.gm.userId !== userId) {
    return { ok: false, mensaje: 'Esa partida no es tuya' };
  }

  if (!partidaTerminada(partida.status, partida.endsAt)) {
    return { ok: false, mensaje: 'La partida todavía no se ha jugado' };
  }

  await db.sessionNote.upsert({
    where: { gameId },
    update: { content: parsed.data.content },
    create: { gameId, content: parsed.data.content },
  });

  return { ok: true };
}

/**
 * Crea la siguiente sesion a partir de una ya jugada.
 *
 * Si la partida anterior no pertenecia a ninguna campana, se crea la campana en
 * ese momento y la anterior pasa a ser su sesion 1.
 *
 * La nueva partida nace en DRAFT, como cualquier otra: publicarla sigue
 * exigiendo que el GM tenga la cuenta de cobro lista.
 */
export async function crearContinuacion(
  userId: string,
  gameId: string,
  input: unknown,
): Promise<ResultadoContinuacion> {
  const parsed = partidaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos' };
  }

  const resumen = resumenSchema.safeParse(
    (input as { campaignSummary?: unknown }).campaignSummary,
  );

  if (!resumen.success) {
    return {
      ok: false,
      mensaje: resumen.error.issues[0]?.message ?? 'Revisa el resumen de la campana',
    };
  }

  const anterior = await db.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      title: true,
      status: true,
      endsAt: true,
      gmId: true,
      campaignId: true,
      sessionNumber: true,
      imageUrl: true,
      gm: { select: { userId: true } },
      nextGame: { select: { id: true } },
    },
  });

  if (!anterior || anterior.gm.userId !== userId) {
    return { ok: false, mensaje: 'Esa partida no es tuya' };
  }

  if (!partidaTerminada(anterior.status, anterior.endsAt)) {
    return {
      ok: false,
      mensaje: 'Solo se continua una partida ya jugada: primero se juega, luego se sigue',
    };
  }

  // `previousGameId` es unico en la base de datos, asi que este aviso existe
  // para explicarlo en vez de estrellarse contra la restriccion.
  if (anterior.nextGame) {
    return {
      ok: false,
      mensaje: 'Esta partida ya tiene una continuación creada',
    };
  }

  const d = parsed.data;

  const slug = await slugDisponible(d.title, async (candidato) => {
    const ocupado = await db.game.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    return ocupado !== null;
  });

  const nombreCampana = tituloBase(anterior.title);

  const slugCampana = anterior.campaignId
    ? null
    : await slugDisponible(nombreCampana, async (candidato) => {
        const ocupado = await db.campaign.findUnique({
          where: { slug: candidato },
          select: { id: true },
        });
        return ocupado !== null;
      });

  const creada = await db.$transaction(async (tx) => {
    let campaignId = anterior.campaignId;

    if (!campaignId) {
      const campana = await tx.campaign.create({
        data: {
          gmId: anterior.gmId,
          title: nombreCampana,
          slug: slugCampana ?? nombreCampana,
          summary: resumen.data,
        },
        select: { id: true },
      });

      campaignId = campana.id;

      // La partida que se continua pasa a ser la primera sesion de la campana
      // que acaba de nacer.
      await tx.game.update({
        where: { id: anterior.id },
        data: { campaignId, sessionNumber: anterior.sessionNumber ?? 1 },
      });
    } else if (resumen.data !== null) {
      // En una campana que ya existia, el resumen se actualiza si el GM ha
      // escrito uno; dejarlo en blanco no borra el que hubiera.
      await tx.campaign.update({
        where: { id: campaignId },
        data: { summary: resumen.data },
      });
    }

    return tx.game.create({
      data: {
        ...camposDeLaPartida(d),
        gmId: anterior.gmId,
        campaignId,
        previousGameId: anterior.id,
        sessionNumber: numeroSiguiente(anterior.sessionNumber),
        slug,
        // La siguiente sesion hereda la lamina: es la misma campana y la misma
        // mesa. Por eso `subirLamina` comprueba quien mas la usa antes de
        // borrar una imagen que se reemplaza.
        imageUrl: anterior.imageUrl,
        status: 'DRAFT',
      },
      select: { id: true, slug: true },
    });
  });

  return { ok: true, gameId: creada.id, slug: creada.slug };
}
