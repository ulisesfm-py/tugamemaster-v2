import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EnlaceBoton, Estado, Fecha, Vacio } from '@/components/ui';
import { auth } from '@/lib/auth';
import { postsParaAdmin } from '@/modules/blog/queries';

export const metadata: Metadata = { title: 'Blog · Admin' };

export default async function AdminBlogPage() {
  const session = await auth();

  // El middleware ya bloquea /admin, pero se repite aqui: la seguridad no
  // puede depender de una sola capa.
  if (!session?.user?.isAdmin) notFound();

  const posts = await postsParaAdmin();
  const borradores = posts.filter((p) => p.status !== 'PUBLISHED').length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
        ← Administración
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-foreground text-3xl font-extrabold sm:text-4xl">
            Artículos
          </h1>
          <p className="text-muted-foreground mt-2">
            {posts.length === 0
              ? 'Todavía no hay ninguno.'
              : `${posts.length} en total${borradores > 0 ? `, ${borradores} sin publicar` : ''}.`}
          </p>
        </div>

        <EnlaceBoton href="/admin/blog/nuevo">Escribir artículo</EnlaceBoton>
      </div>

      {posts.length === 0 ? (
        <Vacio
          className="mt-8"
          titulo="Todavía no has escrito ninguno"
          accion={<EnlaceBoton href="/admin/blog/nuevo">Escribir el primero</EnlaceBoton>}
        >
          Nace como borrador: podrás verlo como quedará antes de publicarlo.
        </Vacio>
      ) : (
        <ul className="border-border divide-border mt-8 divide-y rounded-sm border">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="text-foreground text-sm font-medium hover:underline"
                >
                  {post.title}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {post.publishedAt ? (
                    <>
                      Publicado el <Fecha valor={post.publishedAt} />
                    </>
                  ) : (
                    <>
                      Editado el <Fecha valor={post.updatedAt} />
                    </>
                  )}{' '}
                  · {post._count.likes} ♥ · {post._count.comments}{' '}
                  {post._count.comments === 1 ? 'comentario' : 'comentarios'}
                </p>
              </div>

              <Estado tono={post.status === 'PUBLISHED' ? 'bien' : 'apagado'}>
                {post.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
              </Estado>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
