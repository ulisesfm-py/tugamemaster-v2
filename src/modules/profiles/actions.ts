'use server';

import { revalidatePath } from 'next/cache';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';

import { quitarAvatar, subirAvatar } from './avatar';
import { listaDesdeTexto } from './schema';
import { actualizarPerfilJugador, guardarPerfilGm } from './service';

export type EstadoPerfil = EstadoAccion;

/**
 * Acciones de los formularios de perfil.
 *
 * Cada una vuelve a comprobar la sesion en el servidor. El middleware ya
 * protege estas rutas, pero una accion de servidor es un endpoint por si
 * misma: si no comprobara la sesion, podria invocarse directamente.
 */

export async function guardarPerfilJugadorAction(
  _previo: EstadoPerfil,
  formData: FormData,
): Promise<EstadoPerfil> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await actualizarPerfilJugador(session.user.id, {
    name: String(formData.get('name') ?? ''),
    bio: String(formData.get('bio') ?? ''),
    preferredSystems: listaDesdeTexto(formData.get('preferredSystems')),
    preferredStyles: listaDesdeTexto(formData.get('preferredStyles')),
  });

  if (!resultado.ok) return { error: resultado.mensaje, enviado: formData };

  revalidatePath('/cuenta');
  revalidatePath(`/u/${session.user.slug}`);
  revalidatePath(`/gm/${session.user.slug}`);

  return { ok: true };
}

export async function guardarPerfilGmAction(
  _previo: EstadoPerfil,
  formData: FormData,
): Promise<EstadoPerfil> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await guardarPerfilGm(session.user.id, {
    headline: String(formData.get('headline') ?? ''),
    about: String(formData.get('about') ?? ''),
    languages: listaDesdeTexto(formData.get('languages')),
    yearsExperience: String(formData.get('yearsExperience') ?? ''),
    systems: listaDesdeTexto(formData.get('systems')),
  });

  if (!resultado.ok) return { error: resultado.mensaje, enviado: formData };

  revalidatePath('/cuenta/gm');
  revalidatePath(`/gm/${session.user.slug}`);

  return { ok: true };
}

export async function subirAvatarAction(
  _previo: EstadoPerfil,
  formData: FormData,
): Promise<EstadoPerfil> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const file = formData.get('avatar');
  if (!(file instanceof File)) return { error: 'No has elegido ninguna imagen' };

  const resultado = await subirAvatar(session.user.id, file);
  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/cuenta');
  revalidatePath(`/u/${session.user.slug}`);
  revalidatePath(`/gm/${session.user.slug}`);

  return { ok: true, mensaje: 'Foto actualizada.' };
}

export async function quitarAvatarAction(
  _previo: EstadoPerfil,
  _formData: FormData,
): Promise<EstadoPerfil> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await quitarAvatar(session.user.id);
  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/cuenta');
  revalidatePath(`/u/${session.user.slug}`);
  revalidatePath(`/gm/${session.user.slug}`);

  return { ok: true, mensaje: 'Foto eliminada.' };
}
