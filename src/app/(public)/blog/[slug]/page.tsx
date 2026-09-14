import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BotonLike } from '@/components/boton-like';
import { ComentarForm } from '@/components/comentar-form';
import { ReservarBoton } from '@/components/reservar-boton';
import { Avatar, Fecha } from '@/components/ui';
import { auth } from '@/lib/auth';
import {
  alternarLikeAction,
  borrarComentarioAction,
  comentarAction,
} from '@/modules/blog/actions';
import { puedeBorrarComentario, resumenDe } from '@/modules/blog/politica';
import { detallePost } from '@/modules/blog/queries';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await detallePost(slug);

  if (!post) return { title: 'Artículo no encontrado · TuGameMaster' };

  return {
    title: `${post.title} · TuGameMaster`,
    description: resumenDe(post, 160),
  };
}

export default async function ArticuloPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const quien = session?.user
    ? { id: session.user.id, esAdmin: session.user.isAdmin === true }
    : undefined;

  const post = await detallePost(slug, quien);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/blog"
        className="text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← Blog
      </Link>

      {post.status !== 'PUBLISHED' && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Este artículo es un borrador. Solo lo ven los administradores.
        </p>
      )}

      <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-50">
        {post.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Avatar src={post.author.image} nombre={post.author.name} tamano={32} />
        <span>{post.author.name}</span>
        <span>
          · <Fecha valor={post.publishedAt ?? post.createdAt} />
        </span>
      </div>

      {post.coverUrl && (
        <Image
          src={post.coverUrl}
          alt=""
          width={768}
          height={400}
          className="mt-8 w-full rounded-xl object-cover"
          priority
        />
      )}

      {/* Texto plano: se respetan los saltos de linea y no se interpreta
          ninguna marca. Ver modules/blog/schema.ts. */}
      <article className="mt-8 leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
        {post.content}
      </article>

      <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
        {session?.user ? (
          <BotonLike
            accion={alternarLikeAction}
            postId={post.id}
            slug={slug}
            gustado={post.gustado}
            total={post._count.likes}
          />
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {post._count.likes} ♥ ·{' '}
            <Link href="/login" className="text-indigo-600 hover:underline">
              Entra
            </Link>{' '}
            para dar like o comentar.
          </p>
        )}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Comentarios ({post.comments.length})
        </h2>

        {post.comments.length > 0 && (
          <ul className="mt-4 space-y-5">
            {post.comments.map((comentario) => (
              <li
                key={comentario.id}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={comentario.user.image}
                    nombre={comentario.user.name}
                    tamano={32}
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/u/${comentario.user.slug}`}
                      className="text-sm font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {comentario.user.name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <Fecha valor={comentario.createdAt} />
                    </p>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line text-slate-700 dark:text-slate-300">
                  {comentario.body}
                </p>

                {quien &&
                  puedeBorrarComentario({ autorId: comentario.userId }, quien) && (
                    <div className="mt-3">
                      <ReservarBoton
                        accion={borrarComentarioAction}
                        texto="Retirar"
                        destructivo
                        campos={{ commentId: comentario.id, slug }}
                      />
                    </div>
                  )}
              </li>
            ))}
          </ul>
        )}

        {post.status === 'PUBLISHED' && (
          <div className="mt-6">
            {session?.user ? (
              <ComentarForm accion={comentarAction} postId={post.id} slug={slug} />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <Link href="/login" className="text-indigo-600 hover:underline">
                  Inicia sesión
                </Link>{' '}
                para dejar un comentario.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
