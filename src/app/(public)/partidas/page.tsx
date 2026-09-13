import type { Metadata } from 'next';

import { PartidaCard } from '@/components/partida-card';
import { listarPartidas, sistemasDisponibles } from '@/modules/games/queries';
import { filtrosSchema } from '@/modules/games/schema';

export const metadata: Metadata = {
  title: 'Partidas · TuGameMaster',
  description: 'Partidas de rol con plazas libres, dirigidas por game masters.',
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const campo =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900';

export default async function PartidasPage({ searchParams }: Props) {
  const params = await searchParams;

  // Los filtros vienen de la URL, que cualquiera puede manipular: se validan
  // igual que cualquier otra entrada. Si algo no cuadra, se ignora en vez de
  // romper la pagina.
  const parsed = filtrosSchema.safeParse({
    q: typeof params['q'] === 'string' ? params['q'] : undefined,
    system: typeof params['system'] === 'string' ? params['system'] : undefined,
    maxPrecio:
      typeof params['maxPrecio'] === 'string' && params['maxPrecio'] !== ''
        ? params['maxPrecio']
        : undefined,
    soloLibres: params['soloLibres'] === '1',
  });

  const filtros = parsed.success ? parsed.data : {};
  const [partidas, sistemas] = await Promise.all([
    listarPartidas(filtros),
    sistemasDisponibles(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Partidas abiertas
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Reserva tu plaza en una mesa dirigida por un game master.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1 block text-xs text-slate-500">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={filtros.q ?? ''}
            placeholder="Título o descripción"
            className={`${campo} w-full`}
          />
        </div>

        <div>
          <label htmlFor="system" className="mb-1 block text-xs text-slate-500">
            Sistema
          </label>
          <select
            id="system"
            name="system"
            defaultValue={filtros.system ?? ''}
            className={campo}
          >
            <option value="">Todos</option>
            {sistemas.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="maxPrecio" className="mb-1 block text-xs text-slate-500">
            Precio máx. (€)
          </label>
          <input
            id="maxPrecio"
            name="maxPrecio"
            type="number"
            min="0"
            step="1"
            defaultValue={filtros.maxPrecio ?? ''}
            className={`${campo} w-28`}
          />
        </div>

        <label className="flex items-center gap-2 py-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            name="soloLibres"
            value="1"
            defaultChecked={filtros.soloLibres ?? false}
            className="rounded border-slate-300"
          />
          Solo con plazas
        </label>

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Filtrar
        </button>
      </form>

      {partidas.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400">
          No hay partidas que encajen con lo que buscas.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {partidas.map((p) => (
            <PartidaCard key={p.id} partida={p} />
          ))}
        </ul>
      )}
    </main>
  );
}
