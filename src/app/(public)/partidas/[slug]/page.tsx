import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Lamina } from '@/components/lamina';
import { ReservarBoton } from '@/components/reservar-boton';
import { Avatar, Aviso, EnlaceBoton, Estrellas, Fecha, Precio } from '@/components/ui';
import { auth } from '@/lib/auth';
import { cancelarReservaAction, reservarAction } from '@/modules/bookings/actions';
import {
  HORAS_CANCELACION_CON_DEVOLUCION,
  PORCENTAJE_DEVOLUCION,
  PORCENTAJE_DEVOLUCION_INCIDENCIA,
} from '@/modules/bookings/politica';
import { notaVisible } from '@/modules/campaigns/queries';
import {
  EXPERIENCIA,
  estadoVisible,
  etiquetasPorGrupo,
  idiomasDeLaMesa,
  PLAZAS_POCAS,
  textoDeDuracion,
  textoDeEdad,
  tipoDeMesa,
} from '@/modules/games/ficha';
import { detallePartida } from '@/modules/games/queries';
import { formatearImporte } from '@/modules/payments/dinero';
import { reputacionGm } from '@/modules/profiles/queries';
import { saldoDe } from '@/modules/wallet/service';

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

/** Una fila de la ficha tecnica. */
function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border-border border-t pt-3">
      <dt className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
        {titulo}
      </dt>
      <dd className="text-foreground mt-1 text-sm">{children}</dd>
    </div>
  );
}

export default async function PartidaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const params_ = await searchParams;
  const session = await auth();
  const partida = await detallePartida(slug, session?.user.id);

  if (!partida) notFound();

  // Un borrador solo lo ve su autor: para el resto, no existe.
  if (partida.status !== 'PUBLISHED' && !partida.esMia) notFound();

  const [saldo, reputacion, nota] = await Promise.all([
    session?.user ? saldoDe(session.user.id) : Promise.resolve(0),
    reputacionGm(partida.gm.id),
    // La nota de sesion la ven el GM y quienes jugaron; para el resto no existe.
    notaVisible(partida.id, session?.user.id),
  ]);

  const reservaActiva =
    partida.miReserva &&
    ['PENDING', 'PAID', 'COMPLETED'].includes(partida.miReserva.status)
      ? partida.miReserva
      : null;

  // Lo que se ensena no es siempre lo guardado: el cron cierra las partidas de
  // madrugada, y hasta que pasa una ya jugada sigue diciendo «publicada».
  const visible = estadoVisible(partida.status, partida.startsAt);

  const tipo = tipoDeMesa(partida);
  const experiencia = EXPERIENCIA[partida.experience];
  const duracion = textoDeDuracion(partida.startsAt, partida.endsAt);
  const edad = textoDeEdad(partida.minAge);
  const idiomas = idiomasDeLaMesa(partida.languages, partida.gm.languages);
  const grupos = etiquetasPorGrupo(partida.tags);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {params_['pago'] === 'ok' && (
        <Aviso tono="exito" className="mb-6" titulo="Pago recibido">
          Tu plaza está confirmada; la verás también en Mis reservas.
        </Aviso>
      )}

      {params_['pago'] === 'cancelado' && (
        <Aviso tono="dato" className="mb-6" titulo="No has completado el pago">
          Tu plaza sigue guardada unos minutos por si quieres intentarlo de nuevo.
        </Aviso>
      )}

      {partida.status === 'DRAFT' && (
        <Aviso tono="atencion" className="mb-6" titulo="Esto es un borrador">
          Solo tú puedes verlo. Nadie más lo encontrará hasta que lo publiques.
        </Aviso>
      )}

      {partida.status === 'CANCELLED' && (
        <Aviso tono="error" className="mb-6" titulo="Partida cancelada">
          Quien había pagado su plaza recibió el importe íntegro en saldo.
        </Aviso>
      )}

      <div className="from-accent/20 to-background relative grid aspect-[16/9] place-items-center overflow-hidden rounded-sm bg-gradient-to-br sm:aspect-[3/1]">
        <Lamina
          src={partida.imageUrl}
          system={partida.system}
          sizes="(max-width: 1024px) 100vw, 64rem"
          priority
          claseTexto="text-3xl sm:text-5xl"
        />
      </div>

      <header className="mt-6">
        {/* Solo el sistema: que clase de mesa es lo dice la ficha, y en una
            sesion de campana el enlace de abajo ya nombra la campana. Decirlo
            tres veces no lo hace mas claro. */}
        <p className="text-accent text-sm font-semibold">{partida.system}</p>

        <h1 className="font-heading text-foreground mt-2 text-3xl font-extrabold text-balance sm:text-4xl">
          {partida.title}
        </h1>

        {partida.campaign && (
          <p className="text-muted-foreground mt-2 text-sm">
            Parte de{' '}
            <Link
              href={`/campanas/${partida.campaign.slug}`}
              className="text-primary hover:underline"
            >
              {partida.campaign.title}
            </Link>
          </p>
        )}
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* En móvil, el precio y el botón van antes que todo lo demás: quien
            llega decidido no tiene por qué recorrer la ficha entera. */}
        <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
          <div className="border-border bg-card rounded-sm border p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-heading text-foreground text-3xl font-extrabold tabular-nums">
                <Precio cents={partida.priceCents} currency={partida.currency} />
              </p>
              <p className="text-muted-foreground text-sm">por plaza</p>
            </div>

            {/* El aforo solo tiene sentido mientras se pueda reservar: junto a
                «esta partida ya se ha jugado», «4 plazas libres» se contradice.
                Su autor si lo ve siempre, que para eso la gestiona. */}
            {(visible === 'PUBLISHED' || partida.esMia) && (
              <p
                className={`mt-1 text-sm font-semibold ${
                  partida.plazasLibres > 0 && partida.plazasLibres <= PLAZAS_POCAS
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {partida.plazasLibres > 0
                  ? `${partida.plazasLibres} de ${partida.seatsTotal} plazas libres`
                  : 'Sin plazas libres'}
              </p>
            )}

            {/* El orden de estas ramas importa. Lo que cierra la puerta va
                antes que lo que invita a entrar: con el gate de fecha al
                final, a quien no habia iniciado sesion se le seguia diciendo
                «inicia sesion para reservar» en una mesa ya jugada. */}
            <div className="mt-5">
              {partida.esMia ? (
                <EnlaceBoton
                  href={`/cuenta/partidas/${partida.id}`}
                  variante="perfil"
                  className="w-full"
                >
                  Gestionar mi partida
                </EnlaceBoton>
              ) : visible !== 'PUBLISHED' ? (
                <p className="text-muted-foreground text-sm">
                  {visible === 'COMPLETED'
                    ? reservaActiva
                      ? 'Jugaste esta partida.'
                      : 'Esta partida ya se ha jugado.'
                    : 'Esta partida no admite reservas.'}
                </p>
              ) : !session?.user ? (
                <EnlaceBoton href="/login" tamano="lg" className="w-full">
                  Inicia sesión para reservar
                </EnlaceBoton>
              ) : reservaActiva ? (
                <>
                  <Aviso tono="exito" className="mb-3">
                    Tienes una plaza reservada.
                  </Aviso>
                  <ReservarBoton
                    accion={cancelarReservaAction}
                    texto="Liberar mi plaza"
                    destructivo
                    campos={{ bookingId: reservaActiva.id, slug: partida.slug }}
                  />
                </>
              ) : !partida.puedeContinuar ? (
                <p className="text-muted-foreground text-sm">
                  Esta sesión continúa{' '}
                  {partida.previousGame ? (
                    <Link
                      href={`/partidas/${partida.previousGame.slug}`}
                      className="text-primary hover:underline"
                    >
                      {partida.previousGame.title}
                    </Link>
                  ) : (
                    'otra partida'
                  )}
                  , y solo pueden apuntarse quienes jugaron aquella.
                </p>
              ) : partida.plazasLibres <= 0 ? (
                <p className="text-muted-foreground text-sm">
                  No quedan plazas. Si alguien libera la suya, aparecerá aquí.
                </p>
              ) : (
                <>
                  <ReservarBoton
                    accion={reservarAction}
                    texto="Reservar plaza"
                    campos={{ gameId: partida.id, slug: partida.slug }}
                  />

                  <p className="text-muted-foreground mt-3 text-xs">
                    {partida.priceCents === 0 ? (
                      'Esta partida es gratuita.'
                    ) : saldo >= partida.priceCents ? (
                      <>Se pagará con tu saldo. No hará falta tarjeta.</>
                    ) : saldo > 0 ? (
                      <>
                        Se usarán {formatearImporte(saldo)} de tu saldo y pagarás{' '}
                        {formatearImporte(partida.priceCents - saldo)} con tarjeta.
                      </>
                    ) : (
                      'Te guardamos la plaza 20 minutos mientras pagas.'
                    )}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* La garantia va junto al precio, no escondida en un enlace legal:
              es justo donde aparece la duda de «¿y si sale mal?». Los numeros
              salen de politica.ts para que la web no pueda contradecir al
              codigo que mueve el dinero. */}
          {partida.priceCents > 0 && !partida.esMia && visible === 'PUBLISHED' && (
            <div className="border-border mt-4 rounded-sm border border-dashed p-4">
              <h2 className="text-foreground text-sm font-semibold">
                Reservar aquí te protege
              </h2>
              <ul className="text-muted-foreground mt-2 flex flex-col gap-1.5 text-xs">
                <li>
                  Cancela hasta {HORAS_CANCELACION_CON_DEVOLUCION} h antes y recuperas el{' '}
                  {PORCENTAJE_DEVOLUCION}% en saldo.
                </li>
                <li>
                  Si el game master no aparece, el {PORCENTAJE_DEVOLUCION_INCIDENCIA}%.
                </li>
                <li>El saldo no caduca y se aplica solo en tu siguiente reserva.</li>
              </ul>
              <Link
                href="/condiciones"
                className="text-primary mt-3 inline-block text-xs hover:underline"
              >
                Ver las condiciones
              </Link>
            </div>
          )}
        </aside>

        <div className="flex flex-col gap-10 lg:col-start-1 lg:row-start-1">
          {/* La ficha tecnica va antes que la descripcion a proposito: contesta
              «¿es esta mesa para mi?» en cinco segundos, y solo quien ya sabe
              que puede encajar tiene motivo para leerse el resto. */}
          <section>
            <h2 className="font-heading text-foreground text-xl font-bold">
              La mesa, en corto
            </h2>

            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Dato titulo="Cuándo">
                <Fecha valor={partida.startsAt} />
              </Dato>

              {duracion && <Dato titulo="Cuánto dura">{duracion}</Dato>}

              <Dato titulo="Experiencia">
                {experiencia.titulo}
                <span className="text-muted-foreground block text-xs">
                  {experiencia.explicacion}
                </span>
              </Dato>

              <Dato titulo="Idioma">{idiomas.join(', ')}</Dato>

              <Dato titulo="Plazas">
                {partida.seatsTotal} en total, {partida.plazasLibres} libres
              </Dato>

              <Dato titulo="Tipo de mesa">
                {tipo.texto}
                <span className="text-muted-foreground block text-xs">
                  {tipo.explicacion}
                </span>
              </Dato>

              {edad && <Dato titulo="Edad mínima">{edad}</Dato>}
            </dl>

            {grupos.length > 0 && (
              <div className="mt-6 flex flex-col gap-3">
                {grupos.map((g) => (
                  <div key={g.grupo} className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                      {g.titulo}
                    </span>
                    {g.etiquetas.map((e) => (
                      <span
                        key={e.id}
                        className="border-border text-foreground rounded-full border px-2.5 py-1 text-xs"
                      >
                        {e.texto}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-heading text-foreground text-xl font-bold">
              Qué vais a jugar
            </h2>
            <p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">
              {partida.description}
            </p>
          </section>

          {nota && (
            <section className="border-accent/30 bg-accent/5 rounded-sm border p-5">
              <h2 className="font-heading text-accent text-base font-bold">
                Dónde quedó la sesión
              </h2>
              <p className="text-foreground/90 mt-2 text-sm whitespace-pre-line">
                {nota.content}
              </p>
              <p className="text-muted-foreground mt-3 text-xs">
                Lo escribió el game master. Solo lo veis quienes jugasteis esta sesión.
              </p>
            </section>
          )}

          <section>
            <h2 className="font-heading text-foreground text-xl font-bold">
              Quién la dirige
            </h2>

            <Link
              href={`/gm/${partida.gm.user.slug}`}
              className="border-border bg-card hover:border-primary focus-visible:ring-ring focus-visible:ring-offset-background mt-4 flex items-start gap-4 rounded-sm border p-4 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Avatar
                src={partida.gm.user.image}
                nombre={partida.gm.user.name}
                tamano={56}
              />

              <span className="min-w-0 flex-1">
                <span className="font-heading text-foreground block font-bold">
                  {partida.gm.user.name}
                </span>

                {partida.gm.headline && (
                  <span className="text-muted-foreground mt-0.5 block text-sm">
                    {partida.gm.headline}
                  </span>
                )}

                <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Estrellas
                    valor={reputacion.valoracionMedia}
                    total={reputacion.totalResenas}
                  />
                  <span className="text-muted-foreground text-sm">
                    {reputacion.partidasDirigidas === 1
                      ? '1 partida dirigida aquí'
                      : `${reputacion.partidasDirigidas} partidas dirigidas aquí`}
                  </span>
                </span>
              </span>
            </Link>

            {/* La reputacion solo cuenta lo que ha pasado por la plataforma.
                Decirlo es parte de lo que la hace valer algo. */}
            <p className="text-muted-foreground mt-2 text-xs">
              Estrellas y partidas contadas salen solo de mesas reservadas y pagadas en
              TuGameMaster.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
