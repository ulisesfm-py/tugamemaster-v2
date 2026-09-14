import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { PartidaForm } from '@/components/partida-form';
import { auth } from '@/lib/auth';
import { crearContinuacionAction } from '@/modules/campaigns/actions';
import {
  numeroSiguiente,
  partidaTerminada,
  RESUMEN_MAXIMO,
  tituloDeContinuacion,
} from '@/modules/campaigns/politica';
import { miPartida } from '@/modules/games/queries';

export const metadata: Metadata = { title: 'Siguiente sesión · TuGameMaster' };

type Props = { params: Promise<{ gameId: string }> };

/** Misma hora que la sesion anterior, una semana despues. */
function dentroDeUnaSemana(fecha: Date): Date {
  return new Date(fecha.getTime() + 7 * 86_400_000);
}

export default async function ContinuacionPage({ params }: Props) {
  const { gameId } = await params;

  const session = await auth();
  if (!session?.user) redirect('/login');

  const anterior = await miPartida(session.user.id, gameId);
  if (!anterior) notFound();

  if (!partidaTerminada(anterior.status, anterior.endsAt)) {
    redirect(`/cuenta/partidas/${gameId}`);
  }

  if (anterior.nextGame) redirect(`/cuenta/partidas/${anterior.nextGame.id}`);

  const numero = numeroSiguiente(anterior.sessionNumber);

  // El formulario nace con los datos de la anterior. Todo es editable: son una
  // propuesta, no una imposicion.
  const valores = {
    // El id que viaja en el formulario es el de la partida que se continua:
    // la accion lo necesita para saber de que sesion cuelga la nueva.
    id: anterior.id,
    title: tituloDeContinuacion(anterior.title, numero),
    description: anterior.description,
    system: anterior.system,
    startsAt: dentroDeUnaSemana(anterior.startsAt),
    endsAt: dentroDeUnaSemana(anterior.endsAt),
    // Tantas plazas como gente jugo: la mesa que ya existe. Si el GM quiere
    // abrir hueco para alguien nuevo, lo sube a mano.
    seatsTotal: Math.max(1, anterior._count.bookings),
    priceCents: anterior.priceCents,
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href={`/cuenta/partidas/${anterior.id}`}
        className="text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← {anterior.title}
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Sesión {numero}
      </h1>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Solo podrán reservar plaza {anterior._count.bookings}{' '}
        {anterior._count.bookings === 1 ? 'jugador' : 'jugadores'}: quienes pagaron y
        jugaron la sesión anterior. Nacerá como borrador, así que podrás revisarla antes
        de publicarla.
      </p>

      {anterior.sessionNote && (
        <section className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/40">
          <h2 className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
            Dónde quedó la sesión anterior
          </h2>
          <p className="mt-2 text-sm whitespace-pre-line text-indigo-900/90 dark:text-indigo-100/90">
            {anterior.sessionNote.content}
          </p>
        </section>
      )}

      <div className="mt-8">
        <PartidaForm
          accion={crearContinuacionAction}
          textoBoton="Crear la sesión"
          valores={valores}
          extra={
            <div>
              <label
                htmlFor="campaignSummary"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Sobre la campaña{' '}
                <span className="font-normal text-slate-500">(opcional)</span>
              </label>
              <textarea
                id="campaignSummary"
                name="campaignSummary"
                rows={3}
                maxLength={RESUMEN_MAXIMO}
                defaultValue={anterior.campaign?.summary ?? ''}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900"
                placeholder="De qué va la campaña en dos líneas. Es lo que se ve en su página pública."
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {anterior.campaign
                  ? 'Actualiza la descripción de la campaña. En blanco, se queda la que ya tenía.'
                  : 'Esta es la primera continuación, así que aquí nace la campaña.'}
              </p>
            </div>
          }
        />
      </div>
    </main>
  );
}
