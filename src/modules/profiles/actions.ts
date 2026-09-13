'use server';

import { revalidatePath } from 'next/cache';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';

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
  if (!session?.user) return { error: 'Tienes que iniciar sesion' };

  const resultado = await actualizarPerfilJugador(session.user.id, {
    name: String(formData.get('name') ?? ''),
    bio: String(formData.get('bio') ?? ''),
    preferredSystems: listaDesdeTexto(formData.get('preferredSystems')),
    preferredStyles: listaDesdeTexto(formData.get('preferredStyles')),
  });

  if (!resultado.ok) return { error: resultado.mensaje };

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
  if (!session?.user) return { error: 'Tienes que iniciar sesion' };

  const resultado = await guardarPerfilGm(session.user.id, {
    headline: String(formData.get('headline') ?? ''),
    about: String(formData.get('about') ?? ''),
    languages: listaDesdeTexto(formData.get('languages')),
  });

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/cuenta/gm');
  revalidatePath(`/gm/${session.user.slug}`);

  return { ok: true };
}
