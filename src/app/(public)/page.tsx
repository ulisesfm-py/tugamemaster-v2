import Image from 'next/image';
import Link from 'next/link';

import { GuiasDePortada } from '@/components/blog/guias-de-portada';
import { PartidaCard } from '@/components/partida-card';
import { PORTADA } from '@/lib/marca';
import { Avatar, EnlaceBoton, Estrellas, Vacio } from '@/components/ui';
import { COMISION_ESTANDAR, porcentaje } from '@/modules/payments/dinero';
import { listarPosts } from '@/modules/blog/queries';
import { listarPartidas } from '@/modules/games/queries';
import { directorioDeGms } from '@/modules/profiles/queries';
import {
  HORAS_CANCELACION_CON_DEVOLUCION,
  PORCENTAJE_DEVOLUCION,
  PORCENTAJE_DEVOLUCION_INCIDENCIA,
} from '@/modules/bookings/politica';

/**
 * La portada.
 *
 * Es el escaparate del jugador, no un folleto para las dos partes: al game
 * master se le capta mas abajo. El trabajo de esta pagina es que alguien que
 * no conoce la web entienda en diez segundos que es, vea mesas a las que
 * apuntarse y se fie lo suficiente para pulsar una.
 *
 * Por eso las partidas van arriba del todo, justo despues del titular: son el
 * producto, y cualquier cosa que se ponga por delante las retrasa.
 */

const COMO_FUNCIONA = [
  {
    titulo: 'Elige tu mesa',
    texto:
      'Mira qué se juega, cuándo y con quién. Cada game master enseña sus estrellas y las partidas que ha dirigido aquí.',
  },
  {
    titulo: 'Paga tu plaza',
    texto:
      'Reservas y pagas en el momento, con tarjeta. Tu sitio queda guardado y el dinero retenido hasta que la partida se juega.',
  },
  {
    titulo: 'Juega',
    texto:
      'El game master cobra 48 horas después de terminar. Si algo sale mal, ese plazo es tu margen para decirlo.',
  },
];

export default async function Portada() {
  const [partidas, gms, articulos] = await Promise.all([
    listarPartidas({}),
    directorioDeGms(4),
    listarPosts(3),
  ]);

  const abiertas = partidas
    .filter((p) => p.seatsTotal - p._count.bookings > 0)
    .slice(0, 8);

  const comision = porcentaje(COMISION_ESTANDAR);

  return (
    <main>
      {/* ── Titular ───────────────────────────────────────────── */}
      {/* Sin lamina queda el degradado; con lamina, la foto a sangre bajo un
          velo oscuro. El velo no es decoracion: el titular tiene que leerse
          sobre cualquier imagen que se ponga aqui, y una foto clara sin velo
          deja el texto ilegible. */}
      <section
        className={`border-border relative isolate border-b ${
          PORTADA ? 'bg-background' : 'from-accent/10 to-background bg-gradient-to-b'
        }`}
      >
        {PORTADA && (
          <>
            <Image
              src={PORTADA.src}
              // Decorativa: lo que cuenta la portada lo dice el titular.
              alt=""
              fill
              sizes="100vw"
              priority
              className="-z-10 object-cover"
              style={{ objectPosition: PORTADA.posicion ?? 'center' }}
            />
            <div
              aria-hidden
              className="from-background/95 via-background/75 to-background/45 absolute inset-0 -z-10 bg-gradient-to-r"
            />
          </>
        )}

        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="font-heading text-foreground max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">
            Una silla libre en una buena mesa
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg">
            Partidas de rol dirigidas por game masters que saben lo que hacen. Reservas
            una tarde, no te suscribes a nada, y si el game master no aparece recuperas tu
            dinero.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <EnlaceBoton href="/partidas" tamano="lg">
              Ver partidas abiertas
            </EnlaceBoton>
            <EnlaceBoton href="/gm" variante="perfil" tamano="lg">
              Conocer a los game masters
            </EnlaceBoton>
          </div>
        </div>
      </section>

      {/* ── Partidas abiertas ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-foreground text-2xl font-bold">
              Partidas abiertas
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Con plazas libres ahora mismo, de la más próxima a la más lejana.
            </p>
          </div>
          <Link
            href="/partidas"
            className="text-primary text-sm font-semibold hover:underline"
          >
            Ver todas →
          </Link>
        </div>

        {abiertas.length === 0 ? (
          <Vacio
            className="mt-6"
            titulo="No hay ninguna mesa abierta ahora mismo"
            accion={<EnlaceBoton href="/gm">Ver game masters</EnlaceBoton>}
          >
            Vuelve en unos días, o mira qué game masters dirigen aquí para no perderte su
            próxima partida.
          </Vacio>
        ) : (
          /* Fila deslizable, no carrusel: se ven varias tarjetas a la vez y
             ninguna se esconde. Un carrusel que rota solo enseña una cosa cada
             vez, y las partidas son el producto. */
          <ul className="-mx-4 mt-6 flex snap-x snap-mandatory [scrollbar-width:thin] gap-4 overflow-x-auto px-4 pb-4">
            {abiertas.map((p) => (
              <PartidaCard
                key={p.id}
                partida={p}
                className="w-[17rem] shrink-0 snap-start sm:w-[19rem]"
              />
            ))}
          </ul>
        )}
      </section>

      {/* ── Cómo funciona ─────────────────────────────────────── */}
      <section className="border-border bg-card border-y">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-heading text-foreground text-2xl font-bold">
            Cómo funciona
          </h2>

          {/* Numerado porque es una secuencia de verdad: el orden importa. */}
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {COMO_FUNCIONA.map((paso, i) => (
              <li key={paso.titulo} className="flex flex-col gap-2">
                <span className="font-heading text-primary text-3xl font-extrabold tabular-nums">
                  {i + 1}
                </span>
                <h3 className="font-heading text-foreground text-lg font-bold">
                  {paso.titulo}
                </h3>
                <p className="text-muted-foreground text-sm">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Guías y tutoriales ────────────────────────────────── */}
      <GuiasDePortada guias={articulos} />

      {/* ── La garantía ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="border-accent/30 bg-accent/5 flex flex-col gap-6 rounded-sm border p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent mt-1 size-6 shrink-0"
              aria-hidden
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div>
              <h2 className="font-heading text-foreground text-2xl font-bold">
                Tu plaza está garantizada
              </h2>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Pagar por adelantado a alguien que no conoces da reparo. Por eso la
                plataforma se queda el dinero hasta que la partida se juega.
              </p>
            </div>
          </div>

          <dl className="grid gap-5 sm:grid-cols-3">
            {[
              {
                t: `Si el game master no aparece`,
                d: `Recuperas el ${PORCENTAJE_DEVOLUCION_INCIDENCIA}%. Lo revisa una persona, no un formulario.`,
              },
              {
                t: `Si cancelas con tiempo`,
                d: `Hasta ${HORAS_CANCELACION_CON_DEVOLUCION} horas antes, te devolvemos el ${PORCENTAJE_DEVOLUCION}% en saldo.`,
              },
              {
                t: 'Tu saldo no caduca',
                d: 'Se aplica solo en tu siguiente reserva, sin que tengas que acordarte.',
              },
            ].map((item) => (
              <div key={item.t}>
                <dt className="text-foreground font-semibold">{item.t}</dt>
                <dd className="text-muted-foreground mt-1 text-sm">{item.d}</dd>
              </div>
            ))}
          </dl>

          <p className="text-sm">
            <Link href="/condiciones" className="text-primary hover:underline">
              Leer las condiciones completas →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Game masters ──────────────────────────────────────── */}
      {gms.length > 0 && (
        <section className="border-border bg-card border-y">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-heading text-foreground text-2xl font-bold">
                  Quién dirige
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Las estrellas salen solo de mesas pagadas aquí. Nadie puede inflarlas
                  por su cuenta.
                </p>
              </div>
              <Link
                href="/gm"
                className="text-primary text-sm font-semibold hover:underline"
              >
                Ver todos →
              </Link>
            </div>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {gms.map((gm) => (
                <li key={gm.id}>
                  <Link
                    href={`/gm/${gm.user.slug}`}
                    className="border-border bg-background hover:border-primary flex h-full flex-col items-center gap-2 rounded-sm border p-5 text-center transition hover:-translate-y-0.5"
                  >
                    <Avatar src={gm.user.image} nombre={gm.user.name} tamano={56} />
                    <p className="font-heading text-foreground font-bold">
                      {gm.user.name}
                    </p>
                    <Estrellas
                      valor={gm.reputacion.valoracionMedia}
                      total={gm.reputacion.totalResenas}
                    />
                    {gm.headline && (
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {gm.headline}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Para game masters ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div>
          <h2 className="font-heading text-foreground text-2xl font-bold">
            ¿Diriges tú?
          </h2>
          <p className="text-muted-foreground mt-2 max-w-prose">
            Abre tu mesa, pon tus plazas y tu precio, y cobra por dirigirla. Nosotros nos
            encargamos del cobro, de las cancelaciones y de que tu reputación quede
            escrita donde se ve.
          </p>

          <ul className="text-muted-foreground mt-5 flex flex-col gap-2 text-sm">
            <li>
              <span className="text-foreground font-semibold">
                Comisión del {comision}%
              </span>{' '}
              sobre lo que cobras, más el coste real de la plataforma de pago.
            </li>
            <li>
              <span className="text-foreground font-semibold">Cobras 48 horas</span>{' '}
              después de terminar la partida, si no hay incidencias.
            </li>
            <li>
              <span className="text-foreground font-semibold">
                Sin cuota ni permanencia.
              </span>{' '}
              Si un mes no diriges, no pagas nada.
            </li>
          </ul>

          <div className="mt-7 flex flex-wrap gap-3">
            <EnlaceBoton href="/cuenta/gm">Abrir mi mesa</EnlaceBoton>
            <EnlaceBoton href="/para-game-masters" variante="perfil">
              Cómo funciona para el GM
            </EnlaceBoton>
          </div>
        </div>
      </section>
    </main>
  );
}
