import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar, Fecha, Precio } from '@/components/ui';
import { campanaPublica } from '@/modules/campaigns/queries';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campana = await campanaPublica(slug);

  if (!campana) return { title: 'Campaña no encontrada · TuGameMaster' };

  return {
    title: `${campana.title} · TuGameMaster`,
    description: campana.summary ?? undefined,
  };
}

const ESTADO_SESION = {
  PUBLISHED: 'Abierta',
  COMPLETED: 'Jugada',
  CANCELLED: 'Cancelada',
  DRAFT: 'Borrador',
} as const;

export default async function CampanaPage({ params }: Props) {
  const { slug } = await params;
  const campana = await campanaPublica(slug);

  if (!campana) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
        {campana.title}
      </h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Campaña de {campana.games.length}{' '}
        {campana.games.length === 1 ? 'sesión' : 'sesiones'}
      </p>

      {campana.summary && (
        <p className="mt-6 whitespace-pre-line text-slate-700 dark:text-slate-300">
          {campana.summary}
        </p>
      )}

      <Link
        href={`/gm/${campana.gm.user.slug}`}
        className="mt-8 flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
      >
        <Avatar src={campana.gm.user.image} nombre={campana.gm.user.name} tamano={44} />
        <span className="min-w-0">
          <span className="block font-medium text-slate-900 dark:text-slate-100">
            {campana.gm.user.name}
          </span>
          {campana.gm.headline && (
            <span className="block text-sm text-slate-600 dark:text-slate-400">
              {campana.gm.headline}
            </span>
          )}
        </span>
      </Link>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Sesiones
        </h2>

        {campana.games.length === 0 ? (
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Todavía no hay sesiones publicadas.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {campana.games.map((sesion) => {
              const libres = sesion.seatsTotal - sesion._count.bookings;

              return (
                <li
                  key={sesion.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {sesion.sessionNumber && (
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Sesión {sesion.sessionNumber}
                      </span>
                    )}
                    <Link
                      href={`/partidas/${sesion.slug}`}
                      className="font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {sesion.title}
                    </Link>
                    <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                      {ESTADO_SESION[sesion.status]}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {sesion.system} · <Fecha valor={sesion.startsAt} />
                  </p>

                  {sesion.status === 'PUBLISHED' && (
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                      <Precio cents={sesion.priceCents} currency={sesion.currency} /> por
                      plaza · {libres > 0 ? `${libres} libres` : 'completa'}
                      {sesion.previousGameId && (
                        <span className="text-slate-500 dark:text-slate-400">
                          {' '}
                          · solo para quienes jugaron la sesión anterior
                        </span>
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Regla de la plataforma, explicada donde importa: al ver la campana. */}
      <p className="mt-8 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        En una campaña, cada sesión nueva está reservada a quienes jugaron la anterior. Tu
        plaza en la mesa se mantiene mientras sigas viniendo.
      </p>
    </main>
  );
}
