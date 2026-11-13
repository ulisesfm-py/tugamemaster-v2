import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContenidoBlog } from '@/components/blog/contenido';
import { BotonLike } from '@/components/boton-like';
import { ComentarForm } from '@/components/comentar-form';
import { ReservarBoton } from '@/components/reservar-boton';
import { Avatar, Aviso, Fecha } from '@/components/ui';
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
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Cabecera y texto en una columna comoda de leer; la portada, al ancho de
          la cabecera de la web y panoramica. Con 90+ caracteres por linea el ojo
          se pierde, asi que el texto no se ensancha tanto como la imagen. */}
      <div className="mx-auto max-w-[52rem]">
        <Link href="/blog" className="text-muted-foreground text-sm hover:underline">
          ← Blog
        </Link>

        {post.status !== 'PUBLISHED' && (
          <Aviso tono="atencion" className="mt-4" titulo="Esto es un borrador">
            Solo lo ven los administradores.
          </Aviso>
        )}

        <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold text-balance sm:text-4xl">
          {post.title}
        </h1>

        <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Avatar src={post.author.image} nombre={post.author.name} tamano={32} />
          <span>{post.author.name}</span>
          <span>
            · <Fecha valor={post.publishedAt ?? post.createdAt} />
          </span>
        </div>
      </div>

      {post.coverUrl && (
        <Image
          src={post.coverUrl}
          alt=""
          width={1152}
          height={494}
          sizes="(max-width: 1152px) 100vw, 72rem"
          className="mt-8 aspect-[21/9] w-full rounded-sm object-cover"
          priority
        />
      )}

      <div className="mx-auto max-w-[52rem]">
        <ContenidoBlog texto={post.content} className="mt-8" />

        <div className="border-border mt-10 border-t pt-6">
          {session?.user ? (
            <BotonLike
              accion={alternarLikeAction}
              postId={post.id}
              slug={slug}
              gustado={post.gustado}
              total={post._count.likes}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              {post._count.likes} ♥ ·{' '}
              <Link href="/login" className="text-primary hover:underline">
                Entra
              </Link>{' '}
              para dar like o comentar.
            </p>
          )}
        </div>

        <section className="mt-10">
          <h2 className="font-heading text-foreground text-xl font-bold">
            Comentarios ({post.comments.length})
          </h2>

          {post.comments.length > 0 && (
            <ul className="mt-4 flex flex-col gap-4">
              {post.comments.map((comentario) => (
                <li
                  key={comentario.id}
                  className="border-border bg-card rounded-sm border p-4"
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
                        className="text-foreground text-sm font-medium hover:underline"
                      >
                        {comentario.user.name}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        <Fecha valor={comentario.createdAt} />
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mt-3 whitespace-pre-line">
                    {comentario.body}
                  </p>

                  {quien &&
                    puedeBorrarComentario({ autorId: comentario.userId }, quien) && (
                      <div className="mt-3">
                        <ReservarBoton
                          accion={borrarComentarioAction}
                          texto="Retirar"
                          destructivo
                          tamano="sm"
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
                <p className="text-muted-foreground text-sm">
                  <Link href="/login" className="text-primary hover:underline">
                    Inicia sesión
                  </Link>{' '}
                  para dejar un comentario.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
