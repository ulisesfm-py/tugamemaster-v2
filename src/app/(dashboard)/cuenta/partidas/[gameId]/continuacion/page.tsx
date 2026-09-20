import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { PartidaForm } from '@/components/partida-form';
import { Campo, CLASE_CONTROL } from '@/components/ui';
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
    // La ficha tecnica se hereda entera: es la misma mesa, la misma gente y el
    // mismo tono. Todo sigue siendo editable.
    languages: anterior.languages,
    experience: anterior.experience,
    minAge: anterior.minAge,
    tags: anterior.tags,
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/cuenta/partidas/${anterior.id}`}
        className="text-muted-foreground text-sm hover:underline"
      >
        ← {anterior.title}
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold">
        Sesión {numero}
      </h1>

      <p className="text-muted-foreground mt-2 text-sm">
        Solo podrán reservar plaza {anterior._count.bookings}{' '}
        {anterior._count.bookings === 1 ? 'jugador' : 'jugadores'}: quienes pagaron y
        jugaron la sesión anterior. Nacerá como borrador, así que podrás revisarla antes
        de publicarla.
      </p>

      {anterior.sessionNote && (
        <section className="border-accent/30 bg-accent/5 mt-8 rounded-sm border p-5">
          <h2 className="font-heading text-accent text-base font-bold">
            Dónde quedó la sesión anterior
          </h2>
          <p className="text-foreground/90 mt-2 text-sm whitespace-pre-line">
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
            <Campo
              id="campaignSummary"
              etiqueta="Sobre la campaña"
              opcional
              ayuda={
                anterior.campaign
                  ? 'Actualiza la descripción de la campaña. En blanco, se queda la que ya tenía.'
                  : 'Esta es la primera continuación, así que aquí nace la campaña.'
              }
            >
              <textarea
                id="campaignSummary"
                name="campaignSummary"
                rows={3}
                maxLength={RESUMEN_MAXIMO}
                defaultValue={anterior.campaign?.summary ?? ''}
                className={CLASE_CONTROL}
                placeholder="De qué va la campaña en dos líneas. Es lo que se ve en su página pública."
              />
            </Campo>
          }
        />
      </div>
    </main>
  );
}
