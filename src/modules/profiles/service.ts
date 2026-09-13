import 'server-only';

import { db } from '@/lib/db';

import {
  perfilGmSchema,
  perfilJugadorSchema,
  type PerfilGmInput,
  type PerfilJugadorInput,
} from './schema';

/**
 * Reglas de negocio de los perfiles.
 */

export type Resultado = { ok: true } | { ok: false; mensaje: string };

export async function actualizarPerfilJugador(
  userId: string,
  input: PerfilJugadorInput,
): Promise<Resultado> {
  const parsed = perfilJugadorSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos' };
  }

  // El slug no se toca al cambiar el nombre: es la URL publica del perfil y
  // ya puede estar compartida o enlazada desde una resena.
  await db.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio,
      preferredSystems: parsed.data.preferredSystems,
      preferredStyles: parsed.data.preferredStyles,
    },
  });

  return { ok: true };
}

/**
 * Crea o actualiza el perfil de game master.
 *
 * Crear el perfil es lo que convierte a un usuario en GM. No habilita publicar
 * partidas: para eso hace falta completar el alta de Stripe (fase 5), que es
 * lo que pone `payoutsEnabled` a true.
 */
export async function guardarPerfilGm(
  userId: string,
  input: PerfilGmInput,
): Promise<Resultado> {
  const parsed = perfilGmSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos' };
  }

  const datos = {
    headline: parsed.data.headline,
    about: parsed.data.about,
    languages: parsed.data.languages,
  };

  await db.gmProfile.upsert({
    where: { userId },
    update: datos,
    create: { userId, ...datos },
  });

  return { ok: true };
}
