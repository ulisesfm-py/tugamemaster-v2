import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Fecha } from '@/components/ui';
import { auth } from '@/lib/auth';
import { postsParaAdmin } from '@/modules/blog/queries';

export const metadata: Metadata = { title: 'Blog · Admin' };

export default async function AdminBlogPage() {
  const session = await auth();

  // El middleware ya bloquea /admin, pero se repite aqui: la seguridad no
  // puede depender de una sola capa.
  if (!session?.user?.isAdmin) notFound();

  const posts = await postsParaAdmin();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Artículos
        </h1>
        <Link
          href="/admin/blog/nuevo"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Escribir artículo
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
          Todavía no has escrito ninguno.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="font-medium text-slate-900 hover:underline dark:text-slate-100"
                >
                  {post.title}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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

              <span
                className={`ml-auto rounded-full px-2.5 py-1 text-xs font-medium ${
                  post.status === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {post.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
