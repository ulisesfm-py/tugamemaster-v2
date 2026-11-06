import 'server-only';

import { randomInt } from 'node:crypto';

import { db } from '@/lib/db';

import {
  caducidadDesde,
  estadoDelCodigo,
  generarCodigo,
  normalizarCodigo,
} from './politica';

/**
 * El codigo de invitacion de los fundadores, con base de datos.
 *
 * Las reglas estan en `politica.ts`; aqui solo se leen y se guardan.
 */

export type Invitacion =
  | { ok: true; gmProfileId: string; nombre: string; slug: string }
  | { ok: false; mensaje: string };

/**
 * A que fundador corresponde un codigo, si admite registros ahora.
 *
 * Los mensajes no distinguen entre un codigo que no existe y uno de alguien
 * que ya no es fundador: decir cual de los dos es ensenaria que codigos
 * existieron.
 */
export async function buscarCodigo(
  entrada: string,
  ahora = new Date(),
): Promise<Invitacion> {
  const codigo = normalizarCodigo(entrada);

  if (!codigo) {
    return { ok: false, mensaje: 'Ese código no es válido: tiene 8 letras y números' };
  }

  const gm = await db.gmProfile.findUnique({
    where: { inviteCode: codigo },
    select: {
      id: true,
      plan: true,
      inviteCodeExpiresAt: true,
      user: { select: { name: true, slug: true } },
    },
  });

  if (!gm) return { ok: false, mensaje: 'No hay ningún game master con ese código' };

  const estado = estadoDelCodigo(gm, ahora);

  if (estado === 'SIN_PLAN') {
    return { ok: false, mensaje: 'No hay ningún game master con ese código' };
  }

  if (estado === 'CADUCADO') {
    return {
      ok: false,
      mensaje: `El código de ${gm.user.name} ha caducado. Puedes crear la cuenta sin él.`,
    };
  }

  return { ok: true, gmProfileId: gm.id, nombre: gm.user.name, slug: gm.user.slug };
}

/**
 * Da al GM un codigo nuevo, valido desde hoy. El anterior deja de existir.
 *
 * Reintenta si el azar repite uno ya usado: con 31^8 combinaciones no deberia
 * pasar nunca, pero la restriccion unica es la que manda, no la probabilidad.
 */
export async function emitirCodigo(
  gmProfileId: string,
  ahora = new Date(),
): Promise<void> {
  for (let intento = 0; intento < 5; intento++) {
    try {
      await db.gmProfile.update({
        where: { id: gmProfileId },
        data: {
          inviteCode: generarCodigo(randomInt),
          inviteCodeExpiresAt: caducidadDesde(ahora),
        },
      });
      return;
    } catch (error) {
      if (!esDuplicado(error)) throw error;
    }
  }

  throw new Error(`No se pudo generar un código único para ${gmProfileId}`);
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

/** Alarga la validez del codigo actual, contando desde hoy. */
export async function renovarCodigo(
  gmProfileId: string,
  ahora = new Date(),
): Promise<void> {
  await db.gmProfile.update({
    where: { id: gmProfileId },
    data: { inviteCodeExpiresAt: caducidadDesde(ahora) },
  });
}

/**
 * Lo que pasa con el codigo al nombrar fundador a alguien.
 *
 * Si nunca tuvo, se le emite uno. Si ya tenia de una vez anterior, conserva el
 * mismo —puede que siga escrito en su bio— y se le abre un plazo nuevo.
 */
export async function prepararCodigoDeFundador(
  gmProfileId: string,
  ahora = new Date(),
): Promise<void> {
  const gm = await db.gmProfile.findUnique({
    where: { id: gmProfileId },
    select: { inviteCode: true },
  });

  if (!gm) return;

  if (gm.inviteCode) await renovarCodigo(gmProfileId, ahora);
  else await emitirCodigo(gmProfileId, ahora);
}
