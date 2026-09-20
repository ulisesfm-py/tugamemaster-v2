import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ReservarBoton } from '@/components/reservar-boton';
import { Avatar, Aviso, Estado, Fecha, Vacio } from '@/components/ui';
import { auth } from '@/lib/auth';
import { stripeEnabled } from '@/lib/stripe';
import { empezarAltaAction, refrescarEstadoAction } from '@/modules/payments/actions';
import { formatearImporte } from '@/modules/payments/dinero';
import { ingresosDeGm } from '@/modules/payments/ingresos';
import { ESTADO_DEL_DINERO, HORAS_DE_RETENCION } from '@/modules/payments/libro';

export const metadata: Metadata = { title: 'Mis ingresos · TuGameMaster' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Una de las cuatro cifras de cabecera. */
function Cifra({
  titulo,
  cents,
  nota,
  destacada,
}: {
  titulo: string;
  cents: number;
  nota: string;
  destacada?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground order-2 mt-0.5 text-xs font-semibold tracking-widest uppercase">
        {titulo}
      </dt>
      <dd
        className={`font-heading order-1 text-2xl font-extrabold tabular-nums ${
          destacada ? 'text-primary' : 'text-foreground'
        }`}
      >
        {formatearImporte(cents)}
      </dd>
      <dd className="text-muted-foreground order-3 mt-1 text-xs">{nota}</dd>
    </div>
  );
}

/** Lo que se dice del estado de una reserva que no llego a cobrarse. */
const RESERVA_SIN_COBRO = {
  REFUNDED: 'Devuelta por incidencia',
  CANCELLED: 'Plaza liberada',
} as const;

export default async function CobrosPage({ searchParams }: Props) {
  const params = await searchParams;

  const session = await auth();
  if (!session?.user) redirect('/login');

  const libro = await ingresosDeGm(session.user.id);
  if (!libro) redirect('/cuenta/gm');

  const { gm, partidas, resumen } = libro;
  const empezado = Boolean(gm.stripeAccountId);
  const listo = gm.payoutsEnabled;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
        ← Mi cuenta
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold sm:text-4xl">
        Mis ingresos
      </h1>
      <p className="text-muted-foreground mt-2">
        Cada euro, con la partida y el jugador de los que salió.
      </p>

      {/* ── La cuenta de cobro ────────────────────────────────────
          Sin ella no hay dinero que ensenar, asi que cuando falta manda
          sobre todo lo demas. Cuando esta lista, se aparta: es un
          tramite hecho, no una noticia. */}
      {!stripeEnabled() ? (
        <Aviso tono="dato" className="mt-8">
          Los cobros no están configurados en este entorno.
        </Aviso>
      ) : !listo ? (
        <section className="mt-8">
          <Aviso
            tono="atencion"
            titulo={empezado ? 'Alta empezada, sin terminar' : 'Aún no puedes cobrar'}
          >
            Hasta que Stripe verifique tus datos no podrás publicar partidas ni recibir
            transferencias. El alta la gestiona Stripe, no nosotros: te pedirá tus datos
            fiscales y un documento de identidad, y TuGameMaster no llega a verlos.
          </Aviso>

          {params['vuelta'] !== undefined && (
            <Aviso tono="dato" className="mt-3">
              Stripe todavía está revisando tus datos. Puede tardar un rato, y a veces
              algún día. Pulsa «Comprobar estado» más tarde.
            </Aviso>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <ReservarBoton
              accion={empezarAltaAction}
              texto={empezado ? 'Continuar con el alta' : 'Empezar el alta'}
              campos={{}}
            />
            {empezado && (
              <ReservarBoton
                accion={refrescarEstadoAction}
                texto="Comprobar estado"
                destructivo
                campos={{}}
              />
            )}
          </div>
        </section>
      ) : (
        <p className="border-border text-muted-foreground mt-6 flex flex-wrap items-center gap-2 rounded-sm border border-dashed px-4 py-2.5 text-sm">
          <Estado tono="bien">Cuenta verificada</Estado>
          Tus transferencias salen a la cuenta que diste de alta en Stripe.
        </p>
      )}

      {/* ── Las cuatro cifras ─────────────────────────────────────
          Excluyentes a proposito: cada euro esta en una sola. Sumarlas
          da todo lo que se ha vendido nunca. */}
      <section className="border-border bg-card mt-8 rounded-sm border p-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <Cifra
            titulo="Cobrado"
            cents={resumen.cobradoCents}
            nota="Ya en tu cuenta"
            destacada
          />
          <Cifra
            titulo="En camino"
            cents={resumen.enCaminoCents}
            nota={`Jugado, en el plazo de ${HORAS_DE_RETENCION} h`}
          />
          <Cifra
            titulo="Retenido"
            cents={resumen.retenidoCents}
            nota="Hay algo que resolver"
          />
          <Cifra
            titulo="Por jugarse"
            cents={resumen.porJugarseCents}
            nota="Plazas vendidas de mesas futuras"
          />
        </dl>

        {resumen.brutoCents > 0 && (
          <p className="border-border text-muted-foreground mt-5 border-t pt-4 text-sm">
            Tus jugadores han pagado{' '}
            <strong className="text-foreground">
              {formatearImporte(resumen.brutoCents)}
            </strong>
            . De ahí salen {formatearImporte(resumen.comisionCents)} de comisión de
            TuGameMaster y {formatearImporte(resumen.pasarelaCents)} que cobra la pasarela
            de pago.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-foreground text-xl font-bold">Por partida</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          El dinero se transfiere una vez por mesa, {HORAS_DE_RETENCION} horas después de
          jugarla.
        </p>

        {partidas.length === 0 ? (
          <Vacio className="mt-4" titulo="Todavía no has vendido ninguna plaza">
            Cuando alguien reserve en una de tus partidas, el apunte aparecerá aquí con su
            nombre y el reparto del importe.
          </Vacio>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {partidas.map((partida) => {
              const estado = ESTADO_DEL_DINERO[partida.estado];

              return (
                <li
                  key={partida.id}
                  className="border-border bg-card overflow-hidden rounded-sm border"
                >
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-2 p-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/partidas/${partida.slug}`}
                        className="font-heading text-foreground font-bold hover:underline"
                      >
                        {partida.title}
                      </Link>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        <Fecha valor={partida.startsAt} />
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-heading text-foreground text-lg font-bold tabular-nums">
                        {formatearImporte(partida.total.netoCents, partida.currency)}
                      </p>
                      <Estado tono={estado.tono} className="mt-1">
                        {estado.texto}
                      </Estado>
                    </div>
                  </div>

                  <p className="text-muted-foreground px-4 pb-3 text-xs">
                    {estado.explicacion}
                    {partida.payout?.status === 'PAID' && partida.payout.paidAt && (
                      <>
                        {' '}
                        Salió el <Fecha valor={partida.payout.paidAt} />.
                      </>
                    )}
                    {partida.payout?.blockedReason && (
                      <> Motivo: {partida.payout.blockedReason}.</>
                    )}
                  </p>

                  {/* El detalle asiento por asiento: es el unico nivel donde
                      existe «el jugador que pago». */}
                  <div className="border-border overflow-x-auto border-t">
                    <table className="w-full min-w-md text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-left text-xs tracking-widest uppercase">
                          <th scope="col" className="px-4 py-2 font-semibold">
                            Jugador
                          </th>
                          <th scope="col" className="px-3 py-2 text-right font-semibold">
                            Pagó
                          </th>
                          <th scope="col" className="px-3 py-2 text-right font-semibold">
                            Comisión
                          </th>
                          <th scope="col" className="px-3 py-2 text-right font-semibold">
                            Pasarela
                          </th>
                          <th scope="col" className="px-4 py-2 text-right font-semibold">
                            Para ti
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-border divide-y">
                        {partida.reservas.map((reserva) => (
                          <tr
                            key={reserva.id}
                            className={reserva.linea.cuenta ? '' : 'opacity-55'}
                          >
                            <th scope="row" className="px-4 py-2.5 text-left font-normal">
                              <span className="flex items-center gap-2">
                                <Avatar
                                  src={reserva.user.image}
                                  nombre={reserva.user.name}
                                  tamano={22}
                                />
                                <Link
                                  href={`/u/${reserva.user.slug}`}
                                  className="text-foreground font-medium hover:underline"
                                >
                                  {reserva.user.name}
                                </Link>
                              </span>
                              {!reserva.linea.cuenta && (
                                <span className="text-muted-foreground mt-0.5 block text-xs">
                                  {RESERVA_SIN_COBRO[
                                    reserva.status as keyof typeof RESERVA_SIN_COBRO
                                  ] ?? 'Sin cobro'}
                                </span>
                              )}
                            </th>

                            <td className="text-foreground px-3 py-2.5 text-right tabular-nums">
                              {formatearImporte(
                                reserva.linea.brutoCents,
                                partida.currency,
                              )}
                            </td>
                            <td className="text-muted-foreground px-3 py-2.5 text-right tabular-nums">
                              −
                              {formatearImporte(
                                reserva.linea.comisionCents,
                                partida.currency,
                              )}
                            </td>
                            <td className="text-muted-foreground px-3 py-2.5 text-right tabular-nums">
                              −
                              {formatearImporte(
                                reserva.linea.pasarelaCents,
                                partida.currency,
                              )}
                            </td>
                            <td className="text-foreground px-4 py-2.5 text-right font-semibold tabular-nums">
                              {reserva.linea.cuenta
                                ? formatearImporte(
                                    reserva.linea.netoCents,
                                    partida.currency,
                                  )
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="text-muted-foreground mt-10 flex flex-col gap-3 text-sm">
        <h2 className="font-heading text-foreground text-xl font-bold">
          Cómo se calcula
        </h2>
        <p>
          El jugador paga al reservar y el dinero queda retenido por TuGameMaster. Al
          terminar la partida empieza un plazo de {HORAS_DE_RETENCION} horas por si
          alguien reporta una incidencia; si no la hay, la transferencia sale sola.
        </p>
        <p>
          De cada plaza se descuentan la comisión del 5% de TuGameMaster y el coste real
          que cobra la pasarela por esa transacción, que es un dato de Stripe y no una
          estimación. El resto es tuyo.
        </p>
        <p>
          Una incidencia abierta detiene el pago de esa partida entera hasta que un
          administrador la resuelva.
        </p>
      </section>
    </main>
  );
}
