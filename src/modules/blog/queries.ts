import 'server-only';

import { db } from '@/lib/db';

/**
 * Consultas del blog.
 */

/** Articulos publicados, del mas reciente al mas antiguo. */
export async function listarPosts(limite = 30) {
  return db.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: limite,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverUrl: true,
      publishedAt: true,
      author: { select: { name: true, slug: true, image: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });
}

/**
 * Un articulo con sus comentarios.
 *
 * Un borrador solo lo ve un administrador, para poder revisarlo antes de
 * publicarlo. Para el resto no existe.
 */
export async function detallePost(
  slug: string,
  quien?: { id: string; esAdmin: boolean },
) {
  const post = await db.post.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      excerpt: true,
      content: true,
      coverUrl: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      author: { select: { name: true, slug: true, image: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        take: 200,
        select: {
          id: true,
          body: true,
          createdAt: true,
          userId: true,
          user: { select: { name: true, slug: true, image: true } },
        },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!post) return null;
  if (post.status !== 'PUBLISHED' && !quien?.esAdmin) return null;

  const gustado = quien
    ? (await db.postLike.findUnique({
        where: { postId_userId: { postId: post.id, userId: quien.id } },
        select: { postId: true },
      })) !== null
    : false;

  return { ...post, gustado };
}

/** Todos los articulos, para el panel de administracion. */
export async function postsParaAdmin(limite = 100) {
  return db.post.findMany({
    // Los borradores primero: son los que estan esperando algo.
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    take: limite,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });
}

/** Un articulo concreto para el formulario de edicion. */
export async function postParaEditar(postId: string) {
  return db.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverUrl: true,
      status: true,
      publishedAt: true,
      _count: { select: { comments: true, likes: true } },
    },
  });
}
