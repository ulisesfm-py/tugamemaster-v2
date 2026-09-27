import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ReportarIncidencia } from '@/components/reportar-incidencia';
import { ResenaForm } from '@/components/resena-form';
import { ReservarBoton } from '@/components/reservar-boton';
import {
  EnlaceBoton,
  Estado,
  ESTADO_DE_INCIDENCIA,
  ESTADO_DE_RESERVA,
  Fecha,
  Vacio,
} from '@/components/ui';
import { auth } from '@/lib/auth';
import { cancelarReservaAction } from '@/modules/bookings/actions';
import { HORAS_CANCELACION_CON_DEVOLUCION } from '@/modules/bookings/politica';
import { misReservas } from '@/modules/bookings/queries';
import { reportarIncidenciaAction } from '@/modules/incidents/actions';
import { misIncidencias } from '@/modules/incidents/queries';
import { formatearImporte } from '@/modules/payments/dinero';
import { dejarResenaAction, editarResenaAction } from '@/modules/reviews/actions';
import { misResenas } from '@/modules/reviews/queries';

export const metadata: Metadata = { title: 'Mis reservas · TuGameMaster' };

/**
 * Lo que pasa si libera la plaza ahora mismo.
 *
 * Es la pregunta que se hace cualquiera antes de pulsar, y hasta ahora habia
 * que irse a las condiciones a averiguarlo, justo en el momento en que menos
 * ganas se tienen de leer nada. El importe y el limite los calcula la consulta
 * con `politica.ts`, que es la misma que ejecuta la devolucion de verdad.
 *
 * El plazo se da como **fecha y no como cuenta atras**: «te quedan 2 dias»
 * cuando faltan 71 horas se queda corto por casi un dia entero, y para decidir
 * si cancelar o no, un plazo que miente es peor que ninguno.
 */
function Plazo({
  reserva,
}: {
  reserva: {
    conDevolucion: boolean;
    limiteDevolucion: Date;
    devolucionCents: number;
    amountCents: number;
    currency: string;
  };
}) {
  if (reserva.amountCents === 0) {
    return <>Era gratuita: puedes liberar la plaza cuando quieras.</>;
  }

  if (!reserva.conDevolucion) {
    return (
      <>
        Ya no hay devolución: el plazo se cerró {HORAS_CANCELACION_CON_DEVOLUCION} horas
        antes de empezar. Puedes liberar la plaza igualmente para que la ocupe otra
        persona.
      </>
    );
  }

  return (
    <>
      Si la liberas te devolvemos{' '}
      <strong className="text-foreground">
        {formatearImporte(reserva.devolucionCents, reserva.currency)}
      </strong>{' '}
      en saldo. Tienes de plazo hasta el <Fecha valor={reserva.limiteDevolucion} />.
    </>
  );
}

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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-foreground text-3xl font-extrabold sm:text-4xl">
        Mis reservas
      </h1>

      <section className="mt-8">
        <h2 className="font-heading text-foreground text-xl font-bold">Próximas</h2>

        {proximas.length === 0 ? (
          <Vacio
            className="mt-4"
            titulo="No tienes ninguna mesa reservada"
            accion={<EnlaceBoton href="/partidas">Buscar mesa</EnlaceBoton>}
          >
            Cuando reserves una plaza, aparecerá aquí con su fecha y su plazo de
            cancelación.
          </Vacio>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {proximas.map((r) => (
              <li key={r.id} className="border-border bg-card rounded-sm border p-5">
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/partidas/${r.game.slug}`}
                      className="font-heading text-foreground font-bold hover:underline"
                    >
                      {r.game.title}
                    </Link>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {r.game.system} · <Fecha valor={r.game.startsAt} />
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Dirige{' '}
                      <Link
                        href={`/gm/${r.game.gm.user.slug}`}
                        className="hover:underline"
                      >
                        {r.game.gm.user.name}
                      </Link>
                    </p>
                  </div>

                  {r.caducada ? (
                    <Estado tono="apagado">Sin completar</Estado>
                  ) : (
                    <Estado tono={ESTADO_DE_RESERVA[r.status].tono}>
                      {ESTADO_DE_RESERVA[r.status].texto}
                    </Estado>
                  )}
                </div>

                {/* Una reserva que se quedo a medias de pagar ya no ocupa
                    plaza, asi que no toca hablar de plazos de cancelacion:
                    toca decir que paso y como volver a intentarlo. */}
                {r.caducada ? (
                  <div className="border-border mt-4 border-t pt-3">
                    <p className="text-muted-foreground text-sm">
                      No llegaste a completar el pago, así que la plaza volvió a quedar
                      libre. Si sigue habiendo sitio, puedes reservarla otra vez.
                    </p>
                    <div className="mt-3">
                      <EnlaceBoton
                        href={`/partidas/${r.game.slug}`}
                        variante="perfil"
                        tamano="sm"
                      >
                        Volver a la partida
                      </EnlaceBoton>
                    </div>
                  </div>
                ) : (
                  <p className="border-border text-muted-foreground mt-4 border-t pt-3 text-sm">
                    <Plazo reserva={r} />
                  </p>
                )}

                {!r.caducada && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {/* Lo de hablar con la mesa va antes que lo de irse de
                        ella: casi siempre se cancela por algo que se podia
                        haber preguntado. */}
                    {r.hilo && (
                      <EnlaceBoton
                        href={`/partidas/${r.game.slug}/hilo`}
                        variante="perfil"
                        tamano="sm"
                      >
                        Hilo de mesa
                      </EnlaceBoton>
                    )}

                    <ReservarBoton
                      accion={cancelarReservaAction}
                      texto="Liberar mi plaza"
                      destructivo
                      tamano="sm"
                      campos={{ bookingId: r.id, slug: r.game.slug }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {pasadas.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-foreground text-xl font-bold">Historial</h2>

          <ul className="mt-4 flex flex-col gap-3">
            {pasadas.map((r) => {
              const resena = resenaDe.get(r.id);
              const incidencia = porReserva.get(r.id);

              return (
                <li key={r.id} className="border-border bg-card rounded-sm border p-4">
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/partidas/${r.game.slug}`}
                        className="text-foreground text-sm font-medium hover:underline"
                      >
                        {r.game.title}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        <Fecha valor={r.game.startsAt} /> · {r.game.gm.user.name}
                      </p>
                    </div>

                    <Estado tono={ESTADO_DE_RESERVA[r.status].tono}>
                      {ESTADO_DE_RESERVA[r.status].texto}
                    </Estado>
                  </div>

                  {/* Solo tiene sentido reclamar sobre una partida ya jugada y
                      pagada, y mientras no haya otra incidencia en curso. */}
                  {r.reclamable && (
                    <div className="mt-3">
                      {incidencia ? (
                        <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                          <Estado tono={ESTADO_DE_INCIDENCIA[incidencia.status].tono}>
                            {ESTADO_DE_INCIDENCIA[incidencia.status].texto}
                          </Estado>
                          {incidencia.status === 'APPROVED' &&
                            'Se te abonó el importe en saldo.'}
                          {incidencia.resolutionNote && <>{incidencia.resolutionNote}</>}
                        </p>
                      ) : (
                        <ReportarIncidencia
                          bookingId={r.id}
                          accion={reportarIncidenciaAction}
                        />
                      )}
                    </div>
                  )}

                  {/* El hilo sigue abierto un tiempo despues de jugar: es
                      donde se cuadra la siguiente sesion. */}
                  {r.hilo && (
                    <p className="mt-3">
                      <Link
                        href={`/partidas/${r.game.slug}/hilo`}
                        className="text-primary text-xs hover:underline"
                      >
                        Hilo de mesa
                      </Link>
                    </p>
                  )}

                  {/* Valorar al GM. `valorable` ya excluye las reservas
                      reembolsadas: una incidencia aprobada tiene su cauce y no
                      debe ademas puntuar. */}
                  {(r.valorable || resena) && (
                    <div className="border-border mt-3 border-t pt-3">
                      {resena ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-sm">
                            <span aria-hidden className="text-accent">
                              {'★'.repeat(resena.rating)}
                              <span className="text-border">
                                {'★'.repeat(5 - resena.rating)}
                              </span>
                            </span>
                            <span className="sr-only">
                              Le pusiste {resena.rating} de 5
                            </span>
                            {resena.comment && (
                              <span className="text-muted-foreground ml-2">
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
