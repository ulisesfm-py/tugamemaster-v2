import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ReportarIncidencia } from '@/components/reportar-incidencia';
import { ResenaForm } from '@/components/resena-form';
import { ReservarBoton } from '@/components/reservar-boton';
import { Fecha } from '@/components/ui';
import { auth } from '@/lib/auth';
import { cancelarReservaAction } from '@/modules/bookings/actions';
import { misReservas } from '@/modules/bookings/queries';
import { reportarIncidenciaAction } from '@/modules/incidents/actions';
import { misIncidencias } from '@/modules/incidents/queries';
import { dejarResenaAction, editarResenaAction } from '@/modules/reviews/actions';
import { misResenas } from '@/modules/reviews/queries';

export const metadata: Metadata = { title: 'Mis reservas · TuGameMaster' };

const ESTADO = {
  PENDING: 'Reservada',
  PAID: 'Pagada',
  COMPLETED: 'Jugada',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
  FAILED: 'Pago fallido',
} as const;

export default async function MisReservasPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [{ proximas, pasadas }, incidencias, resenas] = await Promise.all([
    misReservas(session.user.id),
    misIncidencias(session.user.id),
    misResenas(session.user.id),
  ]);

  const porReserva = new Map(incidencias.map((i) => [i.bookingId, i]));
  const resenaDe = new Map(resenas.map((r) => [r.bookingId, r]));

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Mis reservas
      </h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Próximas
        </h2>

        {proximas.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            No tienes ninguna partida próxima.{' '}
            <Link href="/partidas" className="text-indigo-600 hover:underline">
              Busca una mesa
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {proximas.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-200 p-5 dark:border-slate-800"
              >
                <Link
                  href={`/partidas/${r.game.slug}`}
                  className="font-medium text-slate-900 hover:underline dark:text-slate-100"
                >
                  {r.game.title}
                </Link>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {r.game.system} · <Fecha valor={r.game.startsAt} />
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Dirige {r.game.gm.user.name}
                </p>

                <div className="mt-4">
                  <ReservarBoton
                    accion={cancelarReservaAction}
                    texto="Liberar mi plaza"
                    destructivo
                    campos={{ bookingId: r.id, slug: r.game.slug }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pasadas.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Historial
          </h2>

          <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {pasadas.map((r) => {
              const resena = resenaDe.get(r.id);

              return (
                <li key={r.id} className="flex flex-wrap gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/partidas/${r.game.slug}`}
                      className="text-sm font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {r.game.title}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <Fecha valor={r.game.startsAt} />
                    </p>
                  </div>
                  <span className="ml-auto self-center text-xs text-slate-500 dark:text-slate-400">
                    {ESTADO[r.status]}
                  </span>

                  {/* Solo tiene sentido reclamar sobre una partida ya jugada y
                    pagada, y mientras no haya otra incidencia en curso. */}
                  {r.reclamable && (
                    <div className="w-full pt-2">
                      {porReserva.has(r.id) ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Incidencia{' '}
                          {porReserva.get(r.id)?.status === 'OPEN'
                            ? 'en revisión'
                            : porReserva.get(r.id)?.status === 'APPROVED'
                              ? 'aprobada: se te abonó el importe en saldo'
                              : 'desestimada'}
                          {porReserva.get(r.id)?.resolutionNote && (
                            <> · {porReserva.get(r.id)?.resolutionNote}</>
                          )}
                        </p>
                      ) : (
                        <ReportarIncidencia
                          bookingId={r.id}
                          accion={reportarIncidenciaAction}
                        />
                      )}
                    </div>
                  )}

                  {/* Valorar al GM. `valorable` ya excluye las reservas
                    reembolsadas: una incidencia aprobada tiene su cauce y no
                    debe ademas puntuar. */}
                  {(r.valorable || resena) && (
                    <div className="w-full pt-2">
                      {resena ? (
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span aria-hidden className="text-amber-500">
                              {'★'.repeat(resena.rating)}
                            </span>
                            <span className="sr-only">
                              Le pusiste {resena.rating} de 5
                            </span>
                            {resena.comment && (
                              <span className="ml-2 text-slate-600 dark:text-slate-400">
                                {resena.comment}
                              </span>
                            )}
                          </p>

                          {resena.editable && (
                            <ResenaForm
                              accion={editarResenaAction}
                              gmNombre={r.game.gm.user.name}
                              gmSlug={r.game.gm.user.slug}
                              campos={{ reviewId: resena.id }}
                              inicial={{
                                rating: resena.rating,
                                comment: resena.comment,
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <ResenaForm
                          accion={dejarResenaAction}
                          gmNombre={r.game.gm.user.name}
                          gmSlug={r.game.gm.user.slug}
                          campos={{ bookingId: r.id }}
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
