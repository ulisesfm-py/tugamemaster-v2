import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReservarBoton } from '@/components/reservar-boton';
import { ResolverIncidencia } from '@/components/resolver-incidencia';
import { Estado, ESTADO_DE_INCIDENCIA, Fecha, Vacio } from '@/components/ui';
import { auth } from '@/lib/auth';
import {
  aprobarIncidenciaAction,
  devolverADineroAction,
  rechazarIncidenciaAction,
} from '@/modules/incidents/actions';
import { incidenciasParaAdmin } from '@/modules/incidents/queries';
import { formatearImporte } from '@/modules/payments/dinero';

export const metadata: Metadata = { title: 'Incidencias · Admin' };

export default async function IncidenciasPage() {
  const session = await auth();

  // El middleware ya bloquea /admin, pero se repite aqui: la seguridad no
  // puede depender de una sola capa.
  if (!session?.user?.isAdmin) notFound();

  const incidencias = await incidenciasParaAdmin();
  const abiertas = incidencias.filter((i) => i.status === 'OPEN');

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
        ← Administración
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold sm:text-4xl">
        Incidencias
      </h1>
      <p className="text-muted-foreground mt-2">
        {abiertas.length === 0
          ? 'No hay ninguna pendiente.'
          : `${abiertas.length} pendiente${abiertas.length === 1 ? '' : 's'} de revisar. Cada una detiene el pago al game master de su partida.`}
      </p>

      {incidencias.length === 0 ? (
        <Vacio className="mt-8" titulo="Todavía no se ha reportado ninguna incidencia">
          Aparecerán aquí en cuanto alguien reclame sobre una partida ya jugada.
        </Vacio>
      ) : (
        <ul className="mt-8 flex flex-col gap-5">
          {incidencias.map((i) => {
            const estado = ESTADO_DE_INCIDENCIA[i.status];
            const pagadoConTarjeta = i.booking.amountCents - i.booking.creditCents;

            return (
              <li key={i.id} className="border-border bg-card rounded-sm border p-5">
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/partidas/${i.booking.game.slug}`}
                      className="font-heading text-foreground font-bold hover:underline"
                    >
                      {i.booking.game.title}
                    </Link>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      Dirigía {i.booking.game.gm.user.name} · terminó{' '}
                      <Fecha valor={i.booking.game.endsAt} />
                    </p>
                  </div>

                  <Estado tono={estado.tono}>{estado.texto}</Estado>
                </div>

                {/* Lo que dice quien reclama, en su propia caja: es lo que hay
                    que leer antes de decidir, no una nota al pie. */}
                <div className="bg-secondary mt-4 rounded-sm p-4">
                  <p className="text-muted-foreground text-xs">
                    Reclama{' '}
                    <Link
                      href={`/u/${i.reportedBy.slug}`}
                      className="text-primary hover:underline"
                    >
                      {i.reportedBy.name}
                    </Link>{' '}
                    · <Fecha valor={i.createdAt} />
                  </p>
                  <p className="text-foreground mt-2 text-sm whitespace-pre-line">
                    {i.reason}
                  </p>
                </div>

                <p className="text-muted-foreground mt-3 text-sm">
                  Pagó{' '}
                  <strong className="text-foreground">
                    {formatearImporte(i.booking.amountCents, i.booking.currency)}
                  </strong>
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
                  <div className="border-border mt-4 border-t pt-4">
                    <p className="text-muted-foreground text-xs">
                      Resuelta por {i.resolvedBy?.name ?? 'un admin'}
                      {i.resolvedAt && (
                        <>
                          {' · '}
                          <Fecha valor={i.resolvedAt} />
                        </>
                      )}
                    </p>
                    {i.resolutionNote && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {i.resolutionNote}
                      </p>
                    )}

                    {/* Convertir saldo en dinero real solo puede hacerlo un
                        admin, y solo por la parte que entro por tarjeta. */}
                    {i.status === 'APPROVED' && pagadoConTarjeta > 0 && (
                      <div className="mt-4">
                        <p className="text-muted-foreground mb-2 text-xs">
                          Si el jugador reclama su dinero en vez de saldo:
                        </p>
                        <ReservarBoton
                          accion={devolverADineroAction}
                          texto={`Devolver ${formatearImporte(pagadoConTarjeta, i.booking.currency)} a su tarjeta`}
                          destructivo
                          tamano="sm"
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
