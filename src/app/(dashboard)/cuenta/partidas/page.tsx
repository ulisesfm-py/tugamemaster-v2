import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Fecha, Precio } from '@/components/ui';
import { auth } from '@/lib/auth';
import { misPartidas } from '@/modules/games/queries';

export const metadata: Metadata = { title: 'Mis partidas · TuGameMaster' };

const ETIQUETA_ESTADO = {
  DRAFT: {
    texto: 'Borrador',
    clase: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  PUBLISHED: {
    texto: 'Publicada',
    clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  CANCELLED: {
    texto: 'Cancelada',
    clase: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
  COMPLETED: {
    texto: 'Terminada',
    clase: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
} as const;

export default async function MisPartidasPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const datos = await misPartidas(session.user.id);
  if (!datos) redirect('/cuenta/gm');

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Mis partidas
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Las mesas que diriges.
          </p>
        </div>

        <Link
          href="/cuenta/partidas/nueva"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Nueva partida
        </Link>
      </div>

      {!datos.gm.payoutsEnabled && (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Puedes crear y preparar partidas, pero todavía no publicarlas: falta configurar
          la cuenta donde recibir los pagos, que llegará con la integración de cobros.
        </p>
      )}

      {datos.partidas.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400">
          Todavía no has creado ninguna partida.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {datos.partidas.map((p) => {
            const estado = ETIQUETA_ESTADO[p.status];

            return (
              <li
                key={p.id}
                className="rounded-xl border border-slate-200 transition hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
              >
                <Link href={`/cuenta/partidas/${p.id}`} className="block p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                      {p.title}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${estado.clase}`}
                    >
                      {estado.texto}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {p.system} · <Fecha valor={p.startsAt} />
                  </p>

                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    <Precio cents={p.priceCents} currency={p.currency} /> ·{' '}
                    {p._count.bookings} de {p.seatsTotal} plazas ocupadas
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
