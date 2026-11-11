'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';
import { exigirAdmin } from '@/lib/auth/admin';

import {
  actualizarPost,
  alternarLike,
  borrarComentario,
  borrarPost,
  comentar,
  crearPost,
  despublicarPost,
  publicarPost,
  subirPortada,
} from './service';

function datosDelPost(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    excerpt: formData.get('excerpt'),
    content: String(formData.get('content') ?? ''),
  };
}

/** Revalida el panel y, si el articulo tiene direccion publica, tambien esa. */
function revalidar(slug?: string) {
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function crearPostAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { error: 'No tienes permiso' };

  const resultado = await crearPost(admin.id, datosDelPost(formData));
  if (!resultado.ok) return { error: resultado.mensaje, enviado: formData };

  revalidar();
  redirect(`/admin/blog/${resultado.postId}`);
}

export async function actualizarPostAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { error: 'No tienes permiso' };

  const postId = String(formData.get('postId') ?? '');
  const resultado = await actualizarPost(admin.id, postId, datosDelPost(formData));

  if (!resultado.ok) return { error: resultado.mensaje, enviado: formData };

  revalidar(resultado.slug);
  revalidatePath(`/admin/blog/${postId}`);

  return { ok: true, mensaje: 'Guardado.' };
}

/** Acciones de un solo boton sobre un articulo. */
async function accionSobrePost(
  formData: FormData,
  operacion: (
    userId: string,
    postId: string,
  ) => Promise<{ ok: boolean; mensaje?: string }>,
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { error: 'No tienes permiso' };

  const postId = String(formData.get('postId') ?? '');
  const resultado = await operacion(admin.id, postId);

  if (!resultado.ok) return { error: resultado.mensaje ?? 'No se pudo completar' };

  revalidar(String(formData.get('slug') ?? '') || undefined);
  revalidatePath(`/admin/blog/${postId}`);

  return { ok: true };
}

export async function publicarPostAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  return accionSobrePost(formData, publicarPost);
}

export async function despublicarPostAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  return accionSobrePost(formData, despublicarPost);
}

export async function borrarPostAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { error: 'No tienes permiso' };

  const resultado = await borrarPost(admin.id, String(formData.get('postId') ?? ''));
  if (!resultado.ok) return { error: resultado.mensaje };

  revalidar();
  redirect('/admin/blog');
}

export async function subirPortadaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { error: 'No tienes permiso' };

  const file = formData.get('portada');
  if (!(file instanceof File)) return { error: 'No has elegido ninguna imagen' };

  const postId = String(formData.get('postId') ?? '');

  try {
    const resultado = await subirPortada(admin.id, postId, file);
    if (!resultado.ok) return { error: resultado.mensaje };

    revalidar(String(formData.get('slug') ?? '') || undefined);
    revalidatePath(`/admin/blog/${postId}`);

    return { ok: true, mensaje: 'Portada actualizada.' };
  } catch (error) {
    console.error('Fallo al subir la portada:', error);
    return { error: 'No se ha podido guardar la imagen. Intentalo de nuevo.' };
  }
}

export async function comentarAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Inicia sesión para comentar' };

  const resultado = await comentar(
    session.user.id,
    String(formData.get('postId') ?? ''),
    {
      body: formData.get('body'),
    },
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath(`/blog/${String(formData.get('slug') ?? '')}`);

  return { ok: true, mensaje: 'Comentario publicado.' };
}

export async function borrarComentarioAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await borrarComentario(
    { id: session.user.id, esAdmin: (await exigirAdmin()) !== null },
    String(formData.get('commentId') ?? ''),
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath(`/blog/${String(formData.get('slug') ?? '')}`);

  return { ok: true, mensaje: 'Comentario retirado.' };
}

export async function alternarLikeAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Inicia sesión para dar like' };

  const resultado = await alternarLike(
    session.user.id,
    String(formData.get('postId') ?? ''),
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath(`/blog/${String(formData.get('slug') ?? '')}`);
  revalidatePath('/blog');

  return { ok: true };
}
