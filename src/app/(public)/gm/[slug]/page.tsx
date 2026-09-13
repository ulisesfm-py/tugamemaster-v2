import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar, Estrellas, Etiqueta, Fecha, Precio } from '@/components/ui';
import { perfilPublicoGm } from '@/modules/profiles/queries';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const perfil = await perfilPublicoGm(slug);

  if (!perfil) return { title: 'Game master no encontrado · TuGameMaster' };

  return {
    title: `${perfil.user.name} · TuGameMaster`,
    description: perfil.gm.headline ?? undefined,
  };
}

export default async function GmPage({ params }: Props) {
  const { slug } = await params;
  const perfil = await perfilPublicoGm(slug);

  if (!perfil) notFound();

  const { user, gm, reputacion, resenas, proximasPartidas } = perfil;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="flex flex-wrap items-start gap-5">
        <Avatar src={user.image} nombre={user.name} tamano={80} />

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {user.name}
          </h1>
          {gm.headline && (
            <p className="mt-1 text-slate-600 dark:text-slate-400">{gm.headline}</p>
          )}
          <div className="mt-3">
            <Estrellas
              valor={reputacion.valoracionMedia}
              total={reputacion.totalResenas}
            />
          </div>
        </div>
      </header>

      {/* Requisito de CLAUDE.md: dejar claro que la reputacion certifica
          partidas gestionadas por la plataforma, no partidas cualesquiera. */}
      <section className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
          Reputación verificada por TuGameMaster
        </p>
        <p className="mt-1 text-sm text-indigo-800/80 dark:text-indigo-300/80">
          {reputacion.partidasDirigidas === 0
            ? 'Todavía no ha dirigido partidas reservadas a través de la plataforma.'
            : reputacion.partidasDirigidas === 1
              ? 'Ha dirigido 1 partida reservada y pagada a través de la web.'
              : `Ha dirigido ${reputacion.partidasDirigidas} partidas reservadas y pagadas a través de la web.`}{' '}
          Las estrellas y el recuento proceden únicamente de esas partidas: solo puede
          valorar quien pagó su asiento aquí.
        </p>
      </section>

      {gm.languages.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Dirige en:</span>
          {gm.languages.map((l) => (
            <Etiqueta key={l}>{l.toUpperCase()}</Etiqueta>
          ))}
        </div>
      )}

      {gm.about && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Cómo dirige
          </h2>
          <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-300">
            {gm.about}
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Próximas partidas
        </h2>

        {proximasPartidas.length === 0 ? (
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            No tiene partidas abiertas ahora mismo.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {proximasPartidas.map((p) => {
              const libres = p.seatsTotal - p._count.bookings;

              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {p.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {p.system} · <Fecha valor={p.startsAt} />
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    <Precio cents={p.priceCents} currency={p.currency} /> por plaza ·{' '}
                    {libres > 0 ? `${libres} libres` : 'completa'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Reseñas
        </h2>

        {resenas.length === 0 ? (
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Todavía no tiene reseñas.
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {resenas.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={r.author.image} nombre={r.author.name} tamano={32} />
                  <div className="min-w-0">
                    <Link
                      href={`/u/${r.author.slug}`}
                      className="text-sm font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {r.author.name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {r.game.title}
                    </p>
                  </div>
                  <span
                    aria-label={`${r.rating} de 5`}
                    className="ml-auto text-amber-500"
                  >
                    {'★'.repeat(r.rating)}
                  </span>
                </div>

                {r.comment && (
                  <p className="mt-3 text-slate-700 dark:text-slate-300">{r.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
