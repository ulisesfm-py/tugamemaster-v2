import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar, Etiqueta } from '@/components/ui';
import { perfilPublicoUsuario } from '@/modules/profiles/queries';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const perfil = await perfilPublicoUsuario(slug);

  return {
    title: perfil ? `${perfil.user.name} · TuGameMaster` : 'Perfil no encontrado',
  };
}

export default async function UsuarioPage({ params }: Props) {
  const { slug } = await params;
  const perfil = await perfilPublicoUsuario(slug);

  if (!perfil) notFound();

  const { user, partidasJugadas, esGm } = perfil;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <header className="flex flex-wrap items-start gap-5">
        <Avatar src={user.image} nombre={user.name} tamano={72} />

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {user.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {partidasJugadas === 0
              ? 'Todavía no ha jugado ninguna partida aquí.'
              : `Ha jugado ${partidasJugadas} ${
                  partidasJugadas === 1 ? 'partida' : 'partidas'
                } a través de la plataforma.`}
          </p>

          {esGm && (
            <Link
              href={`/gm/${user.slug}`}
              className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Ver su perfil de game master →
            </Link>
          )}
        </div>
      </header>

      {user.bio && (
        <p className="mt-8 whitespace-pre-line text-slate-700 dark:text-slate-300">
          {user.bio}
        </p>
      )}

      {user.preferredSystems.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Sistemas que le gustan
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.preferredSystems.map((s) => (
              <Etiqueta key={s}>{s}</Etiqueta>
            ))}
          </div>
        </section>
      )}

      {user.preferredStyles.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Estilo de juego
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.preferredStyles.map((s) => (
              <Etiqueta key={s}>{s}</Etiqueta>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
