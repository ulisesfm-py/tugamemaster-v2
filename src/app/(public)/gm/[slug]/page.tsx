import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PartidaCard } from '@/components/partida-card';
import { Avatar, Estrellas, Etiqueta, Fecha, Vacio } from '@/components/ui';
import { nombreDeIdioma } from '@/modules/games/ficha';
import { perfilPublicoGm } from '@/modules/profiles/queries';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const perfil = await perfilPublicoGm(slug);

  if (!perfil) return { title: 'Game master no encontrado · TuGameMaster' };

  return {
    title: `${perfil.user.name} · TuGameMaster`,
    description: perfil.gm.headline ?? undefined,
  };
}

/**
 * Un dato del bloque verificado.
 *
 * En el codigo va la etiqueta antes que la cifra, que es como se lee en voz
 * alta —«partidas dirigidas: una»—, y `order` las cambia de sitio para que a
 * la vista mande el numero. Al reves, un lector de pantalla suelta cifras
 * huerfanas antes de decir de que son.
 */
function Cifra({
  valor,
  titulo,
  nota,
}: {
  valor: string;
  titulo: string;
  nota?: string;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground order-2 mt-0.5 text-xs font-semibold tracking-widest uppercase">
        {titulo}
      </dt>
      <dd className="font-heading text-foreground order-1 text-2xl font-extrabold tabular-nums">
        {valor}
      </dd>
      {nota && <dd className="text-muted-foreground order-3 mt-1 text-xs">{nota}</dd>}
    </div>
  );
}

/** «septiembre de 2026», para la antigüedad. */
function mesYAno(fecha: Date): string {
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
    fecha,
  );
}

export default async function GmPage({ params }: Props) {
  const { slug } = await params;
  const perfil = await perfilPublicoGm(slug);

  if (!perfil) notFound();

  const {
    user,
    gm,
    reputacion,
    estadisticas,
    resenas,
    proximasPartidas,
    campanas,
    historial,
  } = perfil;

  const hayDeclarado = gm.yearsExperience !== null || gm.systems.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex flex-wrap items-start gap-5">
        <Avatar src={user.image} nombre={user.name} tamano={88} />

        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-foreground text-3xl font-extrabold sm:text-4xl">
            {user.name}
          </h1>

          {gm.headline && (
            <p className="text-muted-foreground mt-1.5 text-lg">{gm.headline}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Estrellas
              valor={reputacion.valoracionMedia}
              total={reputacion.totalResenas}
            />
            <span className="text-muted-foreground text-sm">
              En TuGameMaster desde {mesYAno(gm.createdAt)}
            </span>
          </div>

          {gm.languages.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">Dirige en:</span>
              {gm.languages.map((l) => (
                <Etiqueta key={l}>{nombreDeIdioma(l)}</Etiqueta>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Lo que certifica la plataforma ────────────────────────
          Esta es la pagina que decide si alguien le da 15 € a un
          desconocido, y lo que la ordena es una linea clara entre lo que
          no se puede falsear y lo que el GM cuenta de si mismo. Todo lo
          de este bloque sale de reservas pagadas aqui. */}
      <section className="border-accent/30 bg-accent/5 mt-8 rounded-sm border p-5">
        <h2 className="font-heading text-accent text-base font-bold">
          Lo que certificamos
        </h2>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <Cifra
            valor={String(reputacion.partidasDirigidas)}
            titulo="Partidas dirigidas"
            nota="Jugadas y cobradas aquí"
          />
          <Cifra
            valor={
              reputacion.valoracionMedia === null
                ? '—'
                : reputacion.valoracionMedia.toFixed(1)
            }
            titulo="Valoración"
            nota={
              reputacion.totalResenas === 1
                ? '1 reseña'
                : `${reputacion.totalResenas} reseñas`
            }
          />
          <Cifra
            valor={String(estadisticas.jugadoresDistintos)}
            titulo="Jugadores"
            nota={
              estadisticas.repetidores === 0
                ? 'Ninguno ha repetido aún'
                : `${estadisticas.repetidores} han repetido`
            }
          />
          <Cifra
            valor={String(estadisticas.partidasCanceladas)}
            titulo="Canceladas"
            nota="Con gente ya apuntada"
          />
        </dl>

        <p className="text-muted-foreground mt-5 text-xs">
          Estos números salen solo de partidas reservadas y pagadas en TuGameMaster.
          Únicamente valora quien pagó su plaza aquí, así que no se pueden inflar por
          fuera.
        </p>
      </section>

      {gm.about && (
        <section className="mt-10">
          <h2 className="font-heading text-foreground text-xl font-bold">Cómo dirige</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">
            {gm.about}
          </p>
        </section>
      )}

      {/* ── Lo que cuenta él ──────────────────────────────────────
          Deliberadamente mas callado que el bloque de arriba: sin marco
          ni color, y con la advertencia a la vista. Si los dos pesaran
          igual, «certificamos» dejaria de significar nada. */}
      {hayDeclarado && (
        <section className="mt-10">
          <h2 className="font-heading text-foreground text-xl font-bold">
            Lo que cuenta {user.name.split(' ')[0]}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Lo escribe quien dirige. No lo comprobamos.
          </p>

          <dl className="mt-4 flex flex-col gap-3">
            {gm.yearsExperience !== null && (
              <div className="border-border flex flex-wrap gap-x-3 border-t pt-3">
                <dt className="text-muted-foreground text-sm">Dirigiendo desde hace</dt>
                <dd className="text-foreground text-sm font-medium">
                  {gm.yearsExperience === 1 ? '1 año' : `${gm.yearsExperience} años`}
                </dd>
              </div>
            )}

            {gm.systems.length > 0 && (
              <div className="border-border flex flex-wrap items-center gap-2 border-t pt-3">
                <dt className="text-muted-foreground mr-1 text-sm">
                  Sistemas que domina
                </dt>
                <dd className="flex flex-wrap gap-2">
                  {gm.systems.map((s) => (
                    <Etiqueta key={s}>{s}</Etiqueta>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-heading text-foreground text-xl font-bold">
          Próximas partidas
        </h2>

        {proximasPartidas.length === 0 ? (
          <Vacio className="mt-4" titulo="No tiene mesas abiertas ahora mismo">
            Cuando publique una, aparecerá aquí.
          </Vacio>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proximasPartidas.map((p) => (
              <PartidaCard key={p.id} partida={p} />
            ))}
          </ul>
        )}
      </section>

      {campanas.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-foreground text-xl font-bold">Campañas</h2>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {campanas.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/campanas/${c.slug}`}
                  className="border-border bg-card hover:border-primary focus-visible:ring-ring focus-visible:ring-offset-background block h-full rounded-sm border p-4 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <span className="font-heading text-foreground block font-bold">
                    {c.title}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs">
                    {c._count.games === 1 ? '1 sesión' : `${c._count.games} sesiones`}
                    {c.isOpen ? '' : ' · cerrada'}
                  </span>
                  {c.summary && (
                    <span className="text-muted-foreground mt-2 line-clamp-3 block text-sm">
                      {c.summary}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-heading text-foreground text-xl font-bold">Reseñas</h2>

        {resenas.length === 0 ? (
          <Vacio className="mt-4" titulo="Todavía no tiene reseñas">
            Solo puede valorar quien reservó su plaza aquí y jugó la partida.
          </Vacio>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {resenas.map((r) => (
              <li key={r.id} className="border-border bg-card rounded-sm border p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={r.author.image} nombre={r.author.name} tamano={32} />
                  <div className="min-w-0">
                    <Link
                      href={`/u/${r.author.slug}`}
                      className="text-foreground text-sm font-medium hover:underline"
                    >
                      {r.author.name}
                    </Link>
                    <p className="text-muted-foreground text-xs">{r.game.title}</p>
                  </div>
                  <span aria-label={`${r.rating} de 5`} className="text-accent ml-auto">
                    {'★'.repeat(r.rating)}
                    <span className="text-border">{'★'.repeat(5 - r.rating)}</span>
                  </span>
                </div>

                {r.comment && (
                  <p className="text-muted-foreground mt-3 whitespace-pre-line">
                    {r.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {historial.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-foreground text-xl font-bold">
            Partidas ya dirigidas
          </h2>

          <ul className="border-border divide-border mt-4 divide-y rounded-sm border">
            {historial.map((p) => (
              <li key={p.id} className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/partidas/${p.slug}`}
                    className="text-foreground text-sm font-medium hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {p.system} · <Fecha valor={p.startsAt} />
                    {p.campaign && (
                      <>
                        {' · '}
                        <Link
                          href={`/campanas/${p.campaign.slug}`}
                          className="hover:underline"
                        >
                          {p.campaign.title}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <span className="text-muted-foreground ml-auto self-center text-xs">
                  {p._count.bookings} {p._count.bookings === 1 ? 'jugador' : 'jugadores'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
