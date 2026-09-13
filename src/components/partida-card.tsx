import Link from 'next/link';

import { Avatar, Fecha, Precio } from '@/components/ui';

/** Tarjeta de partida del listado publico y del perfil de GM. */
export function PartidaCard({
  partida,
}: {
  partida: {
    title: string;
    slug: string;
    system: string;
    startsAt: Date;
    seatsTotal: number;
    priceCents: number;
    currency: string;
    gm: { user: { name: string; slug: string; image: string | null } };
    _count: { bookings: number };
  };
}) {
  const libres = partida.seatsTotal - partida._count.bookings;

  return (
    <li className="rounded-xl border border-slate-200 transition hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700">
      <Link href={`/partidas/${partida.slug}`} className="block p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {partida.title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {partida.system} · <Fecha valor={partida.startsAt} />
            </p>
          </div>

          <p className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
            <Precio cents={partida.priceCents} currency={partida.currency} />
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2">
            <Avatar
              src={partida.gm.user.image}
              nombre={partida.gm.user.name}
              tamano={24}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {partida.gm.user.name}
            </span>
          </span>

          <span
            className={`ml-auto rounded-full px-2.5 py-1 text-xs font-medium ${
              libres > 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {libres > 0
              ? `${libres} ${libres === 1 ? 'plaza libre' : 'plazas libres'}`
              : 'Completa'}
          </span>
        </div>
      </Link>
    </li>
  );
}
