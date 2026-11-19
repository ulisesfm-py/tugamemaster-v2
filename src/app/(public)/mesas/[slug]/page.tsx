import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Lamina } from '@/components/lamina';
import { ReservarBoton } from '@/components/reservar-boton';
import { Avatar, Aviso, EnlaceBoton, Fundador, Precio } from '@/components/ui';
import { auth } from '@/lib/auth';
import {
  borrarPreReservaAction,
  preReservarAction,
} from '@/modules/convocatorias/actions';
import {
  DIAS_MINIMOS_DE_ANTELACION,
  HORAS_PARA_RESERVAR,
  describirFranja,
} from '@/modules/convocatorias/politica';
import { detalleMesaFlexible } from '@/modules/convocatorias/queries';
import {
  EXPERIENCIA,
  etiquetasPorGrupo,
  idiomasDeLaMesa,
  textoDeEdad,
} from '@/modules/games/ficha';
import { slugDeSistema } from '@/modules/games/sistemas';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mesa = await detalleMesaFlexible(slug);

  if (!mesa) return { title: 'Mesa no encontrada · TuGameMaster' };

  return {
    title: `${mesa.title} · TuGameMaster`,
    description: mesa.description.slice(0, 160),
  };
}

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

/**
 * La pagina publica de una mesa con fecha flexible.
 *
 * Tiene el mismo orden que la de una partida —lamina, cabecera, precio y
 * boton a un lado, ficha y descripcion al otro— para que se lea igual. Cambia
 * lo que dice el lateral: aqui no se reserva ni se paga, se pre-reserva, y se
 * explica en tres pasos que pasa despues.
 *
 * El boton dice «Pre-reservar», nunca «gratis»: alguien podria entender que
 * la partida lo es.
 */
export default async function MesaFlexiblePage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const mesa = await detalleMesaFlexible(slug, session?.user.id);

  if (!mesa) notFound();

  // Convocada, la mesa ya es una partida con fecha: se reserva alli.
  if (mesa.status === 'CONVOCADA' && mesa.game) redirect(`/partidas/${mesa.game.slug}`);

  // Un borrador o una cerrada solo la ve su autor.
  if (mesa.status !== 'ABIERTA' && !mesa.esMia) notFound();

  const apuntados = mesa._count.preReservas;
  const faltan = Math.max(0, mesa.minPlayers - apuntados);
  const llena = apuntados >= mesa.seatsTotal;
  const experiencia = EXPERIENCIA[mesa.experience];
  const edad = textoDeEdad(mesa.minAge);
  const idiomas = idiomasDeLaMesa(mesa.languages, mesa.gm.languages);
  const grupos = etiquetasPorGrupo(mesa.tags);
  const campos = { convocatoriaId: mesa.id, slug: mesa.slug };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {mesa.status === 'BORRADOR' && (
        <Aviso tono="atencion" className="mb-6" titulo="Esto es un borrador">
          Solo tú puedes verlo. Nadie más lo encontrará hasta que lo publiques.
        </Aviso>
      )}
      {mesa.status === 'CERRADA' && (
        <Aviso tono="dato" className="mb-6" titulo="Mesa cerrada">
          La cerraste sin fijar fecha. Solo tú puedes verla.
        </Aviso>
      )}

      <div className="from-accent/20 to-background relative grid aspect-[16/9] place-items-center overflow-hidden rounded-sm bg-gradient-to-br sm:aspect-[3/1]">
        <Lamina
          src={mesa.imageUrl}
          system={mesa.system}
          sizes="(max-width: 1024px) 100vw, 64rem"
          priority
          claseTexto="text-3xl sm:text-5xl"
        />
      </div>

      <header className="mt-6">
        <p className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <span className="text-flexible">Fecha flexible</span>
          <Link
            href={`/sistemas/${slugDeSistema(mesa.system)}`}
            className="text-accent hover:underline"
          >
            {mesa.system}
          </Link>
        </p>
        <h1 className="font-heading text-foreground mt-2 text-3xl font-extrabold text-balance sm:text-4xl">
          {mesa.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{describirFranja(mesa)}</p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
          <div className="border-border bg-card rounded-sm border p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-heading text-foreground text-3xl font-extrabold tabular-nums">
                <Precio cents={mesa.priceCents} currency={mesa.currency} />
              </p>
              <p className="text-muted-foreground text-sm">por plaza</p>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Se paga al reservar, cuando ya haya fecha. Pre-reservar no tiene cargo.
            </p>

            <p
              className={`mt-3 text-sm font-semibold ${faltan === 1 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {llena
                ? 'Todas las plazas pre-reservadas'
                : faltan > 0
                  ? `${apuntados} de ${mesa.minPlayers} para poder jugar`
                  : `Mínimo alcanzado · ${apuntados} de ${mesa.seatsTotal} plazas`}
            </p>

            <div className="mt-5">
              {mesa.esMia ? (
                <EnlaceBoton
                  href={`/cuenta/partidas/flexibles/${mesa.id}`}
                  variante="perfil"
                  className="w-full"
                >
                  Gestionar mi mesa
                </EnlaceBoton>
              ) : !session?.user ? (
                <EnlaceBoton href="/login" tamano="lg" className="w-full">
                  Inicia sesión para pre-reservar
                </EnlaceBoton>
              ) : mesa.miPreReserva ? (
                <>
                  <Aviso tono="exito" className="mb-3">
                    Tienes una pre-reserva. Te escribiremos cuando haya fecha.
                  </Aviso>
                  <ReservarBoton
                    accion={borrarPreReservaAction}
                    texto="Borrar mi pre-reserva"
                    destructivo
                    completo
                    campos={campos}
                  />
                </>
              ) : llena ? (
                <p className="text-muted-foreground text-sm">
                  No quedan plazas. Si alguien se borra, aparecerá aquí.
                </p>
              ) : (
                <ReservarBoton
                  accion={preReservarAction}
                  texto="Pre-reservar"
                  tamano="lg"
                  completo
                  campos={campos}
                />
              )}
            </div>
          </div>

          {/* Cómo funciona, junto al botón: es donde surge la duda de «¿y esto
              qué me compromete?». Las cifras salen de politica.ts. */}
          <div className="border-flexible/40 mt-4 rounded-sm border border-dashed p-4">
            <h2 className="text-foreground text-sm font-semibold">Cómo funciona</h2>
            <ol className="text-muted-foreground mt-2 flex list-decimal flex-col gap-1.5 pl-4 text-xs">
              <li>
                Pre-reservas tu plaza. No pagas nada y puedes borrarte cuando quieras.
              </li>
              <li>
                {`Al llegar a ${mesa.minPlayers}, el game master fija la fecha, con al menos ${DIAS_MINIMOS_DE_ANTELACION} días de margen. Te avisamos por correo.`}
              </li>
              <li>
                {`Tienes ${HORAS_PARA_RESERVAR} horas para reservar y pagar tu plaza; solo pueden hacerlo quienes se pre-reservaron. Si la fecha no te encaja, no reserves y ya está.`}
              </li>
            </ol>
          </div>
        </aside>

        <div className="flex flex-col gap-10 lg:col-start-1 lg:row-start-1">
          <section>
            <h2 className="font-heading text-foreground text-xl font-bold">
              La mesa, en corto
            </h2>
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Dato titulo="Cuándo">
                Fecha por fijar
                <span className="text-muted-foreground block text-xs">
                  {describirFranja(mesa)}
                </span>
              </Dato>
              <Dato titulo="Experiencia">
                {experiencia.titulo}
                <span className="text-muted-foreground block text-xs">
                  {experiencia.explicacion}
                </span>
              </Dato>
              <Dato titulo="Idioma">{idiomas.join(', ')}</Dato>
              <Dato titulo="Plazas">
                {mesa.seatsTotal} en total, mínimo {mesa.minPlayers} para jugar
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
              {mesa.description}
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-xl font-bold">
              Quién la dirige
            </h2>
            <Link
              href={`/gm/${mesa.gm.user.slug}`}
              className="border-border bg-card hover:border-primary focus-visible:ring-ring focus-visible:ring-offset-background mt-4 flex items-start gap-4 rounded-sm border p-4 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Avatar
                src={mesa.gm.user.image}
                nombre={mesa.gm.user.name}
                tamano={56}
                fundador={mesa.gm.plan === 'FUNDADOR'}
              />
              <span className="min-w-0 flex-1">
                <span className="font-heading text-foreground flex flex-wrap items-center gap-2 font-bold">
                  {mesa.gm.user.name}
                  {mesa.gm.plan === 'FUNDADOR' && <Fundador />}
                </span>
                {mesa.gm.headline && (
                  <span className="text-muted-foreground mt-0.5 block text-sm">
                    {mesa.gm.headline}
                  </span>
                )}
              </span>
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
