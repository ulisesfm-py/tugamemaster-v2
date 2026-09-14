import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar, Fecha } from '@/components/ui';
import { resumenDe } from '@/modules/blog/politica';
import { listarPosts } from '@/modules/blog/queries';

export const metadata: Metadata = {
  title: 'Blog · TuGameMaster',
  description: 'Artículos sobre dirigir y jugar partidas de rol.',
};

export default async function BlogPage() {
  const posts = await listarPosts();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Blog</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Sobre dirigir, jugar y sentarse a una mesa con desconocidos.
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
          Todavía no hay artículos publicados.
        </p>
      ) : (
        <ul className="mt-10 space-y-8">
          {posts.map((post) => (
            <li
              key={post.id}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
            >
              {post.coverUrl && (
                <Link href={`/blog/${post.slug}`} className="block">
                  <Image
                    src={post.coverUrl}
                    alt=""
                    width={768}
                    height={320}
                    className="h-44 w-full object-cover"
                  />
                </Link>
              )}

              <div className="p-5">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>

                <p className="mt-2 text-slate-700 dark:text-slate-300">
                  {resumenDe(post)}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <Avatar src={post.author.image} nombre={post.author.name} tamano={24} />
                  <span>{post.author.name}</span>
                  {post.publishedAt && (
                    <span>
                      · <Fecha valor={post.publishedAt} />
                    </span>
                  )}
                  <span className="ml-auto">
                    {post._count.likes} ♥ · {post._count.comments}{' '}
                    {post._count.comments === 1 ? 'comentario' : 'comentarios'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
