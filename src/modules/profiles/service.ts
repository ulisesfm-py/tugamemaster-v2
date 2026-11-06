import 'server-only';

import { db } from '@/lib/db';

import {
  cambioDePlanSchema,
  perfilGmSchema,
  perfilJugadorSchema,
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
/**
 * La entrada llega como `unknown` a proposito: el formulario manda cadenas y el
 * esquema las convierte, asi que el tipo de entrada y el de salida no
 * coinciden. Parsear aqui dentro evita castings en quien llama.
 */
export async function guardarPerfilGm(
  userId: string,
  input: unknown,
): Promise<Resultado> {
  const parsed = perfilGmSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos' };
  }

  const datos = {
    headline: parsed.data.headline,
    about: parsed.data.about,
    languages: parsed.data.languages,
    yearsExperience: parsed.data.yearsExperience,
    systems: parsed.data.systems,
  };

  await db.gmProfile.upsert({
    where: { userId },
    update: datos,
    create: { userId, ...datos },
  });

  return { ok: true };
}

/**
 * Nombra fundador a un game master, o le quita la condicion.
 *
 * Solo lo hace un admin, a mano: no hay forma de pedirlo. El cambio no toca
 * ninguna reserva ya hecha, porque cada una guarda la comision con la que se
 * reservo; afecta solo a las que vengan despues.
 */
export async function cambiarPlanGm(
  entrada: unknown,
  quien: { esAdmin: boolean },
): Promise<Resultado> {
  if (!quien.esAdmin) return { ok: false, mensaje: 'Esto lo decide un administrador' };

  const datos = cambioDePlanSchema.safeParse(entrada);
  if (!datos.success) return { ok: false, mensaje: 'Ese cambio de plan no es válido' };

  const { count } = await db.gmProfile.updateMany({
    where: { id: datos.data.gmProfileId },
    data: { plan: datos.data.plan },
  });

  if (count === 0) return { ok: false, mensaje: 'Ese game master no existe' };

  return { ok: true };
}
