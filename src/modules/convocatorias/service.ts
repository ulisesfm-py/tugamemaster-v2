import 'server-only';

import { db } from '@/lib/db';
import { borrarSiEsNuestra, subirImagen } from '@/lib/imagen';
import {
  avisarMesaCerrada,
  avisarMesaConvocada,
  avisarMinimoAlcanzado,
} from '@/modules/notifications/service';
import { slugDisponible } from '@/modules/users/slug';

import {
  finDelPlazoParaReservar,
  hayQueAvisarDelMinimo,
  problemasAlEditar,
  puedeConvocar,
  puedePreReservar,
} from './politica';
import { convocarSchema, convocatoriaSchema, type ConvocatoriaInput } from './schema';

/**
 * Reglas de negocio de las mesas con fecha flexible, con base de datos.
 *
 * Las reglas puras estan en `politica.ts`; aqui se leen y se guardan. No hay
 * dinero: se cobra al reservar la partida que sale al convocar.
 */

export type ResultadoConvocatoria =
  { ok: true; id: string; slug: string } | { ok: false; mensaje: string };

export type ResultadoSimple = { ok: true } | { ok: false; mensaje: string };

async function gmDe(userId: string) {
  return db.gmProfile.findUnique({
    where: { userId },
    select: { id: true, payoutsEnabled: true },
  });
}

/** Los campos que crear y editar escriben igual. */
function campos(d: ConvocatoriaInput) {
  return {
    title: d.title,
    description: d.description,
    system: d.system,
    languages: d.languages,
    experience: d.experience,
    minAge: d.minAge,
    tags: d.tags,
    seatsTotal: d.seatsTotal,
    minPlayers: d.minPlayers,
    priceCents: d.priceCents,
    weekdays: [...d.weekdays].sort((a, b) => a - b),
    startMinute: d.startMinute,
    durationMinutes: d.durationMinutes,
    frequency: d.frequency,
  };
}

function primerError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Revisa los datos';
}

/** Una mesa del GM, o null si no existe o es de otro. */
async function suya(userId: string, id: string) {
  const mesa = await db.convocatoria.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      status: true,
      seatsTotal: true,
      priceCents: true,
      imageUrl: true,
      gm: { select: { userId: true } },
      _count: { select: { preReservas: true } },
    },
  });

  return mesa && mesa.gm.userId === userId ? mesa : null;
}

export async function crearConvocatoria(
  userId: string,
  input: unknown,
): Promise<ResultadoConvocatoria> {
  const parsed = convocatoriaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, mensaje: primerError(parsed.error) };

  const gm = await gmDe(userId);
  if (!gm) {
    return { ok: false, mensaje: 'Antes tienes que crear tu perfil de game master' };
  }

  const slug = await slugDisponible(parsed.data.title, async (candidato) => {
    const ocupado = await db.convocatoria.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    return ocupado !== null;
  });

  const mesa = await db.convocatoria.create({
    data: { ...campos(parsed.data), gmId: gm.id, slug, status: 'BORRADOR' },
    select: { id: true, slug: true },
  });

  return { ok: true, id: mesa.id, slug: mesa.slug };
}

/**
 * Edita una mesa que aun no se ha convocado.
 *
 * Con gente apuntada el precio no sube y las plazas no bajan
 * (`problemasAlEditar`): se apuntaron con esas condiciones. El slug no cambia,
 * para no romper los enlaces que ya se hayan compartido.
 */
export async function actualizarConvocatoria(
  userId: string,
  id: string,
  input: unknown,
): Promise<ResultadoConvocatoria> {
  const mesa = await suya(userId, id);
  if (!mesa) return { ok: false, mensaje: 'Esa mesa no es tuya' };

  if (mesa.status !== 'BORRADOR' && mesa.status !== 'ABIERTA') {
    return { ok: false, mensaje: 'Esta mesa ya no se puede editar' };
  }

  const parsed = convocatoriaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, mensaje: primerError(parsed.error) };

  const problemas = problemasAlEditar({
    apuntados: mesa._count.preReservas,
    precioActual: mesa.priceCents,
    precioNuevo: parsed.data.priceCents,
    plazasActuales: mesa.seatsTotal,
    plazasNuevas: parsed.data.seatsTotal,
    minimoNuevo: parsed.data.minPlayers,
  });

  if (problemas[0]) return { ok: false, mensaje: problemas[0] };

  await db.convocatoria.update({ where: { id }, data: campos(parsed.data) });

  return { ok: true, id, slug: mesa.slug };
}

/**
 * Publica una mesa: empieza a admitir pre-reservas.
 *
 * Exige la cuenta de cobro lista, igual que publicar una partida: la mesa
 * acabara siendo una partida de pago, y sin cuenta no se podria convocar.
 */
export async function publicarConvocatoria(
  userId: string,
  id: string,
): Promise<ResultadoSimple> {
  const gm = await gmDe(userId);
  const mesa = await suya(userId, id);
  if (!gm || !mesa) return { ok: false, mensaje: 'Esa mesa no es tuya' };

  if (mesa.status !== 'BORRADOR') {
    return { ok: false, mensaje: 'Solo se publica una mesa en borrador' };
  }

  if (!gm.payoutsEnabled) {
    return {
      ok: false,
      mensaje: 'Configura primero la cuenta donde quieres recibir los pagos',
    };
  }

  await db.convocatoria.update({ where: { id }, data: { status: 'ABIERTA' } });
  return { ok: true };
}

/**
 * Devuelve una mesa abierta a borrador, si nadie se ha apuntado aun.
 *
 * Con gente apuntada lo que corresponde es cerrarla, que es otra decision.
 */
export async function retirarConvocatoria(
  userId: string,
  id: string,
): Promise<ResultadoSimple> {
  const mesa = await suya(userId, id);
  if (!mesa) return { ok: false, mensaje: 'Esa mesa no es tuya' };

  if (mesa.status !== 'ABIERTA') {
    return { ok: false, mensaje: 'Solo se retira una mesa abierta' };
  }

  if (mesa._count.preReservas > 0) {
    return {
      ok: false,
      mensaje: 'Ya hay gente apuntada: ciérrala en vez de retirarla',
    };
  }

  await db.convocatoria.update({ where: { id }, data: { status: 'BORRADOR' } });
  return { ok: true };
}

/**
 * Cierra una mesa sin convocarla. No tiene vuelta atras.
 *
 * Nadie habia pagado nada, asi que no hay nada que devolver.
 */
export async function cerrarConvocatoria(
  userId: string,
  id: string,
  ahora = new Date(),
): Promise<ResultadoSimple> {
  const mesa = await suya(userId, id);
  if (!mesa) return { ok: false, mensaje: 'Esa mesa no es tuya' };

  if (mesa.status !== 'BORRADOR' && mesa.status !== 'ABIERTA') {
    return { ok: false, mensaje: 'Esta mesa ya está cerrada o convocada' };
  }

  await db.convocatoria.update({
    where: { id },
    data: { status: 'CERRADA', closedAt: ahora },
  });

  // Fuera de la escritura, como todo correo: si no sale, la mesa sigue
  // cerrada. Las pre-reservas se conservan para saber a quien avisar.
  if (mesa._count.preReservas > 0) await avisarMesaCerrada(id);

  return { ok: true };
}

/* ── Pre-reservas ───────────────────────────────────────────────────────── */

/**
 * Apunta a alguien a una mesa flexible. No cuesta nada ni compromete a nada.
 *
 * Va en una transaccion que bloquea la fila de la mesa, igual que reservar
 * una plaza: dos personas pulsando a la vez sobre la ultima plaza no pueden
 * entrar las dos. La restriccion unica `(convocatoriaId, userId)` es la red
 * contra el doble clic.
 */
export async function preReservar(userId: string, id: string): Promise<ResultadoSimple> {
  const resultado = await db.$transaction(async (tx) => {
    const filas = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Convocatoria" WHERE "id" = ${id} FOR UPDATE
    `;
    if (!filas[0]) return { ok: false as const, mensaje: 'Esa mesa no existe' };

    const mesa = await tx.convocatoria.findUniqueOrThrow({
      where: { id },
      select: {
        status: true,
        seatsTotal: true,
        minPlayers: true,
        minReachedNoticeAt: true,
        gm: { select: { userId: true } },
        _count: { select: { preReservas: true } },
      },
    });

    const [yaApuntado, activas] = await Promise.all([
      tx.preReserva.findUnique({
        where: { convocatoriaId_userId: { convocatoriaId: id, userId } },
        select: { id: true },
      }),
      tx.preReserva.count({
        where: {
          userId,
          convocatoria: { status: 'ABIERTA' },
          NOT: { convocatoriaId: id },
        },
      }),
    ]);

    const permiso = puedePreReservar({
      estado: mesa.status,
      plazas: mesa.seatsTotal,
      apuntados: mesa._count.preReservas,
      yaApuntado: yaApuntado !== null,
      esSuGm: mesa.gm.userId === userId,
      activasDelJugador: activas,
    });

    if (!permiso.ok) return { ok: false as const, mensaje: permiso.mensaje };

    await tx.preReserva.create({ data: { convocatoriaId: id, userId } });

    // La marca se escribe aqui, dentro de la transaccion: asi dos pre-reservas
    // simultaneas que completan el minimo no mandan dos correos.
    const avisar = hayQueAvisarDelMinimo({
      estado: mesa.status,
      apuntados: mesa._count.preReservas + 1,
      minimo: mesa.minPlayers,
      avisadoEn: mesa.minReachedNoticeAt,
    });

    if (avisar) {
      await tx.convocatoria.update({
        where: { id },
        data: { minReachedNoticeAt: new Date() },
      });
    }

    return { ok: true as const, avisar };
  });

  if (!resultado.ok) return resultado;

  if (resultado.avisar) await avisarMinimoAlcanzado(id);
  return { ok: true };
}

/**
 * Borra la pre-reserva de alguien. Mientras la mesa no se haya convocado, se
 * puede hacer siempre: no hay nada que devolver.
 */
export async function borrarPreReserva(
  userId: string,
  id: string,
): Promise<ResultadoSimple> {
  const mesa = await db.convocatoria.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!mesa) return { ok: false, mensaje: 'Esa mesa no existe' };

  // Convocada, la pre-reserva es lo que da derecho al plazo para reservar;
  // quien no quiera jugar simplemente no reserva.
  if (mesa.status !== 'ABIERTA') {
    return { ok: false, mensaje: 'Esta mesa ya no admite cambios en las pre-reservas' };
  }

  await db.preReserva.deleteMany({ where: { convocatoriaId: id, userId } });
  return { ok: true };
}

/**
 * Si una imagen sigue usandola alguna partida o mesa flexible.
 *
 * Una mesa convocada pasa su lamina a la partida que sale de ella, y una
 * continuacion de campana hereda la de la sesion anterior: borrar una imagen
 * sin mirar dejaria sin ella a quien no se ha tocado.
 */
export async function imagenEnUso(url: string): Promise<boolean> {
  const [partidas, mesas] = await Promise.all([
    db.game.count({ where: { imageUrl: url } }),
    db.convocatoria.count({ where: { imageUrl: url } }),
  ]);
  return partidas + mesas > 0;
}

export type ResultadoLamina = { ok: true; url: string } | { ok: false; mensaje: string };

/** Cambia la lamina de una mesa. Mismo criterio que la de una partida. */
export async function subirLaminaDeConvocatoria(
  userId: string,
  id: string,
  file: File,
): Promise<ResultadoLamina> {
  const mesa = await suya(userId, id);
  if (!mesa) return { ok: false, mensaje: 'Esa mesa no es tuya' };

  const subida = await subirImagen(`mesas/${id}`, file);
  if (!subida.ok) return subida;

  await db.convocatoria.update({ where: { id }, data: { imageUrl: subida.url } });

  if (mesa.imageUrl && !(await imagenEnUso(mesa.imageUrl))) {
    await borrarSiEsNuestra(mesa.imageUrl);
  }

  return { ok: true, url: subida.url };
}

/* ── Convocar ───────────────────────────────────────────────────────────── */

export type ResultadoConvocar =
  { ok: true; gameId: string; slug: string } | { ok: false; mensaje: string };

/**
 * Fija la fecha de una mesa flexible: crea su partida y abre el plazo en el
 * que solo reservan quienes se pre-reservaron.
 *
 * La partida nace **publicada** y con la ficha de la mesa: el GM ya la reviso
 * al publicar la mesa, y quienes se apuntaron esperan poder reservar en
 * cuanto les llega el correo. A partir de aqui es una partida normal: se
 * reserva, se cobra, se cancela y se paga al GM como cualquier otra.
 *
 * La mesa se bloquea para que dos clics no creen dos partidas.
 */
export async function convocarMesa(
  userId: string,
  id: string,
  input: unknown,
  ahora = new Date(),
): Promise<ResultadoConvocar> {
  const parsed = convocarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, mensaje: primerError(parsed.error) };
  const { startsAt } = parsed.data;

  const gm = await gmDe(userId);
  if (!gm) return { ok: false, mensaje: 'Esa mesa no es tuya' };

  if (!gm.payoutsEnabled) {
    return {
      ok: false,
      mensaje: 'Configura primero la cuenta donde quieres recibir los pagos',
    };
  }

  const resultado = await db.$transaction(async (tx) => {
    const filas = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Convocatoria" WHERE "id" = ${id} FOR UPDATE
    `;
    if (!filas[0]) return { ok: false as const, mensaje: 'Esa mesa no existe' };

    const mesa = await tx.convocatoria.findUniqueOrThrow({
      where: { id },
      select: {
        gmId: true,
        status: true,
        title: true,
        description: true,
        system: true,
        imageUrl: true,
        languages: true,
        experience: true,
        minAge: true,
        tags: true,
        seatsTotal: true,
        minPlayers: true,
        priceCents: true,
        currency: true,
        durationMinutes: true,
        _count: { select: { preReservas: true } },
      },
    });

    if (mesa.gmId !== gm.id)
      return { ok: false as const, mensaje: 'Esa mesa no es tuya' };

    const permiso = puedeConvocar({
      estado: mesa.status,
      apuntados: mesa._count.preReservas,
      minimo: mesa.minPlayers,
      fecha: startsAt,
      ahora,
    });
    if (!permiso.ok) return { ok: false as const, mensaje: permiso.mensaje };

    const slug = await slugDisponible(mesa.title, async (candidato) => {
      const ocupado = await tx.game.findUnique({
        where: { slug: candidato },
        select: { id: true },
      });
      return ocupado !== null;
    });

    const partida = await tx.game.create({
      data: {
        gmId: gm.id,
        slug,
        title: mesa.title,
        description: mesa.description,
        system: mesa.system,
        imageUrl: mesa.imageUrl,
        languages: mesa.languages,
        experience: mesa.experience,
        minAge: mesa.minAge,
        tags: mesa.tags,
        startsAt,
        endsAt: new Date(startsAt.getTime() + mesa.durationMinutes * 60_000),
        seatsTotal: mesa.seatsTotal,
        priceCents: mesa.priceCents,
        currency: mesa.currency,
        visibility: 'PUBLICA',
        status: 'PUBLISHED',
      },
      select: { id: true, slug: true },
    });

    await tx.convocatoria.update({
      where: { id },
      data: {
        status: 'CONVOCADA',
        gameId: partida.id,
        convenedAt: ahora,
        priorityUntil: finDelPlazoParaReservar(ahora),
      },
    });

    return { ok: true as const, gameId: partida.id, slug: partida.slug };
  });

  if (!resultado.ok) return resultado;

  // Fuera de la transaccion: si el correo no sale, la partida existe igual y
  // el aviso de la campanita sigue diciendoles que reserven.
  await avisarMesaConvocada(id);

  return resultado;
}
