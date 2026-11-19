import 'server-only';

import { db } from '@/lib/db';
import { borrarSiEsNuestra, subirImagen } from '@/lib/imagen';
import { slugDisponible } from '@/modules/users/slug';

import { problemasAlEditar } from './politica';
import { convocatoriaSchema, type ConvocatoriaInput } from './schema';

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
