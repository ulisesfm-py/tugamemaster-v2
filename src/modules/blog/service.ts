import 'server-only';

import { db } from '@/lib/db';
import { borrarSiEsNuestra, subirImagen } from '@/lib/imagen';
import { slugDisponible } from '@/modules/users/slug';

import { puedeBorrarComentario } from './politica';
import { comentarioSchema, postSchema } from './schema';

/**
 * Blog: los administradores publican articulos, los usuarios comentan y dan
 * like.
 *
 * Escribir articulos es cosa de administradores, asi que cada operacion sobre
 * un articulo lo comprueba contra la base de datos. La accion de servidor ya
 * lo mira antes, pero una accion es un endpoint por si misma y la seguridad no
 * puede depender de una sola capa.
 */

export type ResultadoPost =
  { ok: true; postId: string; slug: string } | { ok: false; mensaje: string };
export type ResultadoSimple = { ok: true } | { ok: false; mensaje: string };

async function esAdministrador(userId: string): Promise<boolean> {
  const usuario = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  return usuario?.isAdmin === true;
}

export async function crearPost(userId: string, input: unknown): Promise<ResultadoPost> {
  if (!(await esAdministrador(userId))) {
    return { ok: false, mensaje: 'No tienes permiso para publicar artículos' };
  }

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos' };
  }

  const d = parsed.data;

  const slug = await slugDisponible(d.title, async (candidato) => {
    const ocupado = await db.post.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    return ocupado !== null;
  });

  const post = await db.post.create({
    data: {
      authorId: userId,
      title: d.title,
      slug,
      excerpt: d.excerpt,
      content: d.content,
      // Nace en borrador: publicar es un paso aparte y deliberado.
      status: 'DRAFT',
    },
    select: { id: true, slug: true },
  });

  return { ok: true, postId: post.id, slug: post.slug };
}

export async function actualizarPost(
  userId: string,
  postId: string,
  input: unknown,
): Promise<ResultadoPost> {
  if (!(await esAdministrador(userId))) {
    return { ok: false, mensaje: 'No tienes permiso' };
  }

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos' };
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { slug: true },
  });

  if (!post) return { ok: false, mensaje: 'Ese artículo no existe' };

  const d = parsed.data;

  // El slug no se regenera al cambiar el titulo: es la direccion publica del
  // articulo y cambiarla romperia los enlaces que ya haya por ahi.
  await db.post.update({
    where: { id: postId },
    data: { title: d.title, excerpt: d.excerpt, content: d.content },
  });

  return { ok: true, postId, slug: post.slug };
}

/**
 * Publica un articulo.
 *
 * `publishedAt` se escribe **una sola vez**: es la fecha en que el articulo
 * vio la luz, no la del ultimo cambio de estado. Retirarlo y volver a
 * publicarlo no lo rejuvenece.
 */
export async function publicarPost(
  userId: string,
  postId: string,
): Promise<ResultadoSimple> {
  if (!(await esAdministrador(userId))) {
    return { ok: false, mensaje: 'No tienes permiso' };
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { publishedAt: true },
  });

  if (!post) return { ok: false, mensaje: 'Ese artículo no existe' };

  await db.post.update({
    where: { id: postId },
    data: {
      status: 'PUBLISHED',
      publishedAt: post.publishedAt ?? new Date(),
    },
  });

  return { ok: true };
}

/** Retira un articulo del blog. Los comentarios y los likes se conservan. */
export async function despublicarPost(
  userId: string,
  postId: string,
): Promise<ResultadoSimple> {
  if (!(await esAdministrador(userId))) {
    return { ok: false, mensaje: 'No tienes permiso' };
  }

  const post = await db.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return { ok: false, mensaje: 'Ese artículo no existe' };

  await db.post.update({ where: { id: postId }, data: { status: 'DRAFT' } });

  return { ok: true };
}

/**
 * Borra un articulo con sus comentarios y sus likes.
 *
 * Es irreversible y se lleva por delante lo que escribio otra gente, asi que
 * solo se ofrece sobre borradores: lo que ya se publico se retira, no se
 * destruye.
 */
export async function borrarPost(
  userId: string,
  postId: string,
): Promise<ResultadoSimple> {
  if (!(await esAdministrador(userId))) {
    return { ok: false, mensaje: 'No tienes permiso' };
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { status: true, coverUrl: true },
  });

  if (!post) return { ok: false, mensaje: 'Ese artículo no existe' };

  if (post.status === 'PUBLISHED') {
    return {
      ok: false,
      mensaje: 'Retira primero el artículo del blog: lo publicado no se borra de golpe',
    };
  }

  // Comment y PostLike cuelgan de Post con onDelete: Cascade.
  await db.post.delete({ where: { id: postId } });
  await borrarSiEsNuestra(post.coverUrl);

  return { ok: true };
}

export type ResultadoPortada = { ok: true; url: string } | { ok: false; mensaje: string };

export async function subirPortada(
  userId: string,
  postId: string,
  file: File,
): Promise<ResultadoPortada> {
  if (!(await esAdministrador(userId))) {
    return { ok: false, mensaje: 'No tienes permiso' };
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { coverUrl: true },
  });

  if (!post) return { ok: false, mensaje: 'Ese artículo no existe' };

  const subida = await subirImagen(`blog/${postId}`, file);
  if (!subida.ok) return subida;

  await db.post.update({ where: { id: postId }, data: { coverUrl: subida.url } });
  await borrarSiEsNuestra(post.coverUrl);

  return { ok: true, url: subida.url };
}

/**
 * El usuario comenta un articulo.
 *
 * Solo se comenta lo publicado: un borrador no existe para nadie de fuera, y
 * comentarlo dejaria mensajes colgando de algo que quiza nunca se publique.
 */
export async function comentar(
  userId: string,
  postId: string,
  input: unknown,
): Promise<ResultadoSimple> {
  const parsed = comentarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      mensaje: parsed.error.issues[0]?.message ?? 'Revisa el comentario',
    };
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { status: true },
  });

  if (!post || post.status !== 'PUBLISHED') {
    return { ok: false, mensaje: 'Ese artículo no admite comentarios' };
  }

  await db.comment.create({ data: { postId, userId, body: parsed.data.body } });

  return { ok: true };
}

export async function borrarComentario(
  quien: { id: string; esAdmin: boolean },
  commentId: string,
): Promise<ResultadoSimple> {
  const comentario = await db.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comentario) return { ok: false, mensaje: 'Ese comentario ya no existe' };

  if (!puedeBorrarComentario({ autorId: comentario.userId }, quien)) {
    return { ok: false, mensaje: 'Ese comentario no es tuyo' };
  }

  await db.comment.delete({ where: { id: commentId } });

  return { ok: true };
}

export type ResultadoLike =
  { ok: true; gustado: boolean } | { ok: false; mensaje: string };

/**
 * Da o quita el like de un usuario sobre un articulo.
 *
 * La clave primaria es `(postId, userId)`, asi que un usuario no puede dar dos
 * veces like por mucho que pulse: la base de datos no se lo permite.
 */
export async function alternarLike(
  userId: string,
  postId: string,
): Promise<ResultadoLike> {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { status: true },
  });

  if (!post || post.status !== 'PUBLISHED') {
    return { ok: false, mensaje: 'Ese artículo no está publicado' };
  }

  const clave = { postId_userId: { postId, userId } };

  const existente = await db.postLike.findUnique({
    where: clave,
    select: { postId: true },
  });

  if (existente) {
    await db.postLike.delete({ where: clave });
    return { ok: true, gustado: false };
  }

  await db.postLike.create({ data: { postId, userId } });
  return { ok: true, gustado: true };
}
