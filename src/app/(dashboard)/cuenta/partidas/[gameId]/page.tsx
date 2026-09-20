import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ImagenForm } from '@/components/imagen-form';
import { NotaSesion } from '@/components/nota-sesion';
import { PartidaForm } from '@/components/partida-form';
import { ReservarBoton } from '@/components/reservar-boton';
import { Avatar, Fecha } from '@/components/ui';
import { auth } from '@/lib/auth';
import { jugadoresDe } from '@/modules/bookings/queries';
import { guardarNotaAction } from '@/modules/campaigns/actions';
import { partidaTerminada } from '@/modules/campaigns/politica';
import {
  actualizarPartidaAction,
  cancelarPartidaAction,
  despublicarPartidaAction,
  publicarPartidaAction,
  subirLaminaAction,
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

  // `partidaTerminada` acepta tambien una publicada cuya hora de fin ya paso:
  // el GM puede anotar como acabo nada mas levantarse de la mesa, sin esperar
  // a que el cron la cierre de madrugada.
  const terminada = partidaTerminada(partida.status, partida.endsAt);
  const pagadas = partida._count.bookings;

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
            campos={{ gameId: partida.id, slug: partida.slug }}
          />
        )}

        {partida.status === 'PUBLISHED' && (
          <ReservarBoton
            accion={despublicarPartidaAction}
            texto="Retirar del portal"
            destructivo
            campos={{ gameId: partida.id, slug: partida.slug }}
          />
        )}

        {editable && (
          <div>
            <ReservarBoton
              accion={cancelarPartidaAction}
              texto="Cancelar partida"
              destructivo
              campos={{ gameId: partida.id, slug: partida.slug }}
            />
            {pagadas > 0 && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Se devolverá el 100% en saldo a {pagadas}{' '}
                {pagadas === 1 ? 'jugador' : 'jugadores'}. No se puede deshacer.
              </p>
            )}
          </div>
        )}
      </section>

      {partida.campaign && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Sesión {partida.sessionNumber} de la campaña{' '}
          <Link
            href={`/campanas/${partida.campaign.slug}`}
            className="text-indigo-600 hover:underline"
          >
            {partida.campaign.title}
          </Link>
        </p>
      )}

      {terminada && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Cómo acabó la sesión
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Te servirá de plantilla para montar la siguiente, y a tus jugadores para
            recordar dónde se quedaron.
          </p>

          <div className="mt-4">
            <NotaSesion
              gameId={partida.id}
              accion={guardarNotaAction}
              contenido={partida.sessionNote?.content ?? null}
            />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            {partida.nextGame ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ya has creado la continuación:{' '}
                <Link
                  href={`/cuenta/partidas/${partida.nextGame.id}`}
                  className="text-indigo-600 hover:underline"
                >
                  {partida.nextGame.title}
                </Link>
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  ¿Seguís la historia otro día?
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  La siguiente sesión solo la podrán reservar quienes jugaron esta.
                </p>
                <Link
                  href={`/cuenta/partidas/${partida.id}/continuacion`}
                  className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                >
                  Crear la siguiente sesión
                </Link>
              </>
            )}
          </div>
        </section>
      )}

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
            Lámina
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Es lo primero que se ve de tu partida en el portal. Sin ella se compone una
            con el nombre del sistema, que cumple pero no llama.
          </p>

          <div className="mt-4">
            <ImagenForm
              accion={subirLaminaAction}
              campo="lamina"
              campos={{ gameId: partida.id, slug: partida.slug }}
              textoBoton={partida.imageUrl ? 'Cambiar lámina' : 'Subir lámina'}
            />
          </div>
        </section>
      )}

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
