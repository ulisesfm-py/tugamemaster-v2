import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { PartidaForm } from '@/components/partida-form';
import { ReservarBoton } from '@/components/reservar-boton';
import { Avatar, Fecha } from '@/components/ui';
import { auth } from '@/lib/auth';
import { jugadoresDe } from '@/modules/bookings/queries';
import {
  actualizarPartidaAction,
  cancelarPartidaAction,
  despublicarPartidaAction,
  publicarPartidaAction,
} from '@/modules/games/actions';
import { miPartida } from '@/modules/games/queries';

export const metadata: Metadata = { title: 'Gestionar partida · TuGameMaster' };

type Props = { params: Promise<{ gameId: string }> };

export default async function GestionarPartidaPage({ params }: Props) {
  const { gameId } = await params;

  const session = await auth();
  if (!session?.user) redirect('/login');

  const partida = await miPartida(session.user.id, gameId);
  if (!partida) notFound();

  const jugadores = (await jugadoresDe(gameId, session.user.id)) ?? [];
  const editable = partida.status === 'DRAFT' || partida.status === 'PUBLISHED';

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/cuenta/partidas"
        className="text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← Mis partidas
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        {partida.title}
      </h1>

      {partida.status === 'PUBLISHED' && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Publicada en{' '}
          <Link
            href={`/partidas/${partida.slug}`}
            className="text-indigo-600 hover:underline"
          >
            /partidas/{partida.slug}
          </Link>
        </p>
      )}

      <section className="mt-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        {partida.status === 'DRAFT' && (
          <ReservarBoton
            accion={publicarPartidaAction}
            texto="Publicar"
            campos={{ gameId: partida.id }}
          />
        )}

        {partida.status === 'PUBLISHED' && (
          <ReservarBoton
            accion={despublicarPartidaAction}
            texto="Retirar del portal"
            destructivo
            campos={{ gameId: partida.id }}
          />
        )}

        {editable && (
          <ReservarBoton
            accion={cancelarPartidaAction}
            texto="Cancelar partida"
            destructivo
            campos={{ gameId: partida.id }}
          />
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Jugadores ({jugadores.length} de {partida.seatsTotal})
        </h2>

        {jugadores.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Todavía no se ha apuntado nadie.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {jugadores.map((j) => (
              <li key={j.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar src={j.user.image} nombre={j.user.name} tamano={32} />
                <Link
                  href={`/u/${j.user.slug}`}
                  className="text-sm font-medium text-slate-900 hover:underline dark:text-slate-100"
                >
                  {j.user.name}
                </Link>
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                  <Fecha valor={j.createdAt} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editable && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Editar
          </h2>
          <div className="mt-4">
            <PartidaForm
              accion={actualizarPartidaAction}
              textoBoton="Guardar cambios"
              valores={partida}
            />
          </div>
        </section>
      )}
    </main>
  );
}
