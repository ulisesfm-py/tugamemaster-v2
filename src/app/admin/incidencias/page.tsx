import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReservarBoton } from '@/components/reservar-boton';
import { ResolverIncidencia } from '@/components/resolver-incidencia';
import { Fecha } from '@/components/ui';
import { auth } from '@/lib/auth';
import {
  aprobarIncidenciaAction,
  devolverADineroAction,
  rechazarIncidenciaAction,
} from '@/modules/incidents/actions';
import { incidenciasParaAdmin } from '@/modules/incidents/queries';
import { formatearImporte } from '@/modules/payments/dinero';

export const metadata: Metadata = { title: 'Incidencias · Admin' };

const ESTADO = {
  OPEN: {
    texto: 'Abierta',
    clase: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  APPROVED: {
    texto: 'Aprobada',
    clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  REJECTED: {
    texto: 'Desestimada',
    clase: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
} as const;

export default async function IncidenciasPage() {
  const session = await auth();

  // El middleware ya bloquea /admin, pero se repite aqui: la seguridad no
  // puede depender de una sola capa.
  if (!session?.user?.isAdmin) notFound();

  const incidencias = await incidenciasParaAdmin();
  const abiertas = incidencias.filter((i) => i.status === 'OPEN');

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Incidencias
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {abiertas.length === 0
          ? 'No hay ninguna pendiente.'
          : `${abiertas.length} pendiente${abiertas.length === 1 ? '' : 's'} de revisar. Cada una detiene el pago al game master de su partida.`}
      </p>

      {incidencias.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400">
          Todavía no se ha reportado ninguna incidencia.
        </p>
      ) : (
        <ul className="mt-8 space-y-5">
          {incidencias.map((i) => {
            const estado = ESTADO[i.status];
            const pagadoConTarjeta = i.booking.amountCents - i.booking.creditCents;

            return (
              <li
                key={i.id}
                className="rounded-xl border border-slate-200 p-5 dark:border-slate-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/partidas/${i.booking.game.slug}`}
                      className="font-semibold text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {i.booking.game.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Dirigía {i.booking.game.gm.user.name} · terminó{' '}
                      <Fecha valor={i.booking.game.endsAt} />
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${estado.clase}`}
                  >
                    {estado.texto}
                  </span>
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Reclama{' '}
                    <Link
                      href={`/u/${i.reportedBy.slug}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {i.reportedBy.name}
                    </Link>{' '}
                    · <Fecha valor={i.createdAt} />
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-line text-slate-800 dark:text-slate-200">
                    {i.reason}
                  </p>
                </div>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  Pagó {formatearImporte(i.booking.amountCents, i.booking.currency)}
                  {i.booking.creditCents > 0 && (
                    <>
                      {' '}
                      ({formatearImporte(i.booking.creditCents, i.booking.currency)} con
                      saldo, {formatearImporte(pagadoConTarjeta, i.booking.currency)} con
                      tarjeta)
                    </>
                  )}
                </p>

                {i.status === 'OPEN' ? (
                  <ResolverIncidencia
                    incidentId={i.id}
                    accionAprobar={aprobarIncidenciaAction}
                    accionRechazar={rechazarIncidenciaAction}
                  />
                ) : (
                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Resuelta por {i.resolvedBy?.name ?? 'un admin'}
                      {i.resolvedAt && (
                        <>
                          {' · '}
                          <Fecha valor={i.resolvedAt} />
                        </>
                      )}
                    </p>
                    {i.resolutionNote && (
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                        {i.resolutionNote}
                      </p>
                    )}

                    {i.status === 'APPROVED' && pagadoConTarjeta > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                          Si el jugador reclama su dinero en vez de saldo:
                        </p>
                        <ReservarBoton
                          accion={devolverADineroAction}
                          texto={`Devolver ${formatearImporte(pagadoConTarjeta, i.booking.currency)} a su tarjeta`}
                          destructivo
                          campos={{ bookingId: i.booking.id }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
