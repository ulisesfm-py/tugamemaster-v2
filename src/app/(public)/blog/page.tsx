import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar, Fecha, Vacio } from '@/components/ui';
import { resumenDe } from '@/modules/blog/politica';
import { listarPosts } from '@/modules/blog/queries';

export const metadata: Metadata = {
  title: 'Blog · TuGameMaster',
  description: 'Artículos sobre dirigir y jugar partidas de rol.',
};

export default async function BlogPage() {
  const posts = await listarPosts();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-foreground text-3xl font-extrabold sm:text-4xl">
        Blog
      </h1>
      <p className="text-muted-foreground mt-2">
        Sobre dirigir, jugar y sentarse a una mesa con desconocidos.
      </p>

      {posts.length === 0 ? (
        <Vacio className="mt-8" titulo="Todavía no hay artículos publicados">
          Cuando escribamos el primero, aparecerá aquí.
        </Vacio>
      ) : (
        <ul className="mt-8 flex flex-col gap-6">
          {posts.map((post) => (
            <li
              key={post.id}
              className="border-border bg-card hover:border-primary overflow-hidden rounded-sm border transition"
            >
              {post.coverUrl && (
                <Link href={`/blog/${post.slug}`} className="block">
                  <Image
                    src={post.coverUrl}
                    alt=""
                    width={768}
                    height={320}
                    sizes="(max-width: 768px) 100vw, 48rem"
                    className="h-44 w-full object-cover"
                  />
                </Link>
              )}

              <div className="p-5">
                <h2 className="font-heading text-foreground text-xl font-bold text-balance">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {post.title}
                  </Link>
                </h2>

                <p className="text-muted-foreground mt-2">{resumenDe(post)}</p>

                <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-2 text-xs">
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
