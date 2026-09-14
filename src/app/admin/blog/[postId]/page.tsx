import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PortadaForm } from '@/components/portada-form';
import { PostForm } from '@/components/post-form';
import { ReservarBoton } from '@/components/reservar-boton';
import { auth } from '@/lib/auth';
import {
  actualizarPostAction,
  borrarPostAction,
  despublicarPostAction,
  publicarPostAction,
  subirPortadaAction,
} from '@/modules/blog/actions';
import { postParaEditar } from '@/modules/blog/queries';

export const metadata: Metadata = { title: 'Editar artículo · Admin' };

type Props = { params: Promise<{ postId: string }> };

export default async function EditarPostPage({ params }: Props) {
  const { postId } = await params;

  const session = await auth();
  if (!session?.user?.isAdmin) notFound();

  const post = await postParaEditar(postId);
  if (!post) notFound();

  const publicado = post.status === 'PUBLISHED';

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/admin/blog"
        className="text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← Artículos
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        {post.title}
      </h1>

      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {publicado ? (
          <>
            Publicado en{' '}
            <Link href={`/blog/${post.slug}`} className="text-indigo-600 hover:underline">
              /blog/{post.slug}
            </Link>
          </>
        ) : (
          <>
            Borrador.{' '}
            <Link href={`/blog/${post.slug}`} className="text-indigo-600 hover:underline">
              Verlo como quedará
            </Link>
          </>
        )}
      </p>

      <section className="mt-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        {publicado ? (
          <ReservarBoton
            accion={despublicarPostAction}
            texto="Retirar del blog"
            destructivo
            campos={{ postId: post.id, slug: post.slug }}
          />
        ) : (
          <ReservarBoton
            accion={publicarPostAction}
            texto="Publicar"
            campos={{ postId: post.id, slug: post.slug }}
          />
        )}

        {/* Borrar solo se ofrece sobre borradores: lo publicado se retira, no
            se destruye, porque se lleva por delante lo que escribio otra gente. */}
        {!publicado && (
          <div>
            <ReservarBoton
              accion={borrarPostAction}
              texto="Borrar"
              destructivo
              campos={{ postId: post.id }}
            />
            {post._count.comments > 0 && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Se borrarán también {post._count.comments}{' '}
                {post._count.comments === 1 ? 'comentario' : 'comentarios'}. No se puede
                deshacer.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Portada
        </h2>

        {post.coverUrl && (
          <Image
            src={post.coverUrl}
            alt=""
            width={640}
            height={260}
            className="mt-3 h-40 w-full rounded-xl object-cover"
          />
        )}

        <div className="mt-4">
          <PortadaForm accion={subirPortadaAction} postId={post.id} slug={post.slug} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Contenido
        </h2>
        <div className="mt-4">
          <PostForm
            accion={actualizarPostAction}
            textoBoton="Guardar cambios"
            valores={post}
          />
        </div>
      </section>
    </main>
  );
}
