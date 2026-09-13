import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReservarBoton } from '@/components/reservar-boton';
import { Avatar, Etiqueta, Fecha, Precio } from '@/components/ui';
import { auth } from '@/lib/auth';
import { cancelarReservaAction, reservarAction } from '@/modules/bookings/actions';
import { detallePartida } from '@/modules/games/queries';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: Pick<Props, 'params'>): Promise<Metadata> {
  const { slug } = await params;
  const partida = await detallePartida(slug);

  if (!partida) return { title: 'Partida no encontrada · TuGameMaster' };

  return {
    title: `${partida.title} · TuGameMaster`,
    description: partida.description.slice(0, 160),
  };
}

export default async function PartidaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const params_ = await searchParams;
  const session = await auth();
  const partida = await detallePartida(slug, session?.user.id);

  if (!partida) notFound();

  // Un borrador solo lo ve su autor: para el resto, no existe.
  if (partida.status !== 'PUBLISHED' && !partida.esMia) notFound();

  const reservaActiva =
    partida.miReserva &&
    ['PENDING', 'PAID', 'COMPLETED'].includes(partida.miReserva.status)
      ? partida.miReserva
      : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {params_['pago'] === 'ok' && (
        <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          Pago recibido. Tu plaza está confirmada; la verás también en Mis reservas.
        </p>
      )}

      {params_['pago'] === 'cancelado' && (
        <p className="mb-6 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          No has completado el pago. Tu plaza sigue guardada unos minutos por si quieres
          intentarlo de nuevo.
        </p>
      )}

      {partida.status === 'DRAFT' && (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Esta partida es un borrador. Solo tú puedes verla.
        </p>
      )}

      {partida.status === 'CANCELLED' && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
          Esta partida fue cancelada.
        </p>
      )}

      {partida.campaign && (
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Campaña: {partida.campaign.title}
          {partida.sessionNumber ? ` · Sesión ${partida.sessionNumber}` : ''}
        </p>
      )}

      <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
        {partida.title}
      </h1>

      <p className="mt-2 text-slate-600 dark:text-slate-400">
        {partida.system} · <Fecha valor={partida.startsAt} />
      </p>

      <Link
        href={`/gm/${partida.gm.user.slug}`}
        className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
      >
        <Avatar src={partida.gm.user.image} nombre={partida.gm.user.name} tamano={44} />
        <span className="min-w-0">
          <span className="block font-medium text-slate-900 dark:text-slate-100">
            {partida.gm.user.name}
          </span>
          {partida.gm.headline && (
            <span className="block text-sm text-slate-600 dark:text-slate-400">
              {partida.gm.headline}
            </span>
          )}
        </span>
      </Link>

      <section className="mt-8">
        <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">
          {partida.description}
        </p>
      </section>

      {partida.gm.languages.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Se juega en:</span>
          {partida.gm.languages.map((l) => (
            <Etiqueta key={l}>{l.toUpperCase()}</Etiqueta>
          ))}
        </div>
      )}

      <section className="mt-10 rounded-xl border border-slate-200 p-5 dark:border-slate-800">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            <Precio cents={partida.priceCents} currency={partida.currency} />
            <span className="ml-1 text-sm font-normal text-slate-500">por plaza</span>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {partida.plazasLibres > 0
              ? `${partida.plazasLibres} de ${partida.seatsTotal} plazas libres`
              : 'Sin plazas libres'}
          </p>
        </div>

        <div className="mt-5">
          {partida.esMia ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Es tu partida.{' '}
              <Link
                href={`/cuenta/partidas/${partida.id}`}
                className="text-indigo-600 hover:underline"
              >
                Gestionarla
              </Link>
            </p>
          ) : !session?.user ? (
            <Link
              href="/login"
              className="inline-block rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500"
            >
              Inicia sesión para reservar
            </Link>
          ) : reservaActiva ? (
            <>
              <p className="mb-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Tienes una plaza reservada.
              </p>
              <ReservarBoton
                accion={cancelarReservaAction}
                texto="Liberar mi plaza"
                destructivo
                campos={{ bookingId: reservaActiva.id, slug: partida.slug }}
              />
            </>
          ) : !partida.puedeContinuar ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Esta sesión es la continuación de{' '}
              {partida.previousGame ? (
                <Link
                  href={`/partidas/${partida.previousGame.slug}`}
                  className="text-indigo-600 hover:underline"
                >
                  {partida.previousGame.title}
                </Link>
              ) : (
                'otra partida'
              )}
              , y solo pueden apuntarse quienes jugaron aquella.
            </p>
          ) : partida.plazasLibres <= 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No quedan plazas. Si alguien libera la suya, aparecerá aquí.
            </p>
          ) : partida.status !== 'PUBLISHED' ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Esta partida no admite reservas.
            </p>
          ) : (
            <>
              <ReservarBoton
                accion={reservarAction}
                texto="Reservar plaza"
                campos={{ gameId: partida.id, slug: partida.slug }}
              />
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {partida.priceCents === 0
                  ? 'Esta partida es gratuita.'
                  : 'Te llevaremos a la pantalla de pago de Stripe. Guardamos tu plaza 20 minutos mientras pagas.'}
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
