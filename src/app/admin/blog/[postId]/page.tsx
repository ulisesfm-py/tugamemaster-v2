import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ImagenForm } from '@/components/imagen-form';
import { PostForm } from '@/components/post-form';
import { ReservarBoton } from '@/components/reservar-boton';
import { Estado } from '@/components/ui';
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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/admin/blog" className="text-muted-foreground text-sm hover:underline">
        ← Artículos
      </Link>

      <div className="mt-4 flex flex-wrap items-start gap-x-3 gap-y-2">
        <h1 className="font-heading text-foreground min-w-0 flex-1 text-3xl font-extrabold text-balance">
          {post.title}
        </h1>
        <Estado tono={publicado ? 'bien' : 'apagado'} className="mt-1.5">
          {publicado ? 'Publicado' : 'Borrador'}
        </Estado>
      </div>

      <p className="text-muted-foreground mt-2 text-sm">
        {publicado ? (
          <>
            Cualquiera puede leerlo.{' '}
            <Link href={`/blog/${post.slug}`} className="text-primary hover:underline">
              Verlo en el blog
            </Link>
          </>
        ) : (
          <>
            Nadie lo ve todavía.{' '}
            <Link href={`/blog/${post.slug}`} className="text-primary hover:underline">
              Verlo como quedará
            </Link>
          </>
        )}
      </p>

      {!publicado && (
        <section className="border-border bg-card mt-6 rounded-sm border p-5">
          <p className="text-foreground font-medium">Listo para publicar</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Podrás retirarlo después si hace falta. La dirección ya no cambia.
          </p>
          <div className="mt-4">
            <ReservarBoton
              accion={publicarPostAction}
              texto="Publicar"
              campos={{ postId: post.id, slug: post.slug }}
            />
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-heading text-foreground text-xl font-bold">Portada</h2>

        {post.coverUrl && (
          <Image
            src={post.coverUrl}
            alt=""
            width={640}
            height={260}
            sizes="(max-width: 672px) 100vw, 42rem"
            className="mt-4 h-40 w-full rounded-sm object-cover"
          />
        )}

        <div className="mt-4">
          <ImagenForm
            accion={subirPortadaAction}
            campo="portada"
            campos={{ postId: post.id, slug: post.slug }}
            textoBoton={post.coverUrl ? 'Cambiar portada' : 'Subir portada'}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-foreground text-xl font-bold">Contenido</h2>
        <div className="mt-4">
          <PostForm
            accion={actualizarPostAction}
            textoBoton="Guardar cambios"
            valores={post}
          />
        </div>
      </section>

      {/* Lo que no tiene vuelta atras, al final y aparte. */}
      <section
        aria-labelledby="zona-de-riesgo"
        className="border-destructive/30 mt-12 rounded-sm border border-dashed p-5"
      >
        {/* Una palabra: el detalle lo lleva el boton, y repetir "retirar del
            blog" dos veces seguidas no aclara nada. */}
        <h2
          id="zona-de-riesgo"
          className="font-heading text-foreground text-base font-bold"
        >
          {publicado ? 'Retirar' : 'Borrar'}
        </h2>

        {publicado ? (
          <div className="mt-4">
            <ReservarBoton
              accion={despublicarPostAction}
              texto="Retirar del blog"
              destructivo
              tamano="sm"
              campos={{ postId: post.id, slug: post.slug }}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              Vuelve a borrador y deja de verse. Los comentarios se conservan.
            </p>
          </div>
        ) : (
          /* Borrar solo se ofrece sobre borradores: lo publicado se retira, no
             se destruye, porque se lleva por delante lo que escribio otra
             gente. */
          <div className="mt-4">
            <ReservarBoton
              accion={borrarPostAction}
              texto="Borrar"
              destructivo
              tamano="sm"
              campos={{ postId: post.id }}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              {post._count.comments > 0 ? (
                <>
                  Se borrarán también {post._count.comments}{' '}
                  {post._count.comments === 1 ? 'comentario' : 'comentarios'}. No se puede
                  deshacer.
                </>
              ) : (
                'No se puede deshacer.'
              )}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
